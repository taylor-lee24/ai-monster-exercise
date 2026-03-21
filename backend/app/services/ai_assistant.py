import json
import logging
from openai import OpenAI
from app.config import get_settings
from app.models import User

logger = logging.getLogger(__name__)

settings = get_settings()
client = OpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

if client:
    logger.info("OpenAI client ready")
else:
    logger.warning("No OPENAI_API_KEY — running in fallback mode")

SYSTEM_PROMPT = """You are a helpful, knowledgeable AI assistant embedded in ProConnect, a business networking platform.
You can answer ANY question the user asks — just like ChatGPT. Topics like weather, history, science, coding, math, current events, advice, and anything else are all fair game.

You also have a secondary role: helping the user complete their profile. The profile fields are: name, pronouns, company, role, bio, industry, experience_level.
- When the user provides profile info, call the update_user_profile tool to save it.
- Pronouns: he/him, she/her, other, prefer-not.
- Industries: Technology, Software Development, Healthcare, Finance, Education, Retail, Media, Manufacturing, Consulting, Government, Other. When the user asks for the industry list, show ALL of these options.
- Experience levels: junior, mid, senior, lead, executive.
- If there are missing profile fields and the conversation has a natural pause, you may gently remind the user — but NEVER force it. Answer their actual question first.

Style:
- Be warm, smart, and concise.
- Use **bold** and markdown formatting when helpful.
- Answer the user's question directly and accurately. Do NOT redirect every answer back to profile completion."""

PROFILE_TOOL = {
    "type": "function",
    "function": {
        "name": "update_user_profile",
        "description": "Save profile info the user provided. Call whenever the user shares any profile data.",
        "parameters": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Full name"},
                "pronouns": {"type": "string", "enum": ["he/him", "she/her", "other", "prefer-not"]},
                "company": {"type": "string", "description": "Company or organization"},
                "role": {"type": "string", "description": "Job title or role"},
                "bio": {"type": "string", "description": "Brief bio"},
                "industry": {"type": "string", "enum": ["Technology", "Software Development", "Healthcare", "Finance", "Education", "Retail", "Media", "Manufacturing", "Consulting", "Government", "Other"], "description": "Industry"},
                "experience_level": {"type": "string", "enum": ["junior", "mid", "senior", "lead", "executive"]},
            },
            "additionalProperties": False,
        },
    },
}

VALID_PROFILE_FIELDS = {"name", "pronouns", "company", "role", "bio", "industry", "experience_level"}


def _missing_fields(user: User) -> list[str]:
    return [f for f in VALID_PROFILE_FIELDS if not getattr(user, f, None)]


def _profile_context(user: User) -> str:
    filled = {f: getattr(user, f) for f in VALID_PROFILE_FIELDS if getattr(user, f, None)}
    missing = _missing_fields(user)
    ctx = f"Filled: {filled}\n" if filled else ""
    ctx += f"Missing: {', '.join(missing)}\n" if missing else "All fields complete!\n"
    return ctx


def get_ai_response(user: User, conversation_history: list[dict]) -> dict:
    """Returns {"reply": str, "profile_updates": dict | None}."""

    if not client:
        return _fallback(user, conversation_history)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + _profile_context(user)},
        *[{"role": m["role"], "content": m["content"]} for m in conversation_history[-20:]],
    ]

    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            tools=[PROFILE_TOOL],
            max_tokens=1000,
            temperature=0.7,
        )

        msg = resp.choices[0].message
        updates = None

        if msg.tool_calls:
            for tc in msg.tool_calls:
                if tc.function.name == "update_user_profile":
                    try:
                        raw = json.loads(tc.function.arguments)
                        updates = {k: v for k, v in raw.items() if k in VALID_PROFILE_FIELDS and v}
                    except json.JSONDecodeError:
                        logger.warning("Bad tool args: %s", tc.function.arguments)

            messages.append(msg)
            for tc in msg.tool_calls:
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": "Saved!" if updates else "No changes.",
                })
            follow = client.chat.completions.create(
                model="gpt-4o-mini", messages=messages, max_tokens=1000, temperature=0.7,
            )
            text = follow.choices[0].message.content or "Done! I've updated your profile."
        else:
            text = msg.content

        return {"reply": text, "profile_updates": updates or None}

    except Exception as e:
        logger.error("OpenAI error: %s", e, exc_info=True)
        return _fallback(user, conversation_history)


# ------------------------------------------------------------------
# Simple fallback — works without OpenAI
# ------------------------------------------------------------------

INDUSTRIES = [
    "Technology", "Software Development", "Healthcare", "Finance",
    "Education", "Retail", "Media", "Manufacturing", "Consulting",
    "Government", "Other",
]

FIELD_ORDER = ["name", "pronouns", "company", "role", "industry", "experience_level", "bio"]

FIELD_LABELS = {
    "name": "Name", "pronouns": "Pronouns", "company": "Company",
    "role": "Role", "bio": "Bio", "industry": "Industry",
    "experience_level": "Experience Level",
}

