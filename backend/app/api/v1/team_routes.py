from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.mysql import get_db
from app.models.sql_models import User
from app.schemas.team import ChangeRoleRequest, CreateTeamRequest, InviteRequest, TeamResponse
from app.services.team_service import TeamError, change_role, create_team, get_user_teams, invite_member

router = APIRouter(prefix="/teams", tags=["teams"])


def _team_error(exc: TeamError) -> HTTPException:
    detail = str(exc)
    code = status.HTTP_404_NOT_FOUND if "not found" in detail.lower() else status.HTTP_403_FORBIDDEN
    if "already" in detail.lower():
        code = status.HTTP_400_BAD_REQUEST
    return HTTPException(status_code=code, detail=detail)


@router.post("", response_model=TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team_route(
    payload: CreateTeamRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_team(db, current_user, payload)


@router.get("/me", response_model=list[TeamResponse])
def get_my_teams_route(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return get_user_teams(db, current_user)


@router.post("/{team_id}/invite", response_model=TeamResponse)
def invite_member_route(
    team_id: str,
    payload: InviteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return invite_member(db, current_user, team_id, payload.email)
    except TeamError as exc:
        raise _team_error(exc) from exc


@router.put("/{team_id}/members/{user_id}/role", response_model=TeamResponse)
def change_role_route(
    team_id: str,
    user_id: str,
    payload: ChangeRoleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return change_role(db, current_user, team_id, user_id, payload.role)
    except TeamError as exc:
        raise _team_error(exc) from exc