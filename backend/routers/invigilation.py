"""Invigilation assignment endpoints."""

import sqlite3

from fastapi import APIRouter, HTTPException

from database import get_conn
from schemas import AssignIn

router = APIRouter(prefix="/api/invigilation", tags=["invigilation"])

ASSIGNMENT_SELECT = """
    SELECT i.id, i.exam_id, i.room_id, i.faculty_id,
           f.name AS faculty_name, f.department AS faculty_department,
           r.name AS room_name, r.capacity
    FROM invigilation i
    JOIN faculty f ON f.id = i.faculty_id
    JOIN rooms r ON r.id = i.room_id
"""


def _get_or_404(con, table: str, row_id: int, label: str) -> dict:
    row = con.execute(f"SELECT * FROM {table} WHERE id = ?", (row_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return dict(row)


@router.get("")
def list_all_assignments():
    with get_conn() as con:
        rows = con.execute(
            ASSIGNMENT_SELECT + " ORDER BY i.exam_id, r.name, f.name"
        ).fetchall()
        return [dict(row) for row in rows]


@router.get("/{exam_id}")
def assignments_for_exam(exam_id: int):
    with get_conn() as con:
        _get_or_404(con, "exams", exam_id, "Exam")
        rows = con.execute(
            ASSIGNMENT_SELECT + " WHERE i.exam_id = ? ORDER BY r.name, f.name",
            (exam_id,),
        ).fetchall()
        return [dict(row) for row in rows]


@router.post("/assign", status_code=201)
def assign_invigilator(payload: AssignIn):
    with get_conn() as con:
        _get_or_404(con, "exams", payload.exam_id, "Exam")
        room = _get_or_404(con, "rooms", payload.room_id, "Room")
        member = _get_or_404(con, "faculty", payload.faculty_id, "Faculty member")

        clash = con.execute(
            """SELECT 1 FROM invigilation
               WHERE exam_id = ? AND faculty_id = ? AND room_id <> ?""",
            (payload.exam_id, payload.faculty_id, payload.room_id),
        ).fetchone()
        if clash:
            raise HTTPException(
                status_code=400,
                detail=f"{member['name']} is already invigilating another room in this exam",
            )

        try:
            cur = con.execute(
                """INSERT INTO invigilation (exam_id, room_id, faculty_id)
                   VALUES (?, ?, ?)""",
                (payload.exam_id, payload.room_id, payload.faculty_id),
            )
        except sqlite3.IntegrityError:
            raise HTTPException(
                status_code=400,
                detail=f"{member['name']} is already assigned to {room['name']}",
            )

        row = con.execute(
            ASSIGNMENT_SELECT + " WHERE i.id = ?", (cur.lastrowid,)
        ).fetchone()
        return dict(row)


@router.delete("/assignment/{assignment_id}")
def remove_assignment(assignment_id: int):
    with get_conn() as con:
        _get_or_404(con, "invigilation", assignment_id, "Assignment")
        con.execute("DELETE FROM invigilation WHERE id = ?", (assignment_id,))
    return {"message": "Invigilator removed"}
