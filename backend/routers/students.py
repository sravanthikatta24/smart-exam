"""Student CRUD endpoints."""

import sqlite3

from fastapi import APIRouter, HTTPException, Query

from database import get_conn
from schemas import StudentIn

router = APIRouter(prefix="/api/students", tags=["students"])


def _fetch_student(con, student_id: int) -> dict:
    row = con.execute("SELECT * FROM students WHERE id = ?", (student_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return dict(row)


@router.get("")
def list_students(search: str = Query(default="")):
    with get_conn() as con:
        if search:
            pattern = f"%{search.strip()}%"
            rows = con.execute(
                """SELECT * FROM students
                   WHERE name LIKE ? OR roll_no LIKE ? OR department LIKE ?
                   ORDER BY department, roll_no""",
                (pattern, pattern, pattern),
            ).fetchall()
        else:
            rows = con.execute(
                "SELECT * FROM students ORDER BY department, roll_no"
            ).fetchall()
        return [dict(row) for row in rows]


@router.post("", status_code=201)
def add_student(student: StudentIn):
    try:
        with get_conn() as con:
            cur = con.execute(
                """INSERT INTO students (roll_no, name, department, year)
                   VALUES (?, ?, ?, ?)""",
                (
                    student.roll_no.strip(),
                    student.name.strip(),
                    student.department.strip(),
                    student.year,
                ),
            )
            return _fetch_student(con, cur.lastrowid)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Roll number already exists")


@router.put("/{student_id}")
def update_student(student_id: int, student: StudentIn):
    try:
        with get_conn() as con:
            _fetch_student(con, student_id)
            con.execute(
                """UPDATE students
                   SET roll_no = ?, name = ?, department = ?, year = ?
                   WHERE id = ?""",
                (
                    student.roll_no.strip(),
                    student.name.strip(),
                    student.department.strip(),
                    student.year,
                    student_id,
                ),
            )
            return _fetch_student(con, student_id)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Roll number already exists")


@router.delete("/{student_id}")
def delete_student(student_id: int):
    with get_conn() as con:
        _fetch_student(con, student_id)
        con.execute("DELETE FROM students WHERE id = ?", (student_id,))
    return {"message": "Student deleted"}
