"""SmartExam API — FastAPI application entry point.

Run from the backend directory with:
    uvicorn main:app --reload
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import get_conn, init_db
from routers import exams, faculty, invigilation, rooms, seating, students

ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="SmartExam API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(faculty.router)
app.include_router(rooms.router)
app.include_router(exams.router)
app.include_router(seating.router)
app.include_router(invigilation.router)


@app.get("/")
def home():
    return {"message": "SmartExam API is running", "docs": "/docs"}


@app.get("/api/stats")
def stats():
    """Dashboard counters plus per-exam seating progress."""
    with get_conn() as con:
        counts = {
            "students": con.execute("SELECT COUNT(*) AS c FROM students").fetchone()["c"],
            "faculty": con.execute("SELECT COUNT(*) AS c FROM faculty").fetchone()["c"],
            "rooms": con.execute("SELECT COUNT(*) AS c FROM rooms").fetchone()["c"],
            "exams": con.execute("SELECT COUNT(*) AS c FROM exams").fetchone()["c"],
            "seats_allocated": con.execute(
                "SELECT COUNT(*) AS c FROM seat_allocations"
            ).fetchone()["c"],
            "invigilators_assigned": con.execute(
                "SELECT COUNT(*) AS c FROM invigilation"
            ).fetchone()["c"],
        }

        rows = con.execute(
            """SELECT e.*,
                      (SELECT COUNT(*) FROM seat_allocations a WHERE a.exam_id = e.id)
                          AS allocated,
                      (SELECT COUNT(*) FROM invigilation iv WHERE iv.exam_id = e.id)
                          AS invigilators
               FROM exams e
               ORDER BY e.exam_date, e.exam_time"""
        ).fetchall()

    exams_list = []
    for row in rows:
        exam = dict(row)
        exam["unallocated"] = max(counts["students"] - exam["allocated"], 0)
        exams_list.append(exam)

    return {**counts, "exam_schedule": exams_list}
