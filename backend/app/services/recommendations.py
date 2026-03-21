import logging
import random

from sqlalchemy.orm import Session

from app.models import User, Article

logger = logging.getLogger(__name__)

ROLE_TAG_MAP = {
    "engineer": ["engineering", "technology", "coding", "software", "devops"],
    "developer": ["engineering", "technology", "coding", "software", "web-development"],
    "designer": ["design", "ux", "creativity", "product"],
    "manager": ["management", "leadership", "strategy", "productivity"],
    "product": ["product", "strategy", "analytics", "ux"],
    "data": ["data-science", "analytics", "machine-learning", "technology"],
    "marketing": ["marketing", "growth", "analytics", "content"],
    "sales": ["sales", "growth", "communication", "strategy"],
    "executive": ["leadership", "strategy", "management", "business"],
    "cto": ["technology", "leadership", "engineering", "strategy"],
    "ceo": ["leadership", "strategy", "business", "growth"],
}

INDUSTRY_TAG_MAP = {
    "technology": ["technology", "software", "coding", "devops"],
    "healthcare": ["healthcare", "data-science", "compliance"],
    "finance": ["finance", "analytics", "compliance", "data-science"],
    "education": ["education", "content", "communication"],
    "retail": ["marketing", "growth", "analytics", "e-commerce"],
    "media": ["content", "marketing", "creativity", "design"],
}

LEVEL_TAG_MAP = {
    "junior": ["career-growth", "learning", "coding", "fundamentals"],
    "mid": ["career-growth", "engineering", "best-practices"],
    "senior": ["architecture", "leadership", "mentoring", "strategy"],
    "lead": ["leadership", "management", "architecture", "strategy"],
    "executive": ["leadership", "strategy", "business", "vision"],
}


def _extract_keywords(user: User) -> list[str]:
    """Build a keyword list from user profile."""
    tags: set[str] = set()

    if user.role:
        role_lower = user.role.lower()
        for key, values in ROLE_TAG_MAP.items():
            if key in role_lower:
                tags.update(values)

    if user.industry:
        industry_lower = user.industry.lower()
        for key, values in INDUSTRY_TAG_MAP.items():
            if key in industry_lower:
                tags.update(values)

    if user.experience_level:
        level_tags = LEVEL_TAG_MAP.get(user.experience_level.lower(), [])
        tags.update(level_tags)

    if not tags:
        tags = {"technology", "career-growth", "productivity", "leadership"}

    return list(tags)


def _score_article(article: Article, keywords: set[str]) -> int:
    article_tag_names = {t.name.lower() for t in article.tags}
    score = len(article_tag_names & keywords)
    if article.category and article.category.lower() in keywords:
        score += 2
    return score


def get_recommendations(
    db: Session, user: User, limit: int = 5
) -> tuple[list[Article], str]:
    keywords = _extract_keywords(user)
    keyword_set = set(keywords)

    all_articles = db.query(Article).all()

    scored: list[tuple[Article, int]] = []
    for article in all_articles:
        score = _score_article(article, keyword_set)
        if score > 0:
            scored.append((article, score))

    scored.sort(key=lambda x: x[1], reverse=True)

    # Try to enrich with live Dev.to articles
    try:
        from app.services.article_fetcher import fetch_devto_articles

        live_articles = fetch_devto_articles(db, keywords)
        existing_ids = {a.id for a, _ in scored}
        for article in live_articles:
            if article.id in existing_ids:
                continue
            score = _score_article(article, keyword_set)
            if score > 0:
                scored.append((article, score))
                existing_ids.add(article.id)

        scored.sort(key=lambda x: x[1], reverse=True)
    except Exception as exc:
        logger.warning("Live article fetch skipped: %s", exc)

    # Pick from a larger candidate pool, then randomly sample
    pool_size = min(len(scored), limit * 3)
    candidate_pool = [a for a, _ in scored[:pool_size]]

    if len(candidate_pool) > limit:
        top_articles = random.sample(candidate_pool, limit)
    else:
        top_articles = list(candidate_pool)

    random.shuffle(top_articles)

    if not top_articles:
        fallback = db.query(Article).limit(limit).all()
        random.shuffle(fallback)
        top_articles = fallback

    parts = []
    if user.role:
        parts.append(f"your role as {user.role}")
    if user.industry:
        parts.append(f"the {user.industry} industry")
    if user.experience_level:
        parts.append(f"your {user.experience_level}-level experience")

    reasoning = (
        f"Based on {', '.join(parts)}, we matched these articles using tags: "
        f"{', '.join(keywords[:6])}."
        if parts
        else "Here are some popular articles to get you started!"
    )

    return top_articles, reasoning
