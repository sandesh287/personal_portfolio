from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.features.projects.schemas import ProjectStatus
from app.models.project import Project, ProjectCategory, Technology


@dataclass(frozen=True)
class CategorySeed:
    name: str
    slug: str
    description: str
    sort_order: int


@dataclass(frozen=True)
class TechnologySeed:
    name: str
    slug: str
    category: str
    icon: str
    color: str
    sort_order: int


@dataclass(frozen=True)
class ProjectSeed:
    title: str
    slug: str
    summary: str
    description: str
    category_slug: str
    technology_slugs: tuple[str, ...]
    status: ProjectStatus
    featured: bool
    sort_order: int
    repository_url: str | None = None
    live_url: str | None = None
    case_study_url: str | None = None


@dataclass(frozen=True)
class ProjectSeedSummary:
    categories: int
    technologies: int
    projects: int


CATEGORY_SEEDS: tuple[CategorySeed, ...] = (
    CategorySeed(
        name="React Projects",
        slug="react-projects",
        description="Frontend engineering work built with React and TypeScript.",
        sort_order=10,
    ),
    CategorySeed(
        name="Flutter Applications",
        slug="flutter-applications",
        description="Cross-platform mobile applications built with Flutter and Dart.",
        sort_order=20,
    ),
    CategorySeed(
        name="Data Science Projects",
        slug="data-science-projects",
        description="Applied analytics, notebooks, experiments, and machine learning work.",
        sort_order=30,
    ),
    CategorySeed(
        name="AI Lab",
        slug="ai-lab",
        description="Prototype systems that explore AI-assisted developer workflows.",
        sort_order=40,
    ),
)


TECHNOLOGY_SEEDS: tuple[TechnologySeed, ...] = (
    TechnologySeed("React", "react", "frontend", "react", "#61dafb", 10),
    TechnologySeed("TypeScript", "typescript", "frontend", "badge-ts", "#3178c6", 20),
    TechnologySeed("Tailwind CSS", "tailwind-css", "frontend", "wind", "#38bdf8", 30),
    TechnologySeed("Vite", "vite", "frontend", "zap", "#facc15", 40),
    TechnologySeed("TanStack Query", "tanstack-query", "frontend", "database-zap", "#ff4154", 50),
    TechnologySeed("Zustand", "zustand", "frontend", "store", "#7c3aed", 60),
    TechnologySeed("FastAPI", "fastapi", "backend", "server", "#009688", 70),
    TechnologySeed("SQLAlchemy", "sqlalchemy", "backend", "database", "#d71f00", 80),
    TechnologySeed("PostgreSQL", "postgresql", "database", "database", "#336791", 90),
    TechnologySeed("Flutter", "flutter", "mobile", "smartphone", "#02569b", 100),
    TechnologySeed("Dart", "dart", "mobile", "code-2", "#0175c2", 110),
    TechnologySeed("Python", "python", "data-science", "file-code-2", "#3776ab", 120),
    TechnologySeed("Pandas", "pandas", "data-science", "table", "#150458", 130),
    TechnologySeed("NumPy", "numpy", "data-science", "sigma", "#4dabcf", 140),
    TechnologySeed("scikit-learn", "scikit-learn", "data-science", "brain-circuit", "#f7931e", 150),
)


