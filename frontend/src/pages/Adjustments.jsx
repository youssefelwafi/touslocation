import { useEffect, useState } from "react";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import { formatDateTime, formatMoney } from "../utils/format";

const EMPTY = { materiel_id: "", type: "in", quantite: 1, valeur_unitaire: "", motif: "", note: "" };

export default function Adjustments() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    api.get("/ajustements").then((r) => setRows(r.data.data || r.data)).finally(() => setLoading(false));
  }
  useEffect(() => {
    load();
    api.get("/materiels", { params: { per_page: 100 } }).then((r) => setEquipments(r.data.data || r.data));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const selectedPurchasePrice = equipments.find((e) => e.id === Number(form.materiel_id))?.prix_achat ?? null;
  function openCreate() { setForm(EMPTY); setError(""); setOpen(true); }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.post("/ajustements", form);
      setOpen(false); load();
      api.get("/materiels", { params: { per_page: 100 } }).then((r) => setEquipments(r.data.data || r.data));
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{t("adjustments.title")}</h2>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("adjustments.new")}</button>
      </div>

      {loading ? <Loader /> : (
        <table className="table">
          <thead>
            <tr>
              <th>{t("adjustments.equipment")}</th><th>{t("adjustments.type")}</th><th>{t("adjustments.quantity")}</th>
              <th>{t("adjustments.before")}</th><th>{t("adjustments.after")}</th><th>{t("adjustments.value")}</th><th>{t("adjustments.reason")}</th>
              <th>{t("adjustments.by")}</th><th>{t("rentals.date")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td>{a.materiel?.nom || "-"}</td>
                <td>
                  {a.type === "in"
                    ? <span className="badge badge-available"><ArrowUp size={11} /> {t("adjustments.in")}</span>
                    : <span className="badge badge-cancelled"><ArrowDown size={11} /> {t("adjustments.out")}</span>}
                </td>
                <td>{a.quantite}</td>
                <td className="muted">{a.quantite_avant}</td>
                <td><strong>{a.quantite_apres}</strong></td>
                <td>{a.valeur_totale != null ? formatMoney(a.valeur_totale) : "-"}</td>
                <td>{a.motif}</td>
                <td className="muted">{a.utilisateur?.nom || "-"}</td>
                <td className="muted">{formatDateTime(a.created_at)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="9" className="empty">{t("adjustments.none")}</td></tr>}
          </tbody>
        </table>
      )}

      {open && (
        <Modal title={t("adjustments.create")} onClose={() => setOpen(false)}>
          <form className="form" onSubmit={save}>
            {error && <div className="alert">{error}</div>}
            <label>{t("adjustments.equipment")}</label>
            <select value={form.materiel_id} onChange={set("materiel_id")} required>
              <option value="">{t("adjustments.choose_equipment")}</option>
              {equipments.map((e) => <option key={e.id} value={e.id}>{e.nom} ({t("materials.stock")}: {e.quantite})</option>)}
            </select>

            <div className="form-row">
              <div>
                <label>{t("adjustments.type")}</label>
                <select value={form.type} onChange={set("type")}>
                  <option value="in">{t("adjustments.in")}</option>
                  <option value="out">{t("adjustments.out")}</option>
                </select>
              </div>
              <div>
                <label>{t("adjustments.quantity")}</label>
                <input type="number" min="1" value={form.quantite} onChange={set("quantite")} required />
              </div>
            </div>

            <label>{t("adjustments.unit_value")}</label>
            <input type="number" min="0" step="0.01" value={form.valeur_unitaire} onChange={set("valeur_unitaire")}
              placeholder={selectedPurchasePrice != null ? `${selectedPurchasePrice} (${t("adjustments.value_hint")})` : t("adjustments.value_hint")} />

            <label>{t("adjustments.reason")}</label>
            <input value={form.motif} onChange={set("motif")} placeholder={t("adjustments.reason_ph")} required />

            <label>{t("rentals.note")}</label>
            <input value={form.note} onChange={set("note")} />

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
