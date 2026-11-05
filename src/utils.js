export function formatDate(iso) {
  if (!iso) return "—";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function percent(part, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}
