import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import { useAuth, isStaff } from "../auth";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", symbole: "" };

export default function Units() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/unites").then((res) => setRows(res.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModalOpen(true); }
  function openEdit(u) { setEditing(u); setForm({ nom: u.nom, symbole: u.symbole }); setErrors({}); setModalOpen(true); }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/unites/${editing.id}`, form);
      else await api.post("/unites", form);
      setModalOpen(false); load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }

  async function remove(u) {
    if (!await confirmDialog(t("common.confirm_delete", { name: u.nom }))) return;
    try { await api.delete(`/unites/${u.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h2>{t("units.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("units.new")}</button>
      </div>

      {loading ? <Loader /> : (
        <table className="table">
          <thead>
            <tr><th>{t("common.name")}</th><th>{t("units.unit_symbol")}</th><th>{t("units.used")}</th><th className="actions-col">{t("common.actions")}</th></tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>{u.nom}</td>
                <td>{u.symbole}</td>
                <td>{u.materiels_count ?? 0}</td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(u)}><Pencil size={16} /></button>
                  {isStaff(user) && (
                    <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(u)}><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="4" className="empty">{t("units.none")}</td></tr>}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Modal title={editing ? t("units.edit") : t("units.new")} onClose={() => setModalOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("units.unit_name")}</label>
            <input value={form.nom} onChange={set("nom")} placeholder="Jour" required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}

            <label>{t("units.unit_symbol")}</label>
            <input value={form.symbole} onChange={set("symbole")} placeholder="j" required />
            {errors.symbole && <small className="err">{errors.symbole[0]}</small>}

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
