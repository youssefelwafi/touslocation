import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import Loader from "../components/Loader";
import PublicTopbar from "../components/PublicTopbar";

export default function Shops() {
  const { t } = useTranslation();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/boutiques").then((r) => setShops(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="landing">
      <PublicTopbar />
      <section className="land-features" style={{ paddingTop: 30 }}>
        <h2>{t("shops.title")}</h2>
        <p className="center" style={{ color: "var(--text-2)", marginTop: -16, marginBottom: 24 }}>{t("shops.subtitle")}</p>
        {loading ? <Loader /> : (
          <div className="land-grid">
            {shops.map((s) => (
              <Link to={`/boutique/${s.id}`} key={s.id} className="land-card" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="land-ic"><Store size={22} /></div>
                <h3>{s.name}</h3>
                <p>{s.products_count} {t("shops.products")}</p>
                <span className="pc-price">{t("shops.visit")} <ArrowRight size={14} /></span>
              </Link>
            ))}
            {shops.length === 0 && <p className="muted">{t("shops.none")}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
