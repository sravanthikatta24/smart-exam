"""Faculty CRUD endpoints."""

from fastapi import APIRouter, HTTPException

from database import get_conn
from schemas import FacultyIn

router = APIRouter(prefix="/api/faculty", tags=["faculty"])


def _fetch_faculty(con, faculty_id: int) -> dict:
    row = con.execute("SELECT * FROM faculty WHERE id = ?", (faculty_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Faculty member not found")
    return dict(row)


@router.get("")
def list_faculty():
    with get_conn() as con:
        rows = con.execute("SELECT * FROM faculty ORDER BY name").fetchall()
        return [dict(row) for row in rows]


@router.post("", status_code=201)
def add_faculty(member: FacultyIn):
    with get_conn() as con:
        cur = con.execute(
            "INSERT INTO faculty (name, department) VALUES (?, ?)",
            (member.name.strip(), member.department.strip()),
        )
        return _fetch_faculty(con, cur.lastrowid)


@router.put("/{faculty_id}")
def update_faculty(faculty_id: int, member: FacultyIn):
    with get_conn() as con:
        _fetch_faculty(con, faculty_id)
        con.execute(
            "UPDATE faculty SET name = ?, department = ? WHERE id = ?",
            (member.name.strip(), member.department.strip(), faculty_id),
        )
        return _fetch_faculty(con, faculty_id)


@router.delete("/{faculty_id}")
def delete_faculty(faculty_id: int):
    with get_conn() as con:
        _fetch_faculty(con, faculty_id)
        con.execute("DELETE FROM faculty WHERE id = ?", (faculty_id,))
    return {"message": "Faculty member deleted"}
