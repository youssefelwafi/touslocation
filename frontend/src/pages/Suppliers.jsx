import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", telephone: "", email: "", adresse: "" };

export default function Suppliers() {
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
    api.get("/fournisseurs", { params: { search } }).then((r) => setRows(r.data)).finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); }
  function openEdit(r) { setEditing(r); setForm({ nom: r.nom, telephone: r.telephone || "", email: r.email || "", adresse: r.adresse || "" }); setErrors({}); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true); setErrors({});
    try {
      if (editing) await api.put(`/fournisseurs/${editing.id}`, form);
      else await api.post("/fournisseurs", form);
      setOpen(false); load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }
  async function remove(r) {
    if (!await confirmDialog(t("common.confirm_delete", { name: r.nom }))) return;
    try { await api.delete(`/fournisseurs/${r.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{t("suppliers.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("suppliers.new")}</button>
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
          <thead><tr><th>{t("common.name")}</th><th>{t("suppliers.phone")}</th><th>{t("suppliers.email")}</th><th>{t("suppliers.address")}</th><th>{t("suppliers.purchases_count")}</th><th className="actions-col">{t("common.actions")}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.nom}</td>
                <td dir="ltr">{r.telephone || "-"}</td>
                <td>{r.email || "-"}</td>
                <td className="muted">{r.adresse || "-"}</td>
                <td>{r.achats_count ?? 0}</td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(r)}><Pencil size={16} /></button>
                  <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(r)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="6" className="empty">{t("suppliers.none")}</td></tr>}
          </tbody>
        </table>
      )}
      {open && (
        <Modal title={editing ? t("suppliers.edit") : t("suppliers.new")} onClose={() => setOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={set("nom")} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}
            <div className="form-row">
              <div>
                <label>{t("suppliers.phone")}</label>
                <input value={form.telephone} onChange={set("telephone")} dir="ltr" />
              </div>
              <div>
                <label>{t("suppliers.email")}</label>
                <input type="email" value={form.email} onChange={set("email")} />
                {errors.email && <small className="err">{errors.email[0]}</small>}
              </div>
            </div>
            <label>{t("suppliers.address")}</label>
            <input value={form.adresse} onChange={set("adresse")} />
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
