import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", email: "", password: "", statut: "active", permissions: [] };

export default function Employees() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/employes").then((r) => setRows(r.data.data || r.data)).finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
    api.get("/modules").then((r) => setModules(r.data));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  function toggle(mod) {
    setForm((f) => ({ ...f, permissions: f.permissions.includes(mod) ? f.permissions.filter((m) => m !== mod) : [...f.permissions, mod] }));
  }
  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); }
  function openEdit(r) { setEditing(r); setForm({ nom: r.nom, email: r.email, password: "", statut: r.statut, permissions: r.permissions || [] }); setErrors({}); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/employes/${editing.id}`, form);
      else await api.post("/employes", form);
      setOpen(false); load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }
  async function remove(r) {
    if (!await confirmDialog(t("common.confirm_delete", { name: r.nom }))) return;
    try { await api.delete(`/employes/${r.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{t("employees.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("employees.new")}</button>
      </div>
      {loading ? <Loader /> : (
        <table className="table">
          <thead><tr><th>{t("common.name")}</th><th>{t("common.email")}</th><th>{t("employees.permissions")}</th><th>{t("common.status")}</th><th className="actions-col">{t("common.actions")}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nom}</td>
                <td>{r.email}</td>
                <td className="muted">{(r.permissions || []).map((m) => t(`employees.mod.${m}`)).join(", ") || "-"}</td>
                <td><span className={`badge badge-${r.statut === "active" ? "available" : "inactive"}`}>{t(`status.${r.statut}`)}</span></td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(r)}><Pencil size={16} /></button>
                  <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(r)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="5" className="empty">{t("employees.none")}</td></tr>}
          </tbody>
        </table>
      )}
      {open && (
        <Modal title={editing ? t("employees.edit") : t("employees.new")} onClose={() => setOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={set("nom")} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}
            <label>{t("common.email")}</label>
            <input type="email" value={form.email} onChange={set("email")} required />
            {errors.email && <small className="err">{errors.email[0]}</small>}
            <label>{editing ? t("employees.new_password") : t("common.password")}</label>
            <input type="password" value={form.password} onChange={set("password")} placeholder={editing ? t("employees.leave_blank") : ""} required={!editing} />
            {errors.password && <small className="err">{errors.password[0]}</small>}

            <label>{t("employees.permissions")}</label>
            <div className="perm-grid">
              {modules.map((m) => (
                <label key={m} className="perm-item">
                  <input type="checkbox" checked={form.permissions.includes(m)} onChange={() => toggle(m)} />
                  {t(`employees.mod.${m}`)}
                </label>
              ))}
            </div>

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
