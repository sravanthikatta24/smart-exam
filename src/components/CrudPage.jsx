import { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const emptyForm = (fields) =>
  Object.fromEntries(fields.map((field) => [field.name, ""]));

/**
 * Reusable add/edit/delete screen for a single backend resource.
 *
 * fields:  [{ name, label, type, placeholder, min, max, required, options }]
 * columns: [{ key, label, render? }]
 */
export default function CrudPage({
  resource,
  title,
  description,
  fields,
  columns,
  searchKeys = [],
  emptyText = "No records yet.",
}) {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(() => emptyForm(fields));
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setRows(await api.list(resource));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      searchKeys.some((key) => String(row[key] ?? "").toLowerCase().includes(query))
    );
  }, [rows, search, searchKeys]);

  const resetForm = () => {
    setForm(emptyForm(fields));
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    const payload = Object.fromEntries(
      fields.map((field) => [
        field.name,
        field.type === "number" ? Number(form[field.name]) : form[field.name],
      ])
    );

    try {
      if (editingId) {
        await api.update(resource, editingId, payload);
      } else {
        await api.create(resource, payload);
      }
      setNotice(editingId ? "Record updated." : "Record added.");
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm(
      Object.fromEntries(fields.map((field) => [field.name, String(row[field.name] ?? "")]))
    );
    setNotice("");
    setError("");
  };

  const remove = async (row) => {
    if (!window.confirm("Delete this record? Related seating and invigilation entries are removed too.")) {
      return;
    }
    try {
      await api.remove(resource, row.id);
      if (editingId === row.id) resetForm();
      setNotice("Record deleted.");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="page">
      <header className="page-head">
        <div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="pill">{rows.length} total</span>
      </header>

      {error && <div className="banner error">{error}</div>}
      {notice && <div className="banner success">{notice}</div>}

      <div className="split">
        <form className="card form-card" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit record" : "Add record"}</h2>

          {fields.map((field) => (
            <label key={field.name} className="field">
              <span>{field.label}</span>
              {field.options ? (
                <select
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                >
                  <option value="">Select…</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  name={field.name}
                  type={field.type ?? "text"}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  value={form[field.name]}
                  onChange={handleChange}
                  required={field.required}
                />
              )}
            </label>
          ))}

          <div className="actions">
            <button type="submit" className="btn primary" disabled={busy}>
              {busy ? "Saving…" : editingId ? "Update" : "Add"}
            </button>
            {editingId && (
              <button type="button" className="btn ghost" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="card">
          <div className="card-head">
            <h2>Records</h2>
            {searchKeys.length > 0 && (
              <input
                className="search"
                placeholder="Search…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            )}
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th className="right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td key={column.key}>
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                    <td className="right nowrap">
                      <button className="btn small" onClick={() => startEdit(row)}>
                        Edit
                      </button>
                      <button className="btn small danger" onClick={() => remove(row)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="empty">
                      {search ? "No matching records." : emptyText}
                    </td>
                  </tr>
                )}
                {loading && (
                  <tr>
                    <td colSpan={columns.length + 1} className="empty">
                      Loading…
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
