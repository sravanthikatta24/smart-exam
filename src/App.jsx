import { useState } from "react";
import Dashboard from "./pages/Dashboard.jsx";
import Students from "./pages/Students.jsx";
import Faculty from "./pages/Faculty.jsx";
import Rooms from "./pages/Rooms.jsx";
import Exams from "./pages/Exams.jsx";
import Seating from "./pages/Seating.jsx";
import Invigilation from "./pages/Invigilation.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: "▦", page: Dashboard },
  { id: "students", label: "Students", icon: "🎓", page: Students },
  { id: "faculty", label: "Faculty", icon: "👩‍🏫", page: Faculty },
  { id: "rooms", label: "Rooms", icon: "🏫", page: Rooms },
  { id: "exams", label: "Exams", icon: "📝", page: Exams },
  { id: "seating", label: "Seating", icon: "🪑", page: Seating },
  { id: "invigilation", label: "Invigilation", icon: "🛡️", page: Invigilation },
];

export default function App() {
  const [active, setActive] = useState("dashboard");
  const current = TABS.find((tab) => tab.id === active) ?? TABS[0];
  const Page = current.page;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">SE</span>
          <div>
            <strong>SmartExam</strong>
            <small>Seating &amp; Invigilation</small>
          </div>
        </div>

        <nav>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${tab.id === active ? "active" : ""}`}
              onClick={() => setActive(tab.id)}
            >
              <span className="nav-icon" aria-hidden="true">
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </nav>

        <footer className="sidebar-footer">
          React + FastAPI + SQLite
        </footer>
      </aside>

      <main className="content">
        <Page onNavigate={setActive} />
      </main>
    </div>
  );
}