QUESTIONS = {
    "name": "What's your **name**?",
    "pronouns": "What are your preferred **pronouns**? (he/him, she/her, other, or prefer not to say)",
    "company": "Which **company** or organization are you with?",
    "role": "What's your current **job title** or role?",
    "industry": "What **industry** do you work in? Options: Technology, Software Development, Healthcare, Finance, Education, Retail, Media, Manufacturing, Consulting, Government, or Other.",
    "experience_level": "What's your **experience level**? (junior, mid, senior, lead, or executive)",
    "bio": "Tell me a bit **about yourself** — a sentence or two is perfect!",
}

PREFIXES_TO_STRIP = [
    "my name is ", "i'm ", "i am ", "call me ", "it's ",
    "my company is ", "i work at ", "i work for ",
    "my role is ", "i'm a ", "i am a ", "i work as ",
    "my job is ", "my title is ",
    "my industry is ", "i work in ", "i'm in ",
]


def _parse_answer(field: str, text: str) -> dict | None:
    """Try to extract a value for the given field from the user's text."""
    cleaned = text.strip().rstrip(".!,")
    if not cleaned:
        return None

    # Pronouns — match known values
    if field == "pronouns":
        low = cleaned.lower()
        if "he/him" in low or "he him" in low:
            return {"pronouns": "he/him"}
        if "she/her" in low or "she her" in low:
            return {"pronouns": "she/her"}
        if "prefer not" in low or "prefer-not" in low:
            return {"pronouns": "prefer-not"}
        if "other" in low:
            return {"pronouns": "other"}
        return None

    # Industry — match known values
    if field == "industry":
        low = cleaned.lower()
        for ind in INDUSTRIES:
            if ind.lower() in low:
                return {"industry": ind}
        return None

    # Experience level — match known values
    if field == "experience_level":
        low = cleaned.lower()
        for lvl in ["junior", "mid", "senior", "lead", "executive"]:
            if lvl in low:
                return {"experience_level": lvl}
        return None

    # All other fields — strip common prefixes and use as value
    low = cleaned.lower()
    for prefix in PREFIXES_TO_STRIP:
        if low.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip().rstrip(".!,")
            break

    if cleaned and len(cleaned) < 300:
        return {field: cleaned}

    return None


def _which_field_was_asked(history: list[dict], missing: list[str]) -> str | None:
    """Look at the last bot message to figure out which field it was asking."""
    for msg in reversed(history):
        if msg["role"] == "assistant":
            low = msg["content"].lower()
            hints = {
                "name": ["name"],
                "pronouns": ["pronoun"],
                "company": ["company", "organization"],
                "role": ["role", "job title", "title"],
                "industry": ["industry"],
                "experience_level": ["experience", "level"],
                "bio": ["bio", "about yourself", "about you"],
            }
            for field in missing:
                if any(h in low for h in hints.get(field, [])):
                    return field
            break
    return missing[0] if missing else None


def _is_question_or_greeting(text: str) -> bool:
    low = text.lower().strip()
    if low.endswith("?"):
        return True
    starters = [
        "hi", "hey", "hello", "help", "what ", "which ", "how ",
        "can you", "could you", "tell me", "i need", "i want",
        "i just signed", "i'd like", "i would like",
    ]
    return any(low.startswith(s) for s in starters)


def _fallback(user: User, history: list[dict]) -> dict:
    missing = [f for f in FIELD_ORDER if not getattr(user, f, None)]

    # Get the last user message
    last_msg = None
    for msg in reversed(history):
        if msg["role"] == "user":
            last_msg = msg["content"]
            break

    # If user asked a question or said hello, just answer helpfully
    if not last_msg or _is_question_or_greeting(last_msg):
        if not missing:
            return {
                "reply": "Your profile is **complete**! Check out the **For You** tab for personalized recommendations.",
                "profile_updates": None,
            }
        labels = [FIELD_LABELS[f] for f in missing]
        first_q = QUESTIONS[missing[0]]
        if len(missing) == 1:
            return {
                "reply": f"Almost there! Just one field left: **{labels[0]}**. {first_q}",
                "profile_updates": None,
            }
        return {
            "reply": f"You still need: **{', '.join(labels)}**. Let's start — {first_q}",
            "profile_updates": None,
        }

    # User gave an answer — figure out which field and parse it
    asked = _which_field_was_asked(history, missing)
    if asked:
        parsed = _parse_answer(asked, last_msg)
        if parsed:
            remaining = [f for f in missing if f not in parsed]
            saved = ", ".join(FIELD_LABELS.get(k, k) for k in parsed)
            if remaining:
                next_q = QUESTIONS[remaining[0]]
                return {
                    "reply": f"Got it, **{saved}** saved! {next_q}",
                    "profile_updates": parsed,
                }
            return {
                "reply": f"**{saved}** saved — your profile is now **complete**! Check out the **For You** tab for personalized recommendations.",
                "profile_updates": parsed,
            }

    # Couldn't parse — gently re-ask
    if missing:
        return {
            "reply": f"I didn't quite catch that. {QUESTIONS[missing[0]]}",
            "profile_updates": None,
        }

    return {
        "reply": "Your profile is **complete**! Check out the **For You** tab for personalized recommendations.",
        "profile_updates": None,
    }
