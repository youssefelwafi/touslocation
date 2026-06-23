import { useEffect, useMemo, useState } from "react";
import { Search, Plus, Minus, Trash2, ImageIcon, PackageCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import api, { assetUrl } from "../api";
import Modal from "./Modal";
import { formatMoney } from "../utils/format";

export default function RentalForm({ onClose, onCreated }) {
  const { t } = useTranslation();
  const [clients, setClients] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxRate, setTaxRate] = useState(20); // TVA par défaut (réglages)
  const [avail, setAvail] = useState({}); // {equipmentId: availableUnits}

  const [clientId, setClientId] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [cart, setCart] = useState([]); // [{equipment, quantity}]
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/clients"), api.get("/materiels", { params: { per_page: 100 } }), api.get("/categories"), api.get("/taxes")])
      .then(([c, e, cat, tx]) => {
        setClients(c.data.data || c.data);
        setEquipments(e.data.data || e.data);
        setCategories(cat.data.data || cat.data);
        const def = (tx.data || []).find((x) => x.par_defaut);
        if (def) setTaxRate(Number(def.taux));
      });
  }, []);

  const days = useMemo(() => {
    if (!start || !end) return 0;
    const d = (new Date(end) - new Date(start)) / 86400000;
    return d >= 0 ? d + 1 : 0;
  }, [start, end]);

  // Disponibilité réelle sur la période choisie.
  useEffect(() => {
    if (start && end && days > 0) {
      api.get("/materiels-disponibilite", { params: { from: start, to: end } })
        .then((r) => setAvail(r.data))
        .catch(() => setAvail({}));
    }
  }, [start, end, days]);

  const availOf = (id) => (avail[id] !== undefined ? avail[id] : null);
  const inCart = (id) => cart.find((c) => c.equipment.id === id);

  const filtered = useMemo(() => {
    return equipments.filter((e) => {
      const okCat = !fCategory || String(e.categorie_id) === String(fCategory);
      const q = search.trim().toLowerCase();
      const okSearch = !q || e.nom.toLowerCase().includes(q) || (e.marque?.nom || "").toLowerCase().includes(q);
      return okCat && okSearch;
    });
  }, [equipments, search, fCategory]);

  function addToCart(eq) {
    const max = availOf(eq.id);
    const existing = inCart(eq.id);
    const current = existing?.quantity || 0;
    if (max !== null && current + 1 > max) return; // ne pas dépasser la dispo
    if (existing) {
      setCart((c) => c.map((x) => (x.equipment.id === eq.id ? { ...x, quantity: x.quantity + 1 } : x)));
    } else {
      setCart((c) => [...c, { equipment: eq, quantity: 1 }]);
    }
  }
  function setQty(id, q) {
    const max = availOf(id);
    let qty = Math.max(1, q);
    if (max !== null) qty = Math.min(qty, max);
    setCart((c) => c.map((x) => (x.equipment.id === id ? { ...x, quantity: qty } : x)));
  }
  const removeFromCart = (id) => setCart((c) => c.filter((x) => x.equipment.id !== id));

  const subtotal = useMemo(
    () => cart.reduce((s, x) => s + Number(x.equipment.prix_par_jour) * x.quantity * days, 0),
    [cart, days]
  );
  const tax = +(subtotal * taxRate / 100).toFixed(2);
  const ttc = subtotal + tax;

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!cart.length) { setError(t("rentals.no_items")); return; }
    setSaving(true);
    try {
      const { data } = await api.post("/locations", {
        client_id: clientId || null,
        date_debut: start,
        date_fin: end,
        items: cart.map((x) => ({ materiel_id: x.equipment.id, quantite: x.quantity })),
      });
      onCreated?.(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  const datesReady = days > 0;

  return (
    <Modal title={t("rentals.create")} onClose={onClose} wide>
      <form className="form" onSubmit={submit}>
        {error && <div className="alert">{error}</div>}

        <div className="form-row">
          <div>
            <label>{t("rentals.client")}</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">{t("rentals.choose_client")}</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          <div>
            <label>{t("rentals.start")}</label>
            <input type="date" value={start} min={today} onChange={(e) => setStart(e.target.value)} required />
          </div>
          <div>
            <label>{t("rentals.end")}</label>
            <input type="date" value={end} min={start || today} onChange={(e) => setEnd(e.target.value)} required />
          </div>
        </div>
        {datesReady && <small className="muted">{days} {t("rentals.days")}</small>}

        <div className="picker">
          {/* Catalogue */}
          <div className="picker-catalog">
            <div className="toolbar">
              <div className="search-field">
                <Search size={15} />
                <input placeholder={t("common.search_ph")} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
                <option value="">{t("materials.category")}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>

            {!datesReady && <p className="muted pick-hint">{t("rentals.start")} / {t("rentals.end")} …</p>}

            <div className="product-grid">
              {filtered.map((eq) => {
                const a = availOf(eq.id);
                const disabled = datesReady && a !== null && (inCart(eq.id)?.quantity || 0) >= a;
                const out = datesReady && a !== null && a <= 0;
                return (
                  <button type="button" key={eq.id}
                    className={`product-card${out ? " out" : ""}`}
                    onClick={() => datesReady && !out && addToCart(eq)}
                    disabled={!datesReady || out || disabled}>
                    <div className="pc-thumb">
                      {eq.url_image ? <img src={assetUrl(eq.url_image)} alt="" /> : <ImageIcon size={22} />}
                    </div>
                    <div className="pc-body">
                      <strong>{eq.nom}</strong>
                      <span className="muted">{eq.marque?.nom || eq.categorie?.nom}</span>
                      <span className="pc-price">{formatMoney(eq.prix_par_jour, eq.devise?.symbole || "DH")}/{eq.unite?.symbole || "j"}</span>
                    </div>
                    {datesReady && a !== null && (
                      <span className={`pc-avail ${out ? "none" : ""}`}>{a} {t("materials.stock").toLowerCase()}</span>
                    )}
                  </button>
                );
              })}
              {filtered.length === 0 && <p className="muted">{t("materials.none_found")}</p>}
            </div>
          </div>

          {/* Panier */}
          <div className="picker-cart">
            <h4><PackageCheck size={16} /> {cart.length}</h4>
            {cart.length === 0 && <p className="muted">{t("rentals.no_items")}</p>}
            {cart.map((x) => (
              <div className="cart-line" key={x.equipment.id}>
                <div className="cl-info">
                  <strong>{x.equipment.nom}</strong>
                  <span className="muted">{formatMoney(Number(x.equipment.prix_par_jour) * x.quantity * days)}</span>
                </div>
                <div className="qty-stepper">
                  <button type="button" onClick={() => setQty(x.equipment.id, x.quantity - 1)}><Minus size={13} /></button>
                  <span>{x.quantity}</span>
                  <button type="button" onClick={() => setQty(x.equipment.id, x.quantity + 1)}><Plus size={13} /></button>
                </div>
                <button type="button" className="icon-btn danger" onClick={() => removeFromCart(x.equipment.id)}><Trash2 size={14} /></button>
              </div>
            ))}

            <div className="pay-summary" style={{ marginTop: 12 }}>
              <div><span>{t("rentals.ht")}</span><strong>{formatMoney(subtotal)}</strong></div>
              <div><span>{t("rentals.tva")} ({taxRate}%)</span><strong>{formatMoney(tax)}</strong></div>
              <div className="ttc"><span>{t("rentals.estimated")}</span><strong>{formatMoney(ttc)}</strong></div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>{t("common.cancel")}</button>
          <button type="submit" className="btn-primary" disabled={saving || !datesReady || cart.length === 0}>
            {saving ? t("common.saving") : t("rentals.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
