import CrudPage from "../components/CrudPage.jsx";

export default function Faculty() {
  return (
    <CrudPage
      resource="faculty"
      title="Faculty"
      description="Faculty members available for invigilation duty."
      searchKeys={["name", "department"]}
      emptyText="No faculty members yet."
      fields={[
        { name: "name", label: "Full name", required: true, placeholder: "Dr. Ramesh Kumar" },
        {
          name: "department",
          label: "Department",
          required: true,
          placeholder: "Computer Science",
        },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "department", label: "Department" },
      ]}
    />
  );
}
