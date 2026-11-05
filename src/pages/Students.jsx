import CrudPage from "../components/CrudPage.jsx";

const DEPARTMENTS = [
  "Computer Science",
  "Electronics",
  "Mechanical",
  "Civil",
  "Information Technology",
  "Electrical",
];

export default function Students() {
  return (
    <CrudPage
      resource="students"
      title="Students"
      description="Maintain the student register used for seating allocation."
      searchKeys={["roll_no", "name", "department"]}
      emptyText="No students yet. Add your first student."
      fields={[
        { name: "roll_no", label: "Roll number", required: true, placeholder: "23CS001" },
        { name: "name", label: "Full name", required: true, placeholder: "Aarav Sharma" },
        { name: "department", label: "Department", required: true, options: DEPARTMENTS },
        {
          name: "year",
          label: "Academic year",
          type: "number",
          min: 1,
          max: 6,
          required: true,
          placeholder: "3",
        },
      ]}
      columns={[
        { key: "roll_no", label: "Roll no." },
        { key: "name", label: "Name" },
        { key: "department", label: "Department" },
        { key: "year", label: "Year" },
      ]}
    />
  );
}
