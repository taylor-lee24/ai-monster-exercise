import logging
from datetime import datetime, timezone, timedelta

import httpx
from sqlalchemy.orm import Session

from app.models import Article, Tag

logger = logging.getLogger(__name__)

DEVTO_API = "https://dev.to/api/articles"
CACHE_HOURS = 24

KEYWORD_TO_DEVTO_TAG: dict[str, str] = {
    "engineering": "programming",
    "technology": "technology",
    "coding": "beginners",
    "software": "software",
    "devops": "devops",
    "web-development": "webdev",
    "design": "design",
    "ux": "ux",
    "management": "management",
    "leadership": "leadership",
    "data-science": "datascience",
    "machine-learning": "machinelearning",
    "analytics": "analytics",
    "marketing": "marketing",
    "career-growth": "career",
    "learning": "learning",
    "architecture": "architecture",
    "productivity": "productivity",
    "product": "productivity",
    "finance": "finance",
    "healthcare": "health",
    "education": "tutorial",
    "best-practices": "bestpractices",
    "fundamentals": "beginners",
    "strategy": "startup",
    "business": "startup",
    "content": "writing",
    "compliance": "security",
    "mentoring": "career",
    "vision": "leadership",
    "growth": "growth",
    "sales": "startup",
    "communication": "career",
    "creativity": "design",
    "e-commerce": "ecommerce",
}


def _get_cached_articles(db: Session) -> list[Article] | None:
    """Return cached Dev.to articles if they're still fresh, else None."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_HOURS)
    cached = (
        db.query(Article)
        .filter(Article.source == "devto", Article.fetched_at > cutoff)
        .all()
    )
    return cached if cached else None


def _clear_stale_cache(db: Session) -> None:
    cutoff = datetime.now(timezone.utc) - timedelta(hours=CACHE_HOURS)
    stale = (
        db.query(Article)
        .filter(Article.source == "devto", Article.fetched_at <= cutoff)
        .all()
    )
    for article in stale:
        article.tags.clear()
        db.delete(article)
    if stale:
        db.commit()


def _resolve_devto_tags(keywords: list[str]) -> list[str]:
    tags = []
    seen = set()
    for kw in keywords:
        mapped = KEYWORD_TO_DEVTO_TAG.get(kw)
        if mapped and mapped not in seen:
            tags.append(mapped)
            seen.add(mapped)
    if not tags:
        tags = ["programming", "technology"]
    return tags


def _store_article(db: Session, item: dict, tag_cache: dict[str, Tag]) -> Article:
    now = datetime.now(timezone.utc)
    article = Article(
        title=item.get("title", "")[:300],
        summary=(item.get("description") or "")[:500],
        url=item.get("url", ""),
        author=(item.get("user") or {}).get("name", ""),
        category=None,
        source="devto",
        fetched_at=now,
    )
    db.add(article)

    for tag_name in (item.get("tag_list") or [])[:5]:
        lower = tag_name.lower().strip()
        if not lower:
            continue
        if lower not in tag_cache:
            existing = db.query(Tag).filter(Tag.name == lower).first()
            if not existing:
                existing = Tag(name=lower)
                db.add(existing)
                db.flush()
            tag_cache[lower] = existing
        article.tags.append(tag_cache[lower])

    return article


def fetch_devto_articles(
    db: Session, keywords: list[str], limit: int = 15
) -> list[Article]:
    """Fetch fresh articles from Dev.to matching *keywords*, with 24-hour DB cache."""
    cached = _get_cached_articles(db)
    if cached:
        return cached

    _clear_stale_cache(db)

    devto_tags = _resolve_devto_tags(keywords)
    fetched: list[Article] = []
    seen_urls: set[str] = set()
    tag_cache: dict[str, Tag] = {}

    for tag in devto_tags[:3]:
        try:
            resp = httpx.get(
                DEVTO_API,
                params={"tag": tag, "per_page": 5, "top": 7},
                timeout=5.0,
                headers={"Accept": "application/json"},
            )
            resp.raise_for_status()

            for item in resp.json():
                url = item.get("url", "")
                if not url or url in seen_urls:
                    continue
                seen_urls.add(url)
                article = _store_article(db, item, tag_cache)
                fetched.append(article)

                if len(fetched) >= limit:
                    break
        except Exception as e:
            logger.warning("Dev.to fetch failed for tag '%s': %s", tag, e)

        if len(fetched) >= limit:
            break

    if fetched:
        db.commit()
        logger.info("Cached %d fresh articles from Dev.to", len(fetched))

    return fetched
