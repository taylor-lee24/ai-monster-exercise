from sqlalchemy.orm import Session
from app.models import Article, Tag

ARTICLES = [
    {
        "title": "10 Principles of Modern Software Architecture",
        "summary": "A deep dive into microservices, event-driven design, and scalable system patterns used by top tech companies.",
        "url": "https://martinfowler.com/articles/microservices.html",
        "author": "Sarah Chen",
        "category": "engineering",
        "tags": ["engineering", "architecture", "software", "technology"],
    },
    {
        "title": "The Manager's Guide to Running Effective 1:1s",
        "summary": "How engineering managers can build trust, give feedback, and drive team performance through structured one-on-ones.",
        "url": "https://hbr.org/2016/02/how-to-make-your-one-on-ones-with-employees-more-productive",
        "author": "James Rivera",
        "category": "management",
        "tags": ["management", "leadership", "communication"],
    },
    {
        "title": "Introduction to Machine Learning for Business Leaders",
        "summary": "Understand how ML models work, when to apply them, and how to measure ROI on AI initiatives.",
        "url": "https://hbr.org/2017/07/the-business-of-artificial-intelligence",
        "author": "Dr. Priya Patel",
        "category": "data-science",
        "tags": ["machine-learning", "data-science", "business", "strategy"],
    },
    {
        "title": "UX Design Patterns That Convert",
        "summary": "Evidence-based design patterns for signup flows, onboarding, and feature discovery that increase user retention.",
        "url": "https://www.nngroup.com/articles/ten-usability-heuristics/",
        "author": "Maria Santos",
        "category": "design",
        "tags": ["design", "ux", "product", "growth"],
    },
    {
        "title": "Building a Growth Engine: Marketing Strategies for SaaS",
        "summary": "From content marketing to PLG, a practical playbook for growing a B2B SaaS product.",
        "url": "https://www.lennysnewsletter.com/p/what-is-good-retention-issue-29",
        "author": "Alex Thompson",
        "category": "marketing",
        "tags": ["marketing", "growth", "strategy", "content"],
    },
    {
        "title": "DevOps Best Practices: CI/CD Pipeline Design",
        "summary": "How to design, implement, and maintain CI/CD pipelines that improve deployment velocity and reliability.",
        "url": "https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment",
        "author": "Kevin Park",
        "category": "engineering",
        "tags": ["devops", "engineering", "technology", "best-practices"],
    },
    {
        "title": "Data Analytics: From Raw Data to Actionable Insights",
        "summary": "A framework for building analytics pipelines that deliver real business value and drive decision-making.",
        "url": "https://hbr.org/2012/10/data-scientist-the-sexiest-job-of-the-21st-century",
        "author": "Lisa Zhang",
        "category": "analytics",
        "tags": ["analytics", "data-science", "business", "technology"],
    },
    {
        "title": "The Art of Technical Leadership",
        "summary": "Transitioning from individual contributor to tech lead: communication, architecture decisions, and team enablement.",
        "url": "https://www.patkua.com/blog/the-definition-of-a-tech-lead/",
        "author": "Marcus Johnson",
        "category": "leadership",
        "tags": ["leadership", "engineering", "mentoring", "career-growth"],
    },
    {
        "title": "React Performance Optimization Techniques",
        "summary": "Memoization, lazy loading, virtualization, and other patterns to make React apps blazing fast.",
        "url": "https://react.dev/learn/render-and-commit",
        "author": "Emily Watson",
        "category": "engineering",
        "tags": ["coding", "web-development", "technology", "best-practices"],
    },
    {
        "title": "Financial Modeling for Tech Startups",
        "summary": "Build investor-ready financial models covering revenue projections, unit economics, and burn rate analysis.",
        "url": "https://hbr.org/2014/11/a-refresher-on-net-present-value",
        "author": "David Kim",
        "category": "finance",
        "tags": ["finance", "business", "strategy", "analytics"],
    },
    {
        "title": "Healthcare Data Privacy and Compliance",
        "summary": "Navigating HIPAA, GDPR, and emerging regulations when building healthcare technology products.",
        "url": "https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html",
        "author": "Dr. Rachel Green",
        "category": "healthcare",
        "tags": ["healthcare", "compliance", "data-science", "technology"],
    },
    {
        "title": "Building Your Personal Brand as a Developer",
        "summary": "How open source, blogging, and conference talks can accelerate your career and open new opportunities.",
        "url": "https://stackoverflow.blog/2020/01/09/how-to-build-your-developer-brand/",
        "author": "Tom Bradley",
        "category": "career",
        "tags": ["career-growth", "communication", "content", "learning"],
    },
    {
        "title": "Python for Data Science: Advanced Techniques",
        "summary": "Beyond pandas and numpy — advanced Python patterns for data manipulation, visualization, and model deployment.",
        "url": "https://realpython.com/pandas-python-explore-dataset/",
        "author": "Anna Kowalski",
        "category": "data-science",
        "tags": ["coding", "data-science", "technology", "learning"],
    },
    {
        "title": "Product Strategy: Finding Product-Market Fit",
        "summary": "Frameworks for validating assumptions, running experiments, and pivoting when needed to find PMF.",
        "url": "https://review.firstround.com/how-superhuman-built-an-engine-to-find-product-market-fit",
        "author": "Chris Morgan",
        "category": "product",
        "tags": ["product", "strategy", "growth", "business"],
    },
    {
        "title": "Effective Sales Techniques for Technical Products",
        "summary": "Selling complex solutions: discovery calls, demos, objection handling, and enterprise closing strategies.",
        "url": "https://hbr.org/2012/07/the-end-of-solution-sales",
        "author": "Nicole Adams",
        "category": "sales",
        "tags": ["sales", "communication", "growth", "strategy"],
    },
    {
        "title": "Cloud Architecture: AWS vs Azure vs GCP",
        "summary": "A comprehensive comparison of major cloud platforms with guidance on choosing the right one for your workload.",
        "url": "https://cloud.google.com/docs/get-started",
        "author": "Robert Kim",
        "category": "engineering",
        "tags": ["technology", "architecture", "devops", "engineering"],
    },
    {
        "title": "The Executive Guide to Digital Transformation",
        "summary": "Leading organizational change through technology: culture, process, and tooling strategies for C-suite leaders.",
        "url": "https://hbr.org/2019/03/digital-transformation-is-not-about-technology",
        "author": "Diana Morrison",
        "category": "leadership",
        "tags": ["leadership", "strategy", "business", "vision"],
    },
    {
        "title": "E-commerce Analytics: Metrics That Matter",
        "summary": "Key KPIs for online retail: conversion funnels, LTV, CAC, and attribution modeling.",
        "url": "https://www.shopify.com/blog/ecommerce-analytics",
        "author": "Michael Lee",
        "category": "analytics",
        "tags": ["e-commerce", "analytics", "marketing", "growth"],
    },
    {
        "title": "API Design Best Practices: RESTful and GraphQL",
        "summary": "Designing APIs that developers love: versioning, pagination, error handling, and documentation.",
        "url": "https://swagger.io/resources/articles/best-practices-in-api-design/",
        "author": "Sarah O'Brien",
        "category": "engineering",
        "tags": ["engineering", "software", "best-practices", "web-development"],
    },
    {
        "title": "Junior Developer Survival Guide",
        "summary": "Your first year in tech: code reviews, imposter syndrome, asking questions, and growing fast.",
        "url": "https://www.freecodecamp.org/news/things-i-wish-someone-had-told-me-when-i-was-learning-how-to-code-565fc9dcb329/",
        "author": "Jake Wilson",
        "category": "career",
        "tags": ["career-growth", "learning", "fundamentals", "coding"],
    },
    {
        "title": "Content Marketing That Actually Works",
        "summary": "Creating content that ranks, converts, and builds authority in competitive B2B markets.",
        "url": "https://contentmarketinginstitute.com/what-is-content-marketing/",
        "author": "Laura Bennett",
        "category": "marketing",
        "tags": ["content", "marketing", "growth", "strategy"],
    },
    {
        "title": "System Design Interview Preparation",
        "summary": "Scalability, load balancing, caching, and database sharding — everything you need for system design rounds.",
        "url": "https://github.com/donnemartin/system-design-primer",
        "author": "Raj Gupta",
        "category": "engineering",
        "tags": ["architecture", "engineering", "coding", "fundamentals"],
    },
    {
        "title": "Building Inclusive Products: Accessibility in Design",
        "summary": "WCAG compliance, screen reader support, and inclusive design principles for modern web applications.",
        "url": "https://www.w3.org/WAI/fundamentals/accessibility-intro/",
        "author": "Jordan Taylor",
        "category": "design",
        "tags": ["design", "ux", "best-practices", "creativity"],
    },
    {
        "title": "Agile at Scale: Beyond Scrum",
        "summary": "SAFe, LeSS, and Spotify model — choosing and adapting agile frameworks for large engineering organizations.",
        "url": "https://www.atlassian.com/agile/agile-at-scale",
        "author": "Paul Henderson",
        "category": "management",
        "tags": ["management", "productivity", "leadership", "engineering"],
    },
    {
        "title": "EdTech Innovation: Technology in Education",
        "summary": "How AI, gamification, and adaptive learning are reshaping education from K-12 to professional development.",
        "url": "https://www.brookings.edu/articles/realizing-the-promise-education-technology/",
        "author": "Dr. Michelle Foster",
        "category": "education",
        "tags": ["education", "technology", "machine-learning", "content"],
    },
]


_URL_BY_TITLE = {a["title"]: a["url"] for a in ARTICLES}


def _refresh_seed_urls(db: Session) -> None:
    """Update URLs on existing seed articles so old example.com links are replaced."""
    updated = 0
    for article in db.query(Article).filter(Article.source.in_(["seed", None])).all():
        real_url = _URL_BY_TITLE.get(article.title)
        if real_url and article.url != real_url:
            article.url = real_url
            updated += 1
    if updated:
        db.commit()


def seed_database(db: Session):
    if db.query(Article).count() > 0:
        _refresh_seed_urls(db)
        return

    tag_cache: dict[str, Tag] = {}

    for article_data in ARTICLES:
        tags_copy = list(article_data["tags"])
        data = {k: v for k, v in article_data.items() if k != "tags"}
        article = Article(**data)
        db.add(article)

        for tag_name in tags_copy:
            if tag_name not in tag_cache:
                tag = db.query(Tag).filter(Tag.name == tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name)
                    db.add(tag)
                    db.flush()
                tag_cache[tag_name] = tag
            article.tags.append(tag_cache[tag_name])

    db.commit()
