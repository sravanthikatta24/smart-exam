// Thin wrapper around fetch for the SmartExam API.
// In development Vite proxies /api to the FastAPI server on port 8000.
const BASE = import.meta.env.VITE_API_URL ?? "/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the API. Is the FastAPI server running?");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string" ? detail : detail?.[0]?.msg || `Request failed (${response.status})`
    );
  }
  return data;
}

export const api = {
  stats: () => request("/stats"),

  list: (resource) => request(`/${resource}`),
  create: (resource, body) =>
    request(`/${resource}`, { method: "POST", body: JSON.stringify(body) }),
  update: (resource, id, body) =>
    request(`/${resource}/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  remove: (resource, id) => request(`/${resource}/${id}`, { method: "DELETE" }),

  seatingPlan: (examId) => request(`/seating/${examId}`),
  allocateSeats: (body) =>
    request("/seating/allocate", { method: "POST", body: JSON.stringify(body) }),
  clearExamSeating: (examId) => request(`/seating/${examId}`, { method: "DELETE" }),
  clearRoomSeating: (examId, roomId) =>
    request(`/seating/${examId}/room/${roomId}`, { method: "DELETE" }),

  assignmentsFor: (examId) => request(`/invigilation/${examId}`),
  assignInvigilator: (body) =>
    request("/invigilation/assign", { method: "POST", body: JSON.stringify(body) }),
  removeAssignment: (id) =>
    request(`/invigilation/assignment/${id}`, { method: "DELETE" }),
};
