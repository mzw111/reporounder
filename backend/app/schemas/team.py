from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


TeamRole = Literal["owner", "reviewer", "viewer"]


class CreateTeamRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)


class InviteRequest(BaseModel):
    email: EmailStr


class ChangeRoleRequest(BaseModel):
    role: TeamRole


class MemberResponse(BaseModel):
    id: str
    user_id: str
    email: EmailStr
    display_name: str
    role: TeamRole
    joined_at: datetime


class TeamResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    role: TeamRole
    created_at: datetime
    members: list[MemberResponse] = Field(default_factory=list)