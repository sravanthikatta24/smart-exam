import CrudPage from "../components/CrudPage.jsx";

export default function Rooms() {
  return (
    <CrudPage
      resource="rooms"
      title="Rooms"
      description="Exam halls and their seating capacity."
      searchKeys={["name"]}
      emptyText="No rooms yet. Add an exam hall."
      fields={[
        { name: "name", label: "Room name", required: true, placeholder: "Hall A" },
        {
          name: "capacity",
          label: "Capacity",
          type: "number",
          min: 1,
          max: 1000,
          required: true,
          placeholder: "40",
        },
      ]}
      columns={[
        { key: "name", label: "Room" },
        { key: "capacity", label: "Capacity" },
      ]}
    />
  );
}
