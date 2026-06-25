import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Search, Store, ShoppingCart, Plus, Minus, Trash2, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import api, { assetUrl } from "../api";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import { toast, confirmDialog } from "../notify";
import { formatMoney } from "../utils/format";

const TAX = 20;

// Date+heure locale au format input datetime-local (YYYY-MM-DDTHH:mm).
function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function ClientStore() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filtres
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [shop, setShop] = useState("");

  // Panier (articles d'une seule boutique à la fois — contrainte backend).
  const [cart, setCart] = useState([]); // [{ product, quantity }]
  const [cartOpen, setCartOpen] = useState(false);
  const [period, setPeriod] = useState({ start: "", end: "" });
  const [minDt, setMinDt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/boutiques").then((r) => setShops(r.data)).catch(() => setShops([]));
  }, []);

  // Recherche temporisée.
  const debRef = useRef();
  useEffect(() => {
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => setQuery(search.trim()), 350);
    return () => clearTimeout(debRef.current);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    api.get("/catalogue", { params: { search: query, boutique: shop || undefined, page: 1 } })
      .then((r) => { setProducts(r.data.data); setTotal(r.data.total); setPage(1); setLastPage(r.data.last_page); })
      .finally(() => setLoading(false));
  }, [query, shop]);

  function loadMore() {
    const next = page + 1;
    setLoadingMore(true);
    api.get("/catalogue", { params: { search: query, boutique: shop || undefined, page: next } })
      .then((r) => { setProducts((p) => [...p, ...r.data.data]); setPage(next); })
      .finally(() => setLoadingMore(false));
  }

  // --- Panier ---
  const cartCount = cart.reduce((n, c) => n + c.quantity, 0);
  const cartBoutique = cart[0]?.product.proprietaire;
  const inCart = (id) => cart.find((c) => c.product.id === id);

  async function addToCart(p) {
    const boutiqueId = p.proprietaire?.id;
    if (cart.length && cartBoutique?.id !== boutiqueId) {
      if (!(await confirmDialog(t("store.cart_other_shop")))) return;
      setCart([{ product: p, quantity: 1 }]);
      toast(t("store.added"), "success");
      return;
    }
    const existing = inCart(p.id);
    const max = Number(p.quantite) || 99;
    if (existing) {
      setCart((c) => c.map((x) => (x.product.id === p.id ? { ...x, quantity: Math.min(x.quantity + 1, max) } : x)));
    } else {
      setCart((c) => [...c, { product: p, quantity: 1 }]);
    }
    toast(t("store.added"), "success");
  }
  function setQty(id, q) {
    const item = inCart(id);
    const max = Number(item?.product.quantite) || 99;
    const qty = Math.max(1, Math.min(q, max));
    setCart((c) => c.map((x) => (x.product.id === id ? { ...x, quantity: qty } : x)));
  }
  const removeFromCart = (id) => setCart((c) => c.filter((x) => x.product.id !== id));

  function openCart() {
    if (!period.start) { const now = nowLocal(); setPeriod({ start: now, end: now }); setMinDt(now); }
    setError("");
    setCartOpen(true);
  }

  const days = useMemo(() => {
    if (!period.start || !period.end) return 0;
    const s = new Date(period.start); s.setHours(0, 0, 0, 0);
    const e = new Date(period.end); e.setHours(0, 0, 0, 0);
    const d = (e - s) / 86400000;
    return d >= 0 ? d + 1 : 0;
  }, [period]);

  const subtotal = useMemo(
    () => cart.reduce((s, c) => s + Number(c.product.prix_par_jour) * c.quantity * days, 0),
    [cart, days]
  );
  const ttc = subtotal * (1 + TAX / 100);

  async function checkout(e) {
    e.preventDefault();
    if (!cart.length) return;
    setSaving(true); setError("");
    try {
      await api.post("/locations", {
        date_debut: period.start, date_fin: period.end,
        items: cart.map((c) => ({ materiel_id: c.product.id, quantite: c.quantity })),
      });
      setCart([]); setCartOpen(false);
      toast(t("store.sent"), "success");
    } catch (err) {
      setError(err.response?.data?.message || t("common.error"));
    } finally { setSaving(false); }
  }

  return (
    <div>
      <div className="page-head">
        <h2>{t("store.marketplace")}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginInlineStart: "auto" }}>
          {!loading && <span className="muted">{total} {t("store.results")}</span>}
          <button className="cart-btn" onClick={openCart} title={t("store.cart")}>
            <ShoppingCart size={18} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="store-filters">
        <div className="search-field grow">
          <Search size={16} />
          <input placeholder={t("store.search_ph")} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="search-field">
          <Store size={16} />
          <select value={shop} onChange={(e) => setShop(e.target.value)}>
            <option value="">{t("store.all_shops")}</option>
            {shops.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.products_count})</option>)}
          </select>
        </div>
      </div>

      {loading ? <Loader /> : products.length === 0 ? (
        <p className="muted" style={{ padding: 24 }}>{t("store.no_results")}</p>
      ) : (
        <>
          <div className="store-grid">
            {products.map((p) => {
              const qIn = inCart(p.id)?.quantity;
              return (
                <div className="store-card" key={p.id}>
                  <div className="sc-thumb">
                    {p.url_image ? <img src={assetUrl(p.url_image)} alt="" loading="lazy" /> : <ImageIcon size={28} />}
                  </div>
                  <div className="sc-body">
                    <span className="sc-shop"><Store size={11} /> {p.proprietaire?.nom}</span>
                    <strong>{p.nom}</strong>
                    <span className="muted">{p.marque?.nom || p.categorie?.nom}</span>
                    <span className="sc-price">{formatMoney(p.prix_par_jour, p.devise?.symbole || "DH")}{t("store.per")}{p.unite?.symbole || "j"}</span>
                  </div>
                  <button className={qIn ? "btn-ghost" : "btn-primary"} onClick={() => addToCart(p)}>
                    {qIn ? <><Check size={15} /> {t("store.in_cart")} ({qIn})</> : <><Plus size={15} /> {t("store.add")}</>}
                  </button>
                </div>
              );
            })}
          </div>
          {page < lastPage && (
            <div style={{ textAlign: "center", marginTop: 22 }}>
              <button className="btn-ghost" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? t("common.loading") : t("store.load_more")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Panier */}
      {cartOpen && (
        <Modal title={t("store.cart")} onClose={() => setCartOpen(false)} wide>
          {cart.length === 0 ? (
            <p className="muted" style={{ padding: "20px 0" }}>{t("store.cart_empty")}</p>
          ) : (
            <form className="form" onSubmit={checkout}>
              {error && <div className="alert">{error}</div>}
              {cartBoutique && <p className="muted" style={{ marginTop: 0 }}><Store size={12} /> {cartBoutique.nom}</p>}

              <div className="cart-lines">
                {cart.map((c) => (
                  <div className="cart-line" key={c.product.id}>
                    <div className="cl-thumb">
                      {c.product.url_image ? <img src={assetUrl(c.product.url_image)} alt="" /> : <ImageIcon size={18} />}
                    </div>
                    <div className="cl-info">
                      <strong>{c.product.nom}</strong>
                      <span className="muted">{formatMoney(c.product.prix_par_jour, c.product.devise?.symbole || "DH")}{t("store.per")}{c.product.unite?.symbole || "j"}</span>
                    </div>
                    <div className="qty-stepper">
                      <button type="button" onClick={() => setQty(c.product.id, c.quantity - 1)}><Minus size={13} /></button>
                      <span>{c.quantity}</span>
                      <button type="button" onClick={() => setQty(c.product.id, c.quantity + 1)}><Plus size={13} /></button>
                    </div>
                    <strong className="cl-total">{formatMoney(Number(c.product.prix_par_jour) * c.quantity * (days || 1))}</strong>
                    <button type="button" className="icon-btn danger" onClick={() => removeFromCart(c.product.id)}><Trash2 size={15} /></button>
                  </div>
                ))}
              </div>

              <label style={{ marginTop: 14 }}>{t("store.period")}</label>
              <div className="form-row">
                <div>
                  <label>{t("store.start")}</label>
                  <input type="datetime-local" value={period.start} min={minDt}
                    onChange={(e) => setPeriod({ ...period, start: e.target.value })} required />
                </div>
                <div>
                  <label>{t("store.end")}</label>
                  <input type="datetime-local" value={period.end} min={period.start || minDt}
                    onChange={(e) => setPeriod({ ...period, end: e.target.value })} required />
                </div>
              </div>

              <div className="pay-summary" style={{ marginTop: 12 }}>
                <div><span>{t("sales.ht")}</span><strong>{formatMoney(subtotal)}</strong></div>
                <div><span>TVA ({TAX}%)</span><strong>{formatMoney(ttc - subtotal)}</strong></div>
                <div className="ttc"><span>{t("store.estimate")}</span><strong>{formatMoney(ttc)}</strong></div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-ghost" onClick={() => setCartOpen(false)}>{t("common.cancel")}</button>
                <button type="submit" className="btn-primary" disabled={saving || days <= 0}>
                  <ShoppingCart size={15} /> {saving ? t("common.saving") : t("store.checkout")}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </div>
  );
}
