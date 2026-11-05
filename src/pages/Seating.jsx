import { useEffect, useState } from "react";
import { api } from "../api";
import { formatDate, percent } from "../utils.js";

export default function Seating() {
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [examId, setExamId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReference = async () => {
    try {
      const [examList, roomList] = await Promise.all([api.list("exams"), api.list("rooms")]);
      setExams(examList);
      setRooms(roomList);
      setExamId((current) => current || (examList[0] ? String(examList[0].id) : ""));
      setRoomId((current) => current || (roomList[0] ? String(roomList[0].id) : ""));
    } catch (err) {
      setError(err.message);
    }
  };

  const loadPlan = async (id) => {
    if (!id) {
      setPlan(null);
      return;
    }
    try {
      setPlan(await api.seatingPlan(id));
      setError("");
    } catch (err) {
      setPlan(null);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadReference();
  }, []);

  useEffect(() => {
    loadPlan(examId);
  }, [examId]);

  const allocate = async () => {
    if (!examId || !roomId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api.allocateSeats({
        exam_id: Number(examId),
        room_id: Number(roomId),
      });
      setNotice(
        `Seated ${result.allocated} student(s) in ${result.room}.` +
          (result.unallocated ? ` ${result.unallocated} still unseated.` : "")
      );
      await loadPlan(examId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const clearAll = async () => {
    if (!examId) return;
    if (!window.confirm("Clear the entire seating plan for this exam?")) return;
    try {
      await api.clearExamSeating(examId);
      setNotice("Seating plan cleared.");
      setError("");
      await loadPlan(examId);
    } catch (err) {
      setError(err.message);
    }
  };

  const clearOneRoom = async (targetRoomId) => {
    if (!window.confirm("Clear the seats of this room?")) return;
    try {
      await api.clearRoomSeating(examId, targetRoomId);
      setNotice("Room seating cleared.");
      setError("");
      await loadPlan(examId);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedExam = exams.find((exam) => String(exam.id) === String(examId));
  const totalStudents = plan?.total_students ?? 0;
  const allocated = plan?.allocated ?? 0;

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Seating</h1>
          <p>Allocate students to rooms in roll-number order, up to each room's capacity.</p>
        </div>
        <button className="btn ghost" onClick={() => loadPlan(examId)}>
          Refresh
        </button>
      </header>

      {error && <div className="banner error">{error}</div>}
      {notice && <div className="banner success">{notice}</div>}

      {exams.length === 0 ? (
        <div className="card empty-state">
          <h2>No exams yet</h2>
          <p>Create an exam and at least one room before allocating seats.</p>
        </div>
      ) : (
        <>
          <div className="card controls">
            <label className="field">
              <span>Exam</span>
              <select value={examId} onChange={(event) => setExamId(event.target.value)}>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.subject} — {exam.name} ({formatDate(exam.exam_date)})
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Room</span>
              <select value={roomId} onChange={(event) => setRoomId(event.target.value)}>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} — capacity {room.capacity}
                  </option>
                ))}
              </select>
            </label>

            <div className="actions">
              <button className="btn primary" onClick={allocate} disabled={busy || !roomId}>
                {busy ? "Allocating…" : "Allocate seats"}
              </button>
              <button className="btn ghost" onClick={clearAll} disabled={allocated === 0}>
                Clear plan
              </button>
            </div>
          </div>

          {rooms.length === 0 && (
            <div className="banner warn">Add a room before allocating seats.</div>
          )}

          <div className="card summary">
            <div>
              <span className="stat-label">Students</span>
              <strong>{totalStudents}</strong>
            </div>
            <div>
              <span className="stat-label">Seated</span>
              <strong>{allocated}</strong>
            </div>
            <div>
              <span className="stat-label">Unseated</span>
              <strong>{plan?.unallocated ?? 0}</strong>
            </div>
            <div className="progress-cell">
              <div className="progress">
                <span style={{ width: `${percent(allocated, totalStudents)}%` }} />
              </div>
              <small>{percent(allocated, totalStudents)}% of students seated</small>
            </div>
          </div>

          {selectedExam && (
            <p className="muted">
              Showing the seating plan for <strong>{selectedExam.subject}</strong> ·{" "}
              {selectedExam.name} · {formatDate(selectedExam.exam_date)} at{" "}
              {selectedExam.exam_time}
            </p>
          )}

          {plan?.rooms.length === 0 && (
            <div className="card empty-state">
              <h2>No seats allocated</h2>
              <p>Pick a room above and allocate seats to build the plan.</p>
            </div>
          )}

          {plan?.rooms.map((room) => (
            <div className="card" key={room.room_id}>
              <div className="card-head">
                <h2>
                  {room.room_name}{" "}
                  <span className="pill">
                    {room.allocated} / {room.capacity} seats
                  </span>
                </h2>
                <button className="btn small danger" onClick={() => clearOneRoom(room.room_id)}>
                  Clear room
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Seat</th>
                      <th>Roll no.</th>
                      <th>Student</th>
                      <th>Department</th>
                      <th>Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    {room.seats.map((seat) => (
                      <tr key={seat.id}>
                        <td>
                          <span className="seat">{seat.seat_no}</span>
                        </td>
                        <td>{seat.roll_no}</td>
                        <td>{seat.name}</td>
                        <td>{seat.department}</td>
                        <td>{seat.year}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </section>
  );
}
