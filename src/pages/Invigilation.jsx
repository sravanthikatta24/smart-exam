import { useEffect, useState } from "react";
import { api } from "../api";
import { formatDate } from "../utils.js";

export default function Invigilation() {
  const [exams, setExams] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [examId, setExamId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReference = async () => {
    try {
      const [examList, roomList, facultyList] = await Promise.all([
        api.list("exams"),
        api.list("rooms"),
        api.list("faculty"),
      ]);
      setExams(examList);
      setRooms(roomList);
      setFaculty(facultyList);
      setExamId((current) => current || (examList[0] ? String(examList[0].id) : ""));
      setRoomId((current) => current || (roomList[0] ? String(roomList[0].id) : ""));
      setFacultyId((current) => current || (facultyList[0] ? String(facultyList[0].id) : ""));
    } catch (err) {
      setError(err.message);
    }
  };

  const loadAssignments = async (id) => {
    if (!id) {
      setAssignments([]);
      return;
    }
    try {
      setAssignments(await api.assignmentsFor(id));
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadReference();
  }, []);

  useEffect(() => {
    loadAssignments(examId);
  }, [examId]);

  const assign = async (event) => {
    event.preventDefault();
    if (!examId || !roomId || !facultyId) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const created = await api.assignInvigilator({
        exam_id: Number(examId),
        room_id: Number(roomId),
        faculty_id: Number(facultyId),
      });
      setNotice(`${created.faculty_name} assigned to ${created.room_name}.`);
      await loadAssignments(examId);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (assignment) => {
    try {
      await api.removeAssignment(assignment.id);
      setNotice(`${assignment.faculty_name} removed from ${assignment.room_name}.`);
      setError("");
      await loadAssignments(examId);
    } catch (err) {
      setError(err.message);
    }
  };

  const selectedExam = exams.find((exam) => String(exam.id) === String(examId));

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Invigilation</h1>
          <p>Assign faculty members to exam rooms. A faculty member cannot cover two rooms in the same exam.</p>
        </div>
        <button className="btn ghost" onClick={() => loadAssignments(examId)}>
          Refresh
        </button>
      </header>

      {error && <div className="banner error">{error}</div>}
      {notice && <div className="banner success">{notice}</div>}

      {exams.length === 0 ? (
        <div className="card empty-state">
          <h2>No exams yet</h2>
          <p>Create an exam, a room and faculty members before assigning invigilators.</p>
        </div>
      ) : (
        <>
          <form className="card controls" onSubmit={assign}>
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
              <select
                value={roomId}
                onChange={(event) => setRoomId(event.target.value)}
                disabled={rooms.length === 0}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Faculty</span>
              <select
                value={facultyId}
                onChange={(event) => setFacultyId(event.target.value)}
                disabled={faculty.length === 0}
              >
                {faculty.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.department})
                  </option>
                ))}
              </select>
            </label>

            <div className="actions">
              <button
                type="submit"
                className="btn primary"
                disabled={busy || !roomId || !facultyId}
              >
                {busy ? "Assigning…" : "Assign invigilator"}
              </button>
            </div>
          </form>

          {(rooms.length === 0 || faculty.length === 0) && (
            <div className="banner warn">
              Add at least one room and one faculty member to assign invigilation duty.
            </div>
          )}

          {selectedExam && (
            <p className="muted">
              Duties for <strong>{selectedExam.subject}</strong> · {selectedExam.name} ·{" "}
              {formatDate(selectedExam.exam_date)} at {selectedExam.exam_time}
            </p>
          )}

          <div className="card">
            <div className="card-head">
              <h2>Assigned invigilators</h2>
              <span className="pill">{assignments.length} assignments</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Faculty</th>
                    <th>Department</th>
                    <th className="right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{assignment.room_name}</td>
                      <td>{assignment.faculty_name}</td>
                      <td>{assignment.faculty_department}</td>
                      <td className="right">
                        <button className="btn small danger" onClick={() => remove(assignment)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {assignments.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty">
                        No invigilators assigned for this exam yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
