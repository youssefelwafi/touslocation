import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import { useAuth, isStaff } from "../auth";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", code: "", symbole: "", taux_change: 1, par_defaut: false };

export default function Currencies() {
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
    api.get("/devises").then((res) => setRows(res.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModalOpen(true); }
  function openEdit(c) {
    setEditing(c);
    setForm({ nom: c.nom, code: c.code, symbole: c.symbole, taux_change: c.taux_change, par_defaut: c.par_defaut });
    setErrors({}); setModalOpen(true);
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/devises/${editing.id}`, form);
      else await api.post("/devises", form);
      setModalOpen(false); load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }

  async function remove(c) {
    if (!await confirmDialog(t("common.confirm_delete", { name: c.code }))) return;
    try { await api.delete(`/devises/${c.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h2>{t("currencies.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("currencies.new")}</button>
      </div>

      {loading ? <Loader /> : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("currencies.code")}</th><th>{t("common.name")}</th><th>{t("currencies.symbol")}</th>
              <th>{t("currencies.rate")}</th><th>{t("currencies.is_default")}</th>
              <th>{t("currencies.used")}</th><th className="actions-col">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.nom}</td>
                <td>{c.symbole}</td>
                <td>{Number(c.taux_change).toFixed(4)}</td>
                <td>{c.par_defaut ? <span className="badge badge-available"><Star size={11} /> {t("currencies.default")}</span> : "-"}</td>
                <td>{c.materiels_count ?? 0}</td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(c)}><Pencil size={16} /></button>
                  {isStaff(user) && (
                    <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(c)}><Trash2 size={16} /></button>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="7" className="empty">{t("currencies.none")}</td></tr>}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Modal title={editing ? t("currencies.edit") : t("currencies.new")} onClose={() => setModalOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={set("nom")} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}

            <div className="form-row">
              <div>
                <label>{t("currencies.code")}</label>
                <input value={form.code} onChange={set("code")} maxLength="3" placeholder="MAD" required />
                {errors.code && <small className="err">{errors.code[0]}</small>}
              </div>
              <div>
                <label>{t("currencies.symbol")}</label>
                <input value={form.symbole} onChange={set("symbole")} placeholder="DH" required />
                {errors.symbole && <small className="err">{errors.symbole[0]}</small>}
              </div>
            </div>

            <label>{t("currencies.rate_help")}</label>
            <input type="number" step="0.0001" min="0" value={form.taux_change} onChange={set("taux_change")} required />
            {errors.taux_change && <small className="err">{errors.taux_change[0]}</small>}

            <label className="checkbox">
              <input type="checkbox" checked={form.par_defaut}
                onChange={(e) => setForm({ ...form, par_defaut: e.target.checked })} />
              {t("currencies.is_default")}
            </label>

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
