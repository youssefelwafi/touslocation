import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import { useAuth, isStaff } from "../auth";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", taux: 20, par_defaut: false };

export default function Taxes() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/taxes").then((r) => setRows(r.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); }
  function openEdit(r) { setEditing(r); setForm({ nom: r.nom, taux: r.taux, par_defaut: r.par_defaut }); setErrors({}); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/taxes/${editing.id}`, form);
      else await api.post("/taxes", form);
      setOpen(false); load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }
  async function remove(r) {
    if (!await confirmDialog(t("common.confirm_delete", { name: r.nom }))) return;
    try { await api.delete(`/taxes/${r.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{t("taxes.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("taxes.new")}</button>
      </div>
      {loading ? <Loader /> : (
        <table className="table">
          <thead><tr><th>{t("common.name")}</th><th>{t("taxes.rate")}</th><th>{t("taxes.is_default")}</th><th className="actions-col">{t("common.actions")}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nom}</td>
                <td>{Number(r.taux)} %</td>
                <td>{r.par_defaut ? <span className="badge badge-available"><Star size={11} /> {t("taxes.default")}</span> : "-"}</td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(r)}><Pencil size={16} /></button>
                  {isStaff(user) && <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(r)}><Trash2 size={16} /></button>}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="4" className="empty">{t("taxes.none")}</td></tr>}
          </tbody>
        </table>
      )}
      {open && (
        <Modal title={editing ? t("taxes.edit") : t("taxes.new")} onClose={() => setOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={set("nom")} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}
            <label>{t("taxes.rate")}</label>
            <input type="number" min="0" max="100" step="0.01" value={form.taux} onChange={set("taux")} required />
            {errors.taux && <small className="err">{errors.taux[0]}</small>}
            <label className="checkbox">
              <input type="checkbox" checked={form.par_defaut} onChange={(e) => setForm({ ...form, par_defaut: e.target.checked })} />
              {t("taxes.is_default")}
            </label>
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
