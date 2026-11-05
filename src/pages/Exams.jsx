import CrudPage from "../components/CrudPage.jsx";
import { formatDate } from "../utils.js";

export default function Exams() {
  return (
    <CrudPage
      resource="exams"
      title="Exams"
      description="Exam sessions that students are seated for."
      searchKeys={["name", "subject"]}
      emptyText="No exams scheduled yet."
      fields={[
        { name: "name", label: "Exam name", required: true, placeholder: "Semester 3 Mid-Term" },
        { name: "subject", label: "Subject", required: true, placeholder: "Data Structures" },
        { name: "exam_date", label: "Date", type: "date", required: true },
        { name: "exam_time", label: "Time", required: true, placeholder: "10:00 AM" },
      ]}
      columns={[
        { key: "name", label: "Exam" },
        { key: "subject", label: "Subject" },
        { key: "exam_date", label: "Date", render: (row) => formatDate(row.exam_date) },
        { key: "exam_time", label: "Time" },
      ]}
    />
  );
}
