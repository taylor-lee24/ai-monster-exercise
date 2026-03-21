from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import RecommendationResponse, ArticleResponse
from app.services.auth import get_current_user
from app.services.recommendations import get_recommendations

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("", response_model=RecommendationResponse)
def recommend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    articles, reasoning = get_recommendations(db, current_user)
    return RecommendationResponse(
        articles=[ArticleResponse.model_validate(a) for a in articles],
        reasoning=reasoning,
    )
