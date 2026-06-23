import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast, confirmDialog } from "../notify";
import { useAuth, isStaff } from "../auth";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

const EMPTY = { nom: "", email: "", telephone: "", password: "", statut: "active" };

export default function Clients() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/clients", { params: { search } })
      .then((res) => setClients(res.data.data || res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  function openCreate() { setEditing(null); setForm(EMPTY); setErrors({}); setModalOpen(true); }
  function openEdit(client) { setEditing(client); setForm({ ...client, password: "" }); setErrors({}); setModalOpen(true); }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (editing) await api.put(`/clients/${editing.id}`, form);
      else await api.post("/clients", form);
      setModalOpen(false);
      load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(client) {
    if (!await confirmDialog(t("common.confirm_delete", { name: client.nom }))) return;
    try {
      await api.delete(`/clients/${client.id}`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || t("common.error"));
    }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h2>{t("clients.title")}</h2>
        <button className="btn-primary" onClick={openCreate}>
          <Plus size={16} /> {t("clients.new")}
        </button>
      </div>

      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input
            placeholder={t("common.search_ph")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
        <button onClick={load}>{t("common.search")}</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("common.name")}</th>
              <th>{t("common.email")}</th>
              <th>{t("common.phone")}</th>
              <th>{t("clients.rentals_count")}</th>{/* alias backend: locations_count */}
              <th>{t("common.status")}</th>
              <th className="actions-col">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.nom}</td>
                <td>{c.email}</td>
                <td dir="ltr">{c.telephone || "-"}</td>
                <td>{c.locations_count ?? 0}</td>
                <td><span className={`badge badge-${c.statut === "active" ? "available" : "inactive"}`}>{t(`status.${c.statut}`)}</span></td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(c)}>
                    <Pencil size={16} />
                  </button>
                  {isStaff(user) && (
                    <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(c)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr><td colSpan="6" className="empty">{t("clients.none")}</td></tr>
            )}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Modal title={editing ? t("clients.edit") : t("clients.new")} onClose={() => setModalOpen(false)}>
          <form className="form" onSubmit={save}>
            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={set("nom")} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}

            <label>{t("common.email")}</label>
            <input type="email" value={form.email} onChange={set("email")} required />
            {errors.email && <small className="err">{errors.email[0]}</small>}

            <label>{t("common.phone")}</label>
            <input value={form.telephone || ""} onChange={set("telephone")} dir="ltr" placeholder="0612345678" />
            {errors.telephone && <small className="err">{errors.telephone[0]}</small>}

            <label>{editing ? t("clients.new_password") : t("common.password")}</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder={editing ? t("clients.leave_blank") : ""}
              required={!editing}
            />
            {errors.password && <small className="err">{errors.password[0]}</small>}

            <label>{t("common.status")}</label>
            <select value={form.statut} onChange={set("statut")}>
              <option value="active">{t("status.active")}</option>
              <option value="inactive">{t("status.inactive")}</option>
            </select>

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
