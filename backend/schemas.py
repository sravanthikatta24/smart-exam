"""Pydantic request models for the SmartExam API."""

from pydantic import BaseModel, Field


class StudentIn(BaseModel):
    roll_no: str = Field(min_length=1, max_length=30)
    name: str = Field(min_length=1, max_length=120)
    department: str = Field(min_length=1, max_length=80)
    year: int = Field(ge=1, le=6)


class FacultyIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    department: str = Field(min_length=1, max_length=80)


class RoomIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    capacity: int = Field(ge=1, le=1000)


class ExamIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    subject: str = Field(min_length=1, max_length=120)
    exam_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    exam_time: str = Field(min_length=1, max_length=20)


class AllocateIn(BaseModel):
    exam_id: int
    room_id: int


class AssignIn(BaseModel):
    exam_id: int
    room_id: int
    faculty_id: int