PROJECT_SEEDS: tuple[ProjectSeed, ...] = (
    ProjectSeed(
        title="Developer Workspace Portfolio",
        slug="developer-workspace-portfolio",
        summary=(
            "A dynamic portfolio platform managed through an admin dashboard and shaped "
            "like an engineering workspace."
        ),
        description=(
            "Production-focused personal portfolio foundation for Sandesh, combining a "
            "React workspace experience with a FastAPI backend, PostgreSQL persistence, "
            "authentication, and admin-ready architecture."
        ),
        category_slug="react-projects",
        technology_slugs=(
            "react",
            "typescript",
            "tailwind-css",
            "vite",
            "tanstack-query",
            "zustand",
            "fastapi",
            "sqlalchemy",
            "postgresql",
        ),
        status=ProjectStatus.PUBLISHED,
        featured=True,
        sort_order=10,
    ),
    ProjectSeed(
        title="Flutter Device Lab",
        slug="flutter-device-lab",
        summary=(
            "A mobile app showcase space for cross-platform Flutter experiments and "
            "production-style app work."
        ),
        description=(
            "Seed project reserved for Sandesh's Flutter applications, designed to "
            "support app screenshots, "
            "device previews, architecture notes, and release links as the portfolio grows."
        ),
        category_slug="flutter-applications",
        technology_slugs=("flutter", "dart"),
        status=ProjectStatus.PUBLISHED,
        featured=True,
        sort_order=20,
    ),
    ProjectSeed(
        title="Data Science Notebook Lab",
        slug="data-science-notebook-lab",
        summary=(
            "A project space for data analysis, modeling experiments, and notebook-driven learning."
        ),
        description=(
            "Seed project reserved for data science work, including exploratory "
            "analysis, model experiments, "
            "visualizations, and reproducible study artifacts."
        ),
        category_slug="data-science-projects",
        technology_slugs=("python", "pandas", "numpy", "scikit-learn"),
        status=ProjectStatus.PUBLISHED,
        featured=False,
        sort_order=30,
    ),
)


def seed_projects(db: Session) -> ProjectSeedSummary:
    categories = _upsert_categories(db)
    technologies = _upsert_technologies(db)
    projects = _upsert_projects(db, categories=categories, technologies=technologies)
    db.commit()

    return ProjectSeedSummary(
        categories=len(categories),
        technologies=len(technologies),
        projects=len(projects),
    )


def seed_project_data() -> None:
    with SessionLocal() as db:
        summary = seed_projects(db)

    print(
        "Seeded project data: "
        f"{summary.categories} categories, "
        f"{summary.technologies} technologies, "
        f"{summary.projects} projects"
    )


def _upsert_categories(db: Session) -> dict[str, ProjectCategory]:
    categories: dict[str, ProjectCategory] = {}

    for seed in CATEGORY_SEEDS:
        category = db.scalar(select(ProjectCategory).where(ProjectCategory.slug == seed.slug))

        if category is None:
            category = ProjectCategory(slug=seed.slug)
            db.add(category)

        category.name = seed.name
        category.description = seed.description
        category.sort_order = seed.sort_order
        category.deleted_at = None
        categories[seed.slug] = category

    return categories


def _upsert_technologies(db: Session) -> dict[str, Technology]:
    technologies: dict[str, Technology] = {}

    for seed in TECHNOLOGY_SEEDS:
        technology = db.scalar(select(Technology).where(Technology.slug == seed.slug))

        if technology is None:
            technology = Technology(slug=seed.slug)
            db.add(technology)

        technology.name = seed.name
        technology.category = seed.category
        technology.icon = seed.icon
        technology.color = seed.color
        technology.sort_order = seed.sort_order
        technology.deleted_at = None
        technologies[seed.slug] = technology

    return technologies


def _upsert_projects(
    db: Session,
    *,
    categories: dict[str, ProjectCategory],
    technologies: dict[str, Technology],
) -> dict[str, Project]:
    projects: dict[str, Project] = {}
    published_at = datetime.now(UTC)

    for seed in PROJECT_SEEDS:
        project = db.scalar(select(Project).where(Project.slug == seed.slug))

        if project is None:
            project = Project(slug=seed.slug)
            db.add(project)

        project.title = seed.title
        project.summary = seed.summary
        project.description = seed.description
        project.category = categories[seed.category_slug]
        project.technologies = [technologies[slug] for slug in seed.technology_slugs]
        project.repository_url = seed.repository_url
        project.live_url = seed.live_url
        project.case_study_url = seed.case_study_url
        project.status = seed.status.value
        project.featured = seed.featured
        project.sort_order = seed.sort_order
        project.deleted_at = None

        if seed.status == ProjectStatus.PUBLISHED and project.published_at is None:
            project.published_at = published_at

        projects[seed.slug] = project

    return projects


if __name__ == "__main__":
    seed_project_data()
