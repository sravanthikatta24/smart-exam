"""Optional demo data for SmartExam.

Usage (from the backend directory):
    python seed.py

The script only inserts records when the matching table is empty, so it is
safe to run more than once.
"""

from database import get_conn, init_db

STUDENTS = [
    ("23CS001", "Aarav Sharma", "Computer Science", 3),
    ("23CS002", "Diya Patel", "Computer Science", 3),
    ("23CS003", "Rohan Verma", "Computer Science", 3),
    ("23CS004", "Ishita Nair", "Computer Science", 3),
    ("23EC001", "Kabir Menon", "Electronics", 3),
    ("23EC002", "Sneha Iyer", "Electronics", 3),
    ("23EC003", "Arjun Rao", "Electronics", 3),
    ("23ME001", "Meera Joshi", "Mechanical", 3),
    ("23ME002", "Vikram Singh", "Mechanical", 3),
    ("23ME003", "Ananya Gupta", "Mechanical", 3),
    ("23CS005", "Nikhil Reddy", "Computer Science", 3),
    ("23EC004", "Tara Bose", "Electronics", 3),
]

FACULTY = [
    ("Dr. Ramesh Kumar", "Computer Science"),
    ("Prof. Latha Menon", "Computer Science"),
    ("Dr. Suresh Babu", "Electronics"),
    ("Prof. Anjali Desai", "Mechanical"),
    ("Dr. Farhan Ali", "Computer Science"),
]

ROOMS = [("Hall A", 6), ("Hall B", 6), ("Lab 101", 4)]

EXAMS = [
    ("Semester 3 Mid-Term", "Data Structures", "2026-11-12", "10:00 AM"),
    ("Semester 3 Mid-Term", "Digital Circuits", "2026-11-14", "02:00 PM"),
]


def seed() -> None:
    init_db()
    with get_conn() as con:
        if con.execute("SELECT COUNT(*) AS c FROM students").fetchone()["c"] == 0:
            con.executemany(
                "INSERT INTO students (roll_no, name, department, year) VALUES (?, ?, ?, ?)",
                STUDENTS,
            )
            print(f"Inserted {len(STUDENTS)} students")

        if con.execute("SELECT COUNT(*) AS c FROM faculty").fetchone()["c"] == 0:
            con.executemany(
                "INSERT INTO faculty (name, department) VALUES (?, ?)", FACULTY
            )
            print(f"Inserted {len(FACULTY)} faculty members")

        if con.execute("SELECT COUNT(*) AS c FROM rooms").fetchone()["c"] == 0:
            con.executemany(
                "INSERT INTO rooms (name, capacity) VALUES (?, ?)", ROOMS
            )
            print(f"Inserted {len(ROOMS)} rooms")

        if con.execute("SELECT COUNT(*) AS c FROM exams").fetchone()["c"] == 0:
            con.executemany(
                """INSERT INTO exams (name, subject, exam_date, exam_time)
                   VALUES (?, ?, ?, ?)""",
                EXAMS,
            )
            print(f"Inserted {len(EXAMS)} exams")

    print("Seed complete.")


if __name__ == "__main__":
    seed()
