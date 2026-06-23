import { useState } from "react";
import { Percent, Coins, Ruler, Tag, Bookmark, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import Taxes from "./Taxes";
import Currencies from "./Currencies";
import Units from "./Units";
import Categories from "./Categories";
import Brands from "./Brands";
import PaymentTypes from "./PaymentTypes";

export default function Settings() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("taxes");

  const tabs = [
    { key: "taxes", label: t("settings.taxes"), icon: Percent, comp: <Taxes /> },
    { key: "currencies", label: t("settings.currencies"), icon: Coins, comp: <Currencies /> },
    { key: "units", label: t("settings.units"), icon: Ruler, comp: <Units /> },
    { key: "categories", label: t("settings.categories"), icon: Tag, comp: <Categories /> },
    { key: "brands", label: t("settings.brands"), icon: Bookmark, comp: <Brands /> },
    { key: "payment_types", label: t("settings.payment_types"), icon: CreditCard, comp: <PaymentTypes /> },
  ];

  const active = tabs.find((x) => x.key === tab);

  return (
    <div>
      <h2 className="settings-title">{t("settings.title")}</h2>
      <div className="tabs">
        {tabs.map((x) => {
          const Icon = x.icon;
          return (
            <button key={x.key} className={`tab${tab === x.key ? " active" : ""}`} onClick={() => setTab(x.key)}>
              <Icon size={15} /> {x.label}
            </button>
          );
        })}
      </div>
      <div className="tab-panel">{active.comp}</div>
    </div>
  );
}
