import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", email: "", telephone: "", password: "", statut: "active" };

export default function Users() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/utilisateurs", { params: { search } })
      .then((r) => setRows(r.data.data || r.data))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); }
  function openEdit(r) { setEditing(r); setForm({ ...r, password: "" }); setErrors({}); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/utilisateurs/${editing.id}`, form);
      else await api.post("/utilisateurs", form);
      setOpen(false); load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }
  async function remove(r) {
    if (!await confirmDialog(t("common.confirm_delete", { name: r.nom }))) return;
    try { await api.delete(`/utilisateurs/${r.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{t("users.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("users.new")}</button>
      </div>
      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input placeholder={t("common.search_ph")} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        </div>
        <button onClick={load}>{t("common.search")}</button>
      </div>
      {loading ? <Loader /> : (
        <table className="table">
          <thead><tr><th>{t("common.name")}</th><th>{t("common.email")}</th><th>{t("common.phone")}</th><th>{t("users.rentals_count")}</th><th>{t("common.status")}</th><th className="actions-col">{t("common.actions")}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nom}</td>
                <td>{r.email}</td>
                <td dir="ltr">{r.telephone || "-"}</td>
                <td>{r.rentals_count ?? 0}</td>
                <td><span className={`badge badge-${r.statut === "active" ? "available" : "inactive"}`}>{t(`status.${r.statut}`)}</span></td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(r)}><Pencil size={16} /></button>
                  <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(r)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="6" className="empty">{t("users.none")}</td></tr>}
          </tbody>
        </table>
      )}
      {open && (
        <Modal title={editing ? t("users.edit") : t("users.new")} onClose={() => setOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={set("nom")} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}
            <label>{t("common.email")}</label>
            <input type="email" value={form.email} onChange={set("email")} required />
            {errors.email && <small className="err">{errors.email[0]}</small>}
            <label>{t("common.phone")}</label>
            <input value={form.telephone || ""} onChange={set("telephone")} dir="ltr" />
            {errors.telephone && <small className="err">{errors.telephone[0]}</small>}
            <label>{editing ? t("users.new_password") : t("common.password")}</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder={editing ? t("users.leave_blank") : ""} required={!editing} />
            {errors.password && <small className="err">{errors.password[0]}</small>}
            <label>{t("common.status")}</label>
            <select value={form.statut} onChange={set("statut")}>
              <option value="active">{t("status.active")}</option>
              <option value="inactive">{t("status.inactive")}</option>
            </select>
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t("common.cancel")}</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
