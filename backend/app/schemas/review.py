from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class CreateReviewRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    diff: str = Field(..., min_length=1)
    team_id: str | None = None


class Finding(BaseModel):
    line_number: int = Field(..., ge=1)
    side: Literal["left", "right"]
    severity: Literal["critical", "high", "medium", "low", "info"]
    category: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    suggestion: str = Field(..., min_length=1)


class Annotation(BaseModel):
    id: str
    finding_id: str
    author_id: str
    author_name: str
    content: str
    created_at: datetime


class ReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    diff: str
    team_id: str | None = None
    status: Literal["pending", "complete", "error"]
    findings: list[Finding] = Field(default_factory=list)
    annotations: list[Annotation] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class ReviewStatusResponse(BaseModel):
    status: Literal["pending", "complete", "error"]
