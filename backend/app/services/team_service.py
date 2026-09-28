from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.sql_models import RoleEnum, Team, TeamMembership, User
from app.schemas.team import CreateTeamRequest, TeamResponse


class TeamError(Exception):
    pass


def _membership(db: Session, team_id: str, user_id: str) -> TeamMembership | None:
    return db.scalar(
        select(TeamMembership).where(
            TeamMembership.team_id == team_id,
            TeamMembership.user_id == user_id,
        )
    )


def _require_owner(db: Session, team_id: str, user_id: str) -> TeamMembership:
    membership = _membership(db, team_id, user_id)
    if not membership:
        raise TeamError("You are not a member of this team")
    if membership.role != RoleEnum.owner:
        raise TeamError("Only the team owner can manage members")
    return membership


def _serialize_team(db: Session, team: Team, role: RoleEnum) -> TeamResponse:
    memberships = db.scalars(
        select(TeamMembership)
        .where(TeamMembership.team_id == team.id)
        .order_by(TeamMembership.joined_at)
    ).all()
    return TeamResponse(
        id=team.id,
        name=team.name,
        role=role.value,
        created_at=team.created_at,
        members=[
            {
                "id": membership.id,
                "user_id": membership.user_id,
                "email": membership.user.email,
                "display_name": membership.user.display_name,
                "role": membership.role.value,
                "joined_at": membership.joined_at,
            }
            for membership in memberships
        ],
    )


def create_team(db: Session, current_user: User, payload: CreateTeamRequest) -> TeamResponse:
    team = Team(name=payload.name.strip())
    db.add(team)
    db.flush()
    db.add(TeamMembership(user_id=current_user.id, team_id=team.id, role=RoleEnum.owner))
    db.commit()
    db.refresh(team)
    return _serialize_team(db, team, RoleEnum.owner)


def get_user_teams(db: Session, current_user: User) -> list[TeamResponse]:
    memberships = db.scalars(
        select(TeamMembership)
        .where(TeamMembership.user_id == current_user.id)
        .order_by(TeamMembership.joined_at)
    ).all()
    return [_serialize_team(db, membership.team, membership.role) for membership in memberships]


def invite_member(db: Session, current_user: User, team_id: str, email: str) -> TeamResponse:
    _require_owner(db, team_id, current_user.id)
    team = db.get(Team, team_id)
    user = db.scalar(select(User).where(User.email == email))
    if not team:
        raise TeamError("Team not found")
    if not user:
        raise TeamError("No user exists with that email")
    if _membership(db, team_id, user.id):
        raise TeamError("That user is already a team member")

    db.add(TeamMembership(user_id=user.id, team_id=team_id, role=RoleEnum.viewer))
    db.commit()
    return _serialize_team(db, team, RoleEnum.owner)


def change_role(db: Session, current_user: User, team_id: str, user_id: str, role: str) -> TeamResponse:
    _require_owner(db, team_id, current_user.id)
    team = db.get(Team, team_id)
    membership = _membership(db, team_id, user_id)
    if not team or not membership:
        raise TeamError("Team member not found")
    if user_id == current_user.id and role != RoleEnum.owner.value:
        raise TeamError("The owner cannot remove their own owner role")

    membership.role = RoleEnum(role)
    db.commit()
    return _serialize_team(db, team, RoleEnum.owner)


def user_team_ids(db: Session, user_id: str) -> list[str]:
    return list(
        db.scalars(select(TeamMembership.team_id).where(TeamMembership.user_id == user_id)).all()
    )


def ensure_team_member(db: Session, user_id: str, team_id: str) -> None:
    if not _membership(db, team_id, user_id):
        raise TeamError("You are not a member of this team")