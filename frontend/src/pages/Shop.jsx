import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ImageIcon, LogIn, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import api, { assetUrl } from "../api";
import Loader from "../components/Loader";
import PublicTopbar from "../components/PublicTopbar";
import { formatMoney } from "../utils/format";

export default function Shop() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/boutiques/${id}`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="landing">
      <PublicTopbar />
      <section className="land-features" style={{ paddingTop: 24 }}>
        <Link to="/boutiques" className="muted" style={{ display: "inline-block", marginBottom: 10 }}>{t("shops.back")}</Link>
        {loading || !data ? <Loader /> : (
          <>
            <div className="store-head">
              <h2 style={{ margin: 0 }}>{data.shop.name}</h2>
              <div className="store-cta">
                <Link to={`/inscription-client?shop=${id}`} className="btn-primary"><UserPlus size={16} /> {t("store.create_to_rent")}</Link>
                <Link to="/connexion" className="btn-ghost"><LogIn size={16} /> {t("store.login_to_rent")}</Link>
              </div>
            </div>
            <div className="store-grid">
              {data.products.map((p) => (
                <div className="store-card" key={p.id}>
                  <div className="sc-thumb">
                    {p.url_image ? <img src={assetUrl(p.url_image)} alt="" /> : <ImageIcon size={28} />}
                  </div>
                  <div className="sc-body">
                    <strong>{p.nom}</strong>
                    <span className="muted">{p.marque?.nom || p.categorie?.nom}</span>
                    <span className="sc-price">{formatMoney(p.prix_par_jour, p.devise?.symbole || "DH")}{t("store.per")}{p.unite?.symbole || "j"}</span>
                  </div>
                </div>
              ))}
              {data.products.length === 0 && <p className="muted">{t("store.none")}</p>}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
