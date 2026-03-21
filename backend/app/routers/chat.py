import logging
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, ChatMessage
from app.schemas import ChatRequest, ChatResponse, ChatMessageResponse
from app.services.auth import get_current_user
from app.services.ai_assistant import get_ai_response, VALID_PROFILE_FIELDS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


def _apply_profile_updates(user: User, updates: dict, db: Session) -> None:
    for field, value in updates.items():
        if field in VALID_PROFILE_FIELDS and value:
            setattr(user, field, value)

    required = [user.name, user.email, user.company, user.role]
    if all(required):
        user.profile_completed = True

    db.commit()
    db.refresh(user)
    logger.info("Profile auto-updated for user %s: %s", user.id, list(updates.keys()))


@router.post("", response_model=ChatResponse)
def send_message(
    req: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    user_msg = ChatMessage(user_id=current_user.id, role="user", content=req.message)
    db.add(user_msg)
    db.commit()

    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    conversation = [{"role": m.role, "content": m.content} for m in history]

    result = get_ai_response(current_user, conversation)
    reply_text = result["reply"]

    updated_fields: list[str] = []
    if result["profile_updates"]:
        _apply_profile_updates(current_user, result["profile_updates"], db)
        updated_fields = list(result["profile_updates"].keys())

    assistant_msg = ChatMessage(user_id=current_user.id, role="assistant", content=reply_text)
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    all_messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at)
        .all()
    )

    return ChatResponse(
        reply=reply_text,
        messages=[ChatMessageResponse.model_validate(m) for m in all_messages],
        profile_updated=len(updated_fields) > 0,
        updated_fields=updated_fields,
    )


@router.get("/history", response_model=list[ChatMessageResponse])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at)
        .all()
    )
    return [ChatMessageResponse.model_validate(m) for m in messages]


@router.delete("/history")
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()
    return {"status": "ok"}
