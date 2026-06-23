import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import Loader from "../components/Loader";
import { useAuth, isStaff as checkStaff } from "../auth";
import RentalForm from "../components/RentalForm";
import RentalKanban from "../components/RentalKanban";
import { formatMoney } from "../utils/format";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isStaff = checkStaff(user);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  function loadStats() {
    api.get("/tableau-de-bord/stats")
      .then((res) => setStats(res.data))
      .catch(() => setError(t("common.error")));
  }

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line
  }, []);

  if (error) return <div className="alert">{error}</div>;
  if (!stats) return <Loader />;

  const cards = [
    { label: t("dashboard.revenue"), value: formatMoney(stats.total_revenue), color: "#16a34a" },
    { label: t("dashboard.active_rentals"), value: stats.active_rentals, color: "#2563eb" },
    { label: t("dashboard.total_equipment"), value: stats.total_equipments, color: "#7c3aed" },
    { label: t("dashboard.available_equipment"), value: stats.available_equipments, color: "#ea580c" },
  ];

  return (
    <div>
      <div className="page-head">
        <h2>{t("dashboard.title")}</h2>
        {isStaff && (
          <button className="btn-primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} /> {t("rentals.new")}
          </button>
        )}
      </div>
      <div className="cards">
        {cards.map((c) => (
          <div className="card" key={c.label} style={{ borderTopColor: c.color }}>
            <span className="card-value">{c.value}</span>
            <span className="card-label">{c.label}</span>
          </div>
        ))}
      </div>

      <div className="board-head">
        <h3>{t("dashboard.board")}</h3>
        <small className="muted">{t("kanban.hint")}</small>
      </div>
      <RentalKanban />

      {createOpen && (
        <RentalForm onClose={() => setCreateOpen(false)} onCreated={() => loadStats()} />
      )}
    </div>
  );
}
