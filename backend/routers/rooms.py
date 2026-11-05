"""Room CRUD endpoints."""

import sqlite3

from fastapi import APIRouter, HTTPException

from database import get_conn
from schemas import RoomIn

router = APIRouter(prefix="/api/rooms", tags=["rooms"])


def _fetch_room(con, room_id: int) -> dict:
    row = con.execute("SELECT * FROM rooms WHERE id = ?", (room_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Room not found")
    return dict(row)


@router.get("")
def list_rooms():
    with get_conn() as con:
        rows = con.execute("SELECT * FROM rooms ORDER BY name").fetchall()
        return [dict(row) for row in rows]


@router.post("", status_code=201)
def add_room(room: RoomIn):
    try:
        with get_conn() as con:
            cur = con.execute(
                "INSERT INTO rooms (name, capacity) VALUES (?, ?)",
                (room.name.strip(), room.capacity),
            )
            return _fetch_room(con, cur.lastrowid)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Room name already exists")


@router.put("/{room_id}")
def update_room(room_id: int, room: RoomIn):
    try:
        with get_conn() as con:
            _fetch_room(con, room_id)
            con.execute(
                "UPDATE rooms SET name = ?, capacity = ? WHERE id = ?",
                (room.name.strip(), room.capacity, room_id),
            )
            return _fetch_room(con, room_id)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Room name already exists")


@router.delete("/{room_id}")
def delete_room(room_id: int):
    with get_conn() as con:
        _fetch_room(con, room_id)
        con.execute("DELETE FROM rooms WHERE id = ?", (room_id,))
    return {"message": "Room deleted"}
