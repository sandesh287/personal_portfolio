from app.cli.seed_projects import PROJECT_SEEDS, TECHNOLOGY_SEEDS, seed_projects
from app.models.project import Project, ProjectCategory, Technology
from sqlalchemy import func, select
from sqlalchemy.orm import Session


def test_seed_projects_is_idempotent(db_session: Session) -> None:
    first_summary = seed_projects(db_session)
    second_summary = seed_projects(db_session)

    assert first_summary == second_summary
    assert db_session.scalar(select(func.count()).select_from(ProjectCategory)) == 4
    assert db_session.scalar(select(func.count()).select_from(Technology)) == len(TECHNOLOGY_SEEDS)
    assert db_session.scalar(select(func.count()).select_from(Project)) == len(PROJECT_SEEDS)


def test_seed_projects_attaches_categories_and_technologies(db_session: Session) -> None:
    seed_projects(db_session)

    project = db_session.scalar(
        select(Project).where(Project.slug == "developer-workspace-portfolio")
    )

    assert project is not None
    assert project.category is not None
    assert project.category.slug == "react-projects"
    assert {technology.slug for technology in project.technologies} == {
        "react",
        "typescript",
        "tailwind-css",
        "vite",
        "tanstack-query",
        "zustand",
        "fastapi",
        "sqlalchemy",
        "postgresql",
    }
