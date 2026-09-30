from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ReviewStatus = Literal["pending", "complete", "error"]
FindingSeverity = Literal["critical", "high", "medium", "low", "info"]
FindingSide = Literal["left", "right"]


class Finding(BaseModel):
    line_number: int = Field(..., ge=1)
    side: FindingSide
    severity: FindingSeverity
    category: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)
    suggestion: str = Field(..., min_length=1)


class Annotation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    finding_id: str
    author_id: str
    author_name: str
    content: str = Field(..., min_length=1, max_length=2000)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    team_id: str | None = None
    title: str = Field(..., min_length=1, max_length=200)
    diff: str = Field(..., min_length=1)
    status: ReviewStatus = "pending"
    findings: list[Finding] = Field(default_factory=list)
    annotations: list[Annotation] = Field(default_factory=list)
    error_message: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
