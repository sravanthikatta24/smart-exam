import { useEffect, useState } from "react";
import { api } from "../api";
import { formatDate, percent } from "../utils.js";

const CARDS = [
  { key: "students", label: "Students", tone: "indigo" },
  { key: "faculty", label: "Faculty", tone: "violet" },
  { key: "rooms", label: "Rooms", tone: "teal" },
  { key: "exams", label: "Exams", tone: "amber" },
  { key: "seats_allocated", label: "Seats allocated", tone: "blue" },
  { key: "invigilators_assigned", label: "Invigilators on duty", tone: "rose" },
];

export default function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setStats(await api.stats());
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Seating and invigilation at a glance.</p>
        </div>
        <button className="btn ghost" onClick={load}>
          Refresh
        </button>
      </header>

      {error && <div className="banner error">{error}</div>}

      <div className="stat-grid">
        {CARDS.map((card) => (
          <div key={card.key} className={`stat card ${card.tone}`}>
            <span className="stat-label">{card.label}</span>
            <strong className="stat-value">{stats ? stats[card.key] : "—"}</strong>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Exam schedule</h2>
          <div className="inline-actions">
            <button className="btn small" onClick={() => onNavigate("seating")}>
              Allocate seats
            </button>
            <button className="btn small ghost" onClick={() => onNavigate("invigilation")}>
              Assign invigilators
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Exam</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Seating progress</th>
                <th>Invigilators</th>
              </tr>
            </thead>
            <tbody>
              {stats?.exam_schedule?.map((exam) => {
                const total = stats.students;
                const pct = percent(exam.allocated, total);
                return (
                  <tr key={exam.id}>
                    <td>{exam.name}</td>
                    <td>{exam.subject}</td>
                    <td>{formatDate(exam.exam_date)}</td>
                    <td>{exam.exam_time}</td>
                    <td className="progress-cell">
                      <div className="progress">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <small>
                        {exam.allocated} / {total} seated
                      </small>
                    </td>
                    <td>{exam.invigilators}</td>
                  </tr>
                );
              })}
              {stats && stats.exam_schedule.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty">
                    No exams scheduled yet.
                  </td>
                </tr>
              )}
              {!stats && !error && (
                <tr>
                  <td colSpan="6" className="empty">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
