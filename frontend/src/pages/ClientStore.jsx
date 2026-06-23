import { useEffect, useMemo, useState } from "react";
import { ImageIcon, CalendarPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import api, { assetUrl } from "../api";
import { useAuth } from "../auth";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import { toast } from "../notify";
import { formatMoney } from "../utils/format";

const TAX = 20;

export default function ClientStore() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null); // product being requested
  const [form, setForm] = useState({ start: "", end: "", quantity: 1 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.proprietaire_id) { setLoading(false); return; }
    api.get(`/boutiques/${user.proprietaire_id}`).then((r) => setProducts(r.data.products)).finally(() => setLoading(false));
  }, [user]);

  const days = useMemo(() => {
    if (!form.start || !form.end) return 0;
    const d = (new Date(form.end) - new Date(form.start)) / 86400000;
    return d >= 0 ? d + 1 : 0;
  }, [form]);
  const total = sel ? Number(sel.prix_par_jour) * Number(form.quantity || 1) * days * (1 + TAX / 100) : 0;

  function openRequest(p) {
    setSel(p);
    setForm({ start: "", end: "", quantity: 1 });
    setError("");
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post("/locations", {
        date_debut: form.start, date_fin: form.end,
        items: [{ materiel_id: sel.id, quantite: Number(form.quantity) }],
      });
      setSel(null);
      toast(t("store.sent"), "success");
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-head"><h2>{t("store.title")}</h2></div>
      <div className="store-grid">
        {products.map((p) => (
          <div className="store-card" key={p.id}>
            <div className="sc-thumb">
              {p.url_image ? <img src={assetUrl(p.url_image)} alt="" /> : <ImageIcon size={28} />}
            </div>
            <div className="sc-body">
              <strong>{p.nom}</strong>
              <span className="muted">{p.marque?.nom || p.categorie?.nom}</span>
              <span className="sc-price">{formatMoney(p.prix_par_jour, p.devise?.symbole || "DH")}{t("store.per")}{p.unite?.symbole || "j"}</span>
            </div>
            <button className="btn-primary" onClick={() => openRequest(p)}><CalendarPlus size={15} /> {t("store.rent")}</button>
          </div>
        ))}
        {products.length === 0 && <p className="muted">{t("store.none")}</p>}
      </div>

      {sel && (
        <Modal title={`${t("store.request_title")} — ${sel.nom}`} onClose={() => setSel(null)}>
          <form className="form" onSubmit={submit}>
            {error && <div className="alert">{error}</div>}
            <div className="form-row">
              <div>
                <label>{t("store.start")}</label>
                <input type="date" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} required />
              </div>
              <div>
                <label>{t("store.end")}</label>
                <input type="date" value={form.end} min={form.start} onChange={(e) => setForm({ ...form, end: e.target.value })} required />
              </div>
            </div>
            <label>{t("store.qty")}</label>
            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            <div className="pay-summary" style={{ marginTop: 12 }}>
              <div className="ttc"><span>{t("store.estimate")}</span><strong>{formatMoney(total)}</strong></div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setSel(null)}>{t("common.cancel")}</button>
              <button type="submit" className="btn-primary" disabled={saving || days <= 0}>{saving ? t("common.saving") : t("store.submit")}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
