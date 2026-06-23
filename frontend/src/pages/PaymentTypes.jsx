import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", actif: true };

export default function PaymentTypes() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/types-paiement").then((r) => setRows(r.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); }
  function openEdit(r) { setEditing(r); setForm({ nom: r.nom, actif: r.actif }); setErrors({}); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/types-paiement/${editing.id}`, form);
      else await api.post("/types-paiement", form);
      setOpen(false); load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }
  async function remove(r) {
    if (!await confirmDialog(t("common.confirm_delete", { name: r.nom }))) return;
    try { await api.delete(`/types-paiement/${r.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{t("payment_types.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("payment_types.new")}</button>
      </div>
      {loading ? <Loader /> : (
        <table className="table">
          <thead><tr><th>{t("common.name")}</th><th>{t("payment_types.active")}</th><th>{t("payment_types.used")}</th><th className="actions-col">{t("common.actions")}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nom}</td>
                <td><span className={`badge badge-${r.actif ? "available" : "inactive"}`}>{r.actif ? t("status.active") : t("status.inactive")}</span></td>
                <td>{r.paiements_count ?? 0}</td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(r)}><Pencil size={16} /></button>
                  <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(r)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="4" className="empty">{t("payment_types.none")}</td></tr>}
          </tbody>
        </table>
      )}
      {open && (
        <Modal title={editing ? t("payment_types.edit") : t("payment_types.new")} onClose={() => setOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}
            <label className="checkbox">
              <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} />
              {t("payment_types.active")}
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
