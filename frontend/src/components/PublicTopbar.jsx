import { Link } from "react-router-dom";
import { Languages, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { applyDir } from "../i18n";

export default function PublicTopbar() {
  const { t, i18n } = useTranslation();
  const to = i18n.language === "ar" ? "fr" : "ar";
  return (
    <header className="land-header">
      <Link to="/"><img src="/logo.png" alt="TousLocation" className="land-logo" /></Link>
      <div className="land-nav">
        <Link to="/boutiques" className="land-lang" style={{ textDecoration: "none" }}><Store size={15} /> {t("nav2.shops")}</Link>
        <button className="land-lang" onClick={() => { i18n.changeLanguage(to); localStorage.setItem("lang", to); applyDir(to); }}>
          <Languages size={15} /> {to === "ar" ? "العربية" : "Français"}
        </button>
        <Link to="/connexion" className="btn-ghost">{t("login.signin")}</Link>
      </div>
    </header>
  );
}
