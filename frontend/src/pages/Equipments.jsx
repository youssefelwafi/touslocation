import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, CalendarDays, ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import api, { assetUrl } from "../api";
import { toast, confirmDialog } from "../notify";
import { useAuth, isStaff as checkStaff } from "../auth";
import Modal from "../components/Modal";
import Loader from "../components/Loader";
import AvailabilityCalendar from "../components/AvailabilityCalendar";
import { formatMoney } from "../utils/format";

const EMPTY = {
  nom: "", description: "", categorie_id: "", marque_id: "", unite_id: "", devise_id: "",
  prix_par_jour: "", quantite: 1, jours_tampon: 0, note_tampon: "", statut: "available",
};

export default function Equipments() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isStaff = checkStaff(user);

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [search, setSearch] = useState("");
  const [fCategory, setFCategory] = useState("");
  const [fBrand, setFBrand] = useState("");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [calendarItem, setCalendarItem] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  function load() {
    setLoading(true);
    api.get("/materiels", { params: { search, categorie_id: fCategory, marque_id: fBrand, per_page: 50 } })
      .then((res) => setItems(res.data.data || res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    Promise.all([api.get("/categories"), api.get("/marques"), api.get("/unites"), api.get("/devises")])
      .then(([c, b, u, cur]) => {
        setCategories(c.data.data || c.data);
        setBrands(b.data.data || b.data);
        setUnits(u.data.data || u.data);
        setCurrencies(cur.data.data || cur.data);
      });
    // eslint-disable-next-line
  }, []);

  function resetImage() { setImageFile(null); setPreview(null); }

  function openCreate() {
    const defaultCurrency = currencies.find((c) => c.par_defaut);
    setEditing(null);
    setForm({ ...EMPTY, devise_id: defaultCurrency?.id || "", unite_id: units[0]?.id || "" });
    resetImage(); setErrors({}); setModalOpen(true);
  }

  function openEdit(eq) {
    setEditing(eq);
    setForm({
      nom: eq.nom, description: eq.description || "",
      categorie_id: eq.categorie_id || "", marque_id: eq.marque_id || "",
      unite_id: eq.unite_id || "", devise_id: eq.devise_id || "",
      prix_par_jour: eq.prix_par_jour, quantite: eq.quantite,
      jours_tampon: eq.jours_tampon ?? 0, note_tampon: eq.note_tampon || "", statut: eq.statut,
    });
    resetImage();
    setPreview(assetUrl(eq.url_image));
    setErrors({}); setModalOpen(true);
  }

  function onPickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      if (imageFile) {
        // Multipart (avec image) — POST + spoof _method=PUT pour l'édition.
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => { if (v !== "" && v !== null) fd.append(k, v); });
        fd.append("image", imageFile);
        if (editing) fd.append("_method", "PUT");
        const url = editing ? `/materiels/${editing.id}` : "/materiels";
        await api.post(url, fd, { headers: { "Content-Type": "multipart/form-data" } });
      } else {
        const payload = { ...form, unite_id: form.unite_id || null, devise_id: form.devise_id || null, marque_id: form.marque_id || null };
        if (editing) await api.put(`/materiels/${editing.id}`, payload);
        else await api.post("/materiels", payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else toast(err.response?.data?.message || t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(eq) {
    if (!await confirmDialog(t("common.confirm_delete", { name: eq.nom }))) return;
    try { await api.delete(`/materiels/${eq.id}`); load(); }
    catch (err) { toast(err.response?.data?.message || t("common.error")); }
  }

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div>
      <div className="page-head">
        <h2>{t("materials.title")}</h2>
        {isStaff && (
          <button className="btn-primary" onClick={openCreate}><Plus size={16} /> {t("materials.new")}</button>
        )}
      </div>

      <div className="toolbar">
        <div className="search-field">
          <Search size={16} />
          <input placeholder={t("common.search_ph")} value={search}
            onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} />
        </div>
        <select value={fCategory} onChange={(e) => setFCategory(e.target.value)}>
          <option value="">{t("materials.category")}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <select value={fBrand} onChange={(e) => setFBrand(e.target.value)}>
          <option value="">{t("nav.brands")}</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
        </select>
        <button onClick={load}>{t("common.search")}</button>
      </div>

      {loading ? <Loader /> : (
        <table className="table">
          <thead>
            <tr>
              <th></th>
              <th>{t("common.name")}</th>
              <th>{t("materials.category")}</th>
              <th>{t("nav.brands")}</th>
              <th>{t("materials.price_col")}</th>
              <th>{t("materials.stock")}</th>
              <th>{t("common.status")}</th>
              <th className="actions-col">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((eq) => (
              <tr key={eq.id}>
                <td>
                  {eq.url_image
                    ? <img className="thumb clickable" src={assetUrl(eq.url_image)} alt="" onClick={() => setLightbox(assetUrl(eq.url_image))} />
                    : <span className="thumb thumb-empty"><ImageIcon size={16} /></span>}
                </td>
                <td>{eq.nom}</td>
                <td>{eq.categorie?.nom || "-"}</td>
                <td>{eq.marque?.nom || "-"}</td>
                <td>
                  {formatMoney(eq.prix_par_jour, eq.devise?.symbole || "DH")}
                  <span className="muted"> / {eq.unite?.symbole || "j"}</span>
                </td>
                <td>{eq.quantite}</td>
                <td><span className={`badge badge-${eq.statut}`}>{t(`status.${eq.statut}`)}</span></td>
                <td className="actions-col">
                  <button className="icon-btn" title={t("materials.calendar")} onClick={() => setCalendarItem(eq)}><CalendarDays size={16} /></button>
                  {isStaff && <button className="icon-btn" title={t("common.edit")} onClick={() => openEdit(eq)}><Pencil size={16} /></button>}
                  {isStaff && <button className="icon-btn danger" title={t("common.delete")} onClick={() => remove(eq)}><Trash2 size={16} /></button>}
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan="8" className="empty">{t("materials.none_found")}</td></tr>}
          </tbody>
        </table>
      )}

      {modalOpen && (
        <Modal title={editing ? t("materials.edit") : t("materials.new")} onClose={() => setModalOpen(false)}>
          <form className="form" onSubmit={save}>
            <div className="image-field">
              <div className="image-preview">
                {preview ? <img src={preview} alt="" /> : <ImageIcon size={28} />}
              </div>
              <label className="btn-ghost file-btn">
                <input type="file" accept="image/*" onChange={onPickImage} hidden />
                {t("common.add")} image
              </label>
            </div>
            {errors.image && <small className="err">{errors.image[0]}</small>}

            <label>{t("common.name")}</label>
            <input value={form.nom} onChange={set("nom")} required />
            {errors.nom && <small className="err">{errors.nom[0]}</small>}

            <div className="form-row">
              <div>
                <label>{t("materials.category")}</label>
                <select value={form.categorie_id} onChange={set("categorie_id")} required>
                  <option value="">{t("materials.choose")}</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                {errors.categorie_id && <small className="err">{errors.categorie_id[0]}</small>}
              </div>
              <div>
                <label>{t("nav.brands")}</label>
                <select value={form.marque_id} onChange={set("marque_id")}>
                  <option value="">{t("common.none")}</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.nom}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>{t("materials.price")}</label>
                <input type="number" step="0.01" min="0" value={form.prix_par_jour} onChange={set("prix_par_jour")} required />
                {errors.prix_par_jour && <small className="err">{errors.prix_par_jour[0]}</small>}
              </div>
              <div>
                <label>{t("materials.qty")}</label>
                <input type="number" min="0" value={form.quantite} onChange={set("quantite")} required />
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>{t("materials.unit")}</label>
                <select value={form.unite_id} onChange={set("unite_id")}>
                  <option value="">{t("common.none")}</option>
                  {units.map((u) => <option key={u.id} value={u.id}>{u.nom} ({u.symbole})</option>)}
                </select>
              </div>
              <div>
                <label>{t("materials.currency")}</label>
                <select value={form.devise_id} onChange={set("devise_id")}>
                  <option value="">{t("common.none")}</option>
                  {currencies.map((c) => <option key={c.id} value={c.id}>{c.code} ({c.symbole})</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div>
                <label>{t("materials.buffer_days")}</label>
                <input type="number" min="0" max="365" value={form.jours_tampon} onChange={set("jours_tampon")} />
              </div>
              <div>
                <label>{t("common.status")}</label>
                <select value={form.statut} onChange={set("statut")}>
                  <option value="available">{t("status.available")}</option>
                  <option value="maintenance">{t("status.maintenance")}</option>
                  <option value="inactive">{t("status.inactive")}</option>
                </select>
              </div>
            </div>

            <label>{t("materials.buffer_note")}</label>
            <input value={form.note_tampon} onChange={set("note_tampon")} />

            <label>{t("materials.description")}</label>
            <textarea rows="2" value={form.description} onChange={set("description")} />

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>{t("common.cancel")}</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? t("common.saving") : t("common.save")}</button>
            </div>
          </form>
        </Modal>
      )}

      {calendarItem && <AvailabilityCalendar equipment={calendarItem} onClose={() => setCalendarItem(null)} />}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="" />
        </div>
      )}
    </div>
  );
}
