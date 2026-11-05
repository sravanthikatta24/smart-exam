"""Exam CRUD endpoints."""

from fastapi import APIRouter, HTTPException

from database import get_conn
from schemas import ExamIn

router = APIRouter(prefix="/api/exams", tags=["exams"])


def _fetch_exam(con, exam_id: int) -> dict:
    row = con.execute("SELECT * FROM exams WHERE id = ?", (exam_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Exam not found")
    return dict(row)


@router.get("")
def list_exams():
    with get_conn() as con:
        rows = con.execute(
            "SELECT * FROM exams ORDER BY exam_date, exam_time"
        ).fetchall()
        return [dict(row) for row in rows]


@router.post("", status_code=201)
def add_exam(exam: ExamIn):
    with get_conn() as con:
        cur = con.execute(
            """INSERT INTO exams (name, subject, exam_date, exam_time)
               VALUES (?, ?, ?, ?)""",
            (exam.name.strip(), exam.subject.strip(), exam.exam_date, exam.exam_time),
        )
        return _fetch_exam(con, cur.lastrowid)


@router.put("/{exam_id}")
def update_exam(exam_id: int, exam: ExamIn):
    with get_conn() as con:
        _fetch_exam(con, exam_id)
        con.execute(
            """UPDATE exams
               SET name = ?, subject = ?, exam_date = ?, exam_time = ?
               WHERE id = ?""",
            (
                exam.name.strip(),
                exam.subject.strip(),
                exam.exam_date,
                exam.exam_time,
                exam_id,
            ),
        )
        return _fetch_exam(con, exam_id)


@router.delete("/{exam_id}")
def delete_exam(exam_id: int):
    with get_conn() as con:
        _fetch_exam(con, exam_id)
        con.execute("DELETE FROM exams WHERE id = ?", (exam_id,))
    return {"message": "Exam deleted"}
