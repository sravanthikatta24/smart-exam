"""Seat allocation endpoints."""

from fastapi import APIRouter, HTTPException

from database import get_conn
from schemas import AllocateIn

router = APIRouter(prefix="/api/seating", tags=["seating"])


def _get_or_404(con, table: str, row_id: int, label: str) -> dict:
    row = con.execute(f"SELECT * FROM {table} WHERE id = ?", (row_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail=f"{label} not found")
    return dict(row)


@router.get("/{exam_id}")
def seating_plan(exam_id: int):
    """Return the seating plan of an exam, grouped by room."""
    with get_conn() as con:
        exam = _get_or_404(con, "exams", exam_id, "Exam")
        rooms = con.execute(
            """SELECT r.id AS room_id, r.name AS room_name, r.capacity,
                      COUNT(a.id) AS allocated
               FROM seat_allocations a
               JOIN rooms r ON r.id = a.room_id
               WHERE a.exam_id = ?
               GROUP BY r.id
               ORDER BY r.name""",
            (exam_id,),
        ).fetchall()

        plan = []
        for room in rooms:
            seats = con.execute(
                """SELECT a.id, a.seat_no, s.id AS student_id, s.roll_no,
                          s.name, s.department, s.year
                   FROM seat_allocations a
                   JOIN students s ON s.id = a.student_id
                   WHERE a.exam_id = ? AND a.room_id = ?
                   ORDER BY CAST(SUBSTR(a.seat_no, 2) AS INTEGER)""",
                (exam_id, room["room_id"]),
            ).fetchall()
            plan.append(
                {
                    "room_id": room["room_id"],
                    "room_name": room["room_name"],
                    "capacity": room["capacity"],
                    "allocated": room["allocated"],
                    "seats": [dict(seat) for seat in seats],
                }
            )

        allocated = sum(room["allocated"] for room in plan)
        total_students = con.execute("SELECT COUNT(*) AS c FROM students").fetchone()["c"]

        return {
            "exam": exam,
            "total_students": total_students,
            "allocated": allocated,
            "unallocated": total_students - allocated,
            "rooms": plan,
        }


@router.post("/allocate")
def allocate_seats(payload: AllocateIn):
    """Seat every still-unseated student into the room, up to its capacity."""
    with get_conn() as con:
        exam = _get_or_404(con, "exams", payload.exam_id, "Exam")
        room = _get_or_404(con, "rooms", payload.room_id, "Room")

        already_seated = {
            row["student_id"]
            for row in con.execute(
                "SELECT student_id FROM seat_allocations WHERE exam_id = ?",
                (payload.exam_id,),
            )
        }
        all_students = con.execute(
            "SELECT * FROM students ORDER BY department, roll_no"
        ).fetchall()
        waiting = [s for s in all_students if s["id"] not in already_seated]

        if not waiting:
            raise HTTPException(
                status_code=400,
                detail="Every student already has a seat for this exam",
            )

        room_stats = con.execute(
            """SELECT COUNT(*) AS occupied,
                      COALESCE(MAX(CAST(SUBSTR(seat_no, 2) AS INTEGER)), 0) AS last_seat
               FROM seat_allocations
               WHERE exam_id = ? AND room_id = ?""",
            (payload.exam_id, payload.room_id),
        ).fetchone()

        free_seats = room["capacity"] - room_stats["occupied"]
        if free_seats <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Room {room['name']} is already full for this exam",
            )

        to_seat = waiting[:free_seats]
        seating_plan = []
        next_seat = room_stats["last_seat"] + 1

        for offset, student in enumerate(to_seat):
            seat_no = f"S{next_seat + offset}"
            con.execute(
                """INSERT INTO seat_allocations (exam_id, room_id, student_id, seat_no)
                   VALUES (?, ?, ?, ?)""",
                (payload.exam_id, payload.room_id, student["id"], seat_no),
            )
            seating_plan.append(
                {
                    "seat": seat_no,
                    "roll_no": student["roll_no"],
                    "name": student["name"],
                    "department": student["department"],
                }
            )

        return {
            "exam": exam["name"],
            "room": room["name"],
            "allocated": len(seating_plan),
            "unallocated": len(waiting) - len(seating_plan),
            "seating_plan": seating_plan,
        }


@router.delete("/{exam_id}/room/{room_id}")
def clear_room(exam_id: int, room_id: int):
    """Remove the seating plan of one room for an exam."""
    with get_conn() as con:
        _get_or_404(con, "exams", exam_id, "Exam")
        cur = con.execute(
            "DELETE FROM seat_allocations WHERE exam_id = ? AND room_id = ?",
            (exam_id, room_id),
        )
    return {"message": "Room seating cleared", "removed": cur.rowcount}


@router.delete("/{exam_id}")
def clear_exam(exam_id: int):
    """Remove every seat allocation of an exam."""
    with get_conn() as con:
        _get_or_404(con, "exams", exam_id, "Exam")
        cur = con.execute(
            "DELETE FROM seat_allocations WHERE exam_id = ?", (exam_id,)
        )
    return {"message": "Seating plan cleared", "removed": cur.rowcount}
