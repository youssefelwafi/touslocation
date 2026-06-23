import { useEffect, useState } from "react";
import { TrendingUp, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import Loader from "../components/Loader";
import { formatMoney } from "../utils/format";
import { GroupedBarChart, LineChart, DonutChart, HBarChart, chartColors as C } from "../components/Charts";

const firstOfYear = () => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

export default function Reports() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("profit");
  const [from, setFrom] = useState(firstOfYear());
  const [to, setTo] = useState(today());
  const [profit, setProfit] = useState(null);
  const [rentals, setRentals] = useState(null);
  const [loading, setLoading] = useState(false);

  function loadData() {
    setLoading(true);
    const params = { from, to };
    Promise.all([
      api.get("/rapports/benefice", { params }),
      api.get("/rapports/locations", { params }),
    ]).then(([p, r]) => { setProfit(p.data); setRentals(r.data); }).finally(() => setLoading(false));
  }
  useEffect(() => { loadData(); /* eslint-disable-next-line */ }, []);

  const statusColor = { pending: C.orange, confirmed: C.blue, active: C.teal, returned: C.green, cancelled: C.gray };

  return (
    <div>
      <h2 className="settings-title">{t("reports.title")}</h2>

      <div className="tabs">
        <button className={`tab${tab === "profit" ? " active" : ""}`} onClick={() => setTab("profit")}><TrendingUp size={15} /> {t("reports.profit_tab")}</button>
        <button className={`tab${tab === "rentals" ? " active" : ""}`} onClick={() => setTab("rentals")}><FileText size={15} /> {t("reports.rentals_tab")}</button>
      </div>

      <div className="toolbar">
        <label className="date-field">{t("reports.from")} <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="date-field">{t("reports.to")} <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
        <button className="btn-primary" onClick={loadData}>{t("reports.apply")}</button>
      </div>

      {loading || !profit || !rentals ? <Loader /> : tab === "profit" ? (
        <>
          <div className="cards">
            <div className="card"><span className="card-value" style={{ color: C.green }}>{formatMoney(profit.revenue)}</span><span className="card-label">{t("reports.revenue")}</span></div>
            <div className="card"><span className="card-value" style={{ color: C.red }}>{formatMoney(profit.cost)}</span><span className="card-label">{t("reports.cost")}</span></div>
            <div className="card"><span className="card-value" style={{ color: profit.profit >= 0 ? C.blue : C.red }}>{formatMoney(profit.profit)}</span><span className="card-label">{t("reports.profit")} · {profit.margin}%</span></div>
          </div>

          <div className="chart-grid-2">
            <div className="panel">
              <h3>{t("reports.monthly_pl")}</h3>
              <GroupedBarChart
                data={profit.monthly}
                series={[
                  { key: "revenue", label: t("reports.revenue"), color: C.green },
                  { key: "cost", label: t("reports.cost"), color: C.red },
                ]}
              />
            </div>
            <div className="panel">
              <h3>{t("reports.revenue_breakdown")}</h3>
              <DonutChart
                money
                centerLabel={formatMoney(profit.revenue)}
                data={[
                  { label: t("reports.rentals_revenue"), value: profit.rentals_revenue, color: C.blue },
                  { label: t("reports.sales_revenue"), value: profit.sales_revenue, color: C.purple },
                ]}
              />
            </div>
          </div>

          <div className="chart-grid-2">
            <div className="panel">
              <h3>{t("reports.profit_trend")}</h3>
              <LineChart data={profit.monthly} valueKey="profit" color={C.blue} />
            </div>
            <div className="panel">
              <h3>{t("reports.cost_breakdown")}</h3>
              <DonutChart
                money
                centerLabel={formatMoney(profit.cost)}
                data={[
                  { label: t("reports.purchases_cost"), value: profit.purchases_cost, color: C.orange },
                  { label: t("reports.expenses_total"), value: profit.expenses_total, color: C.red },
                ]}
              />
            </div>
          </div>

          <table className="table" style={{ maxWidth: 520 }}>
            <tbody>
              <tr><td>{t("reports.rentals_revenue")}</td><td className="num">{formatMoney(profit.rentals_revenue)}</td></tr>
              <tr><td>{t("reports.sales_revenue")}</td><td className="num">{formatMoney(profit.sales_revenue)}</td></tr>
              <tr><td><strong>{t("reports.revenue")}</strong></td><td className="num"><strong>{formatMoney(profit.revenue)}</strong></td></tr>
              <tr><td>{t("reports.purchases_cost")}</td><td className="num">− {formatMoney(profit.purchases_cost)}</td></tr>
              <tr><td>{t("reports.expenses_total")}</td><td className="num">− {formatMoney(profit.expenses_total)}</td></tr>
              <tr><td><strong>{t("reports.profit")}</strong></td><td className="num"><strong>{formatMoney(profit.profit)}</strong></td></tr>
            </tbody>
          </table>
        </>
      ) : (
        <>
          <div className="cards">
            <div className="card"><span className="card-value">{rentals.count}</span><span className="card-label">{t("reports.count")}</span></div>
            <div className="card"><span className="card-value">{formatMoney(rentals.total_ttc)}</span><span className="card-label">{t("reports.total_ttc")}</span></div>
            <div className="card"><span className="card-value" style={{ color: C.green }}>{formatMoney(rentals.paid)}</span><span className="card-label">{t("reports.paid")}</span></div>
            <div className="card"><span className="card-value" style={{ color: C.red }}>{formatMoney(rentals.outstanding)}</span><span className="card-label">{t("reports.outstanding")}</span></div>
          </div>

          <div className="chart-grid-2">
            <div className="panel">
              <h3>{t("reports.rentals_trend")}</h3>
              <LineChart data={rentals.monthly} valueKey="total" color={C.blue} />
            </div>
            <div className="panel">
              <h3>{t("reports.payment_split")}</h3>
              <DonutChart
                money
                centerLabel={formatMoney(rentals.total_ttc)}
                data={[
                  { label: t("reports.paid"), value: rentals.paid, color: C.green },
                  { label: t("reports.outstanding"), value: rentals.outstanding, color: C.red },
                ]}
              />
            </div>
          </div>

          <div className="chart-grid-2">
            <div className="panel">
              <h3>{t("reports.by_status")}</h3>
              <DonutChart
                centerLabel={rentals.count}
                data={rentals.by_status.map((s) => ({ label: t(`status.${s.status}`), value: s.count, color: statusColor[s.status] || C.gray }))}
              />
            </div>
            <div className="panel">
              <h3>{t("reports.top_equipments")}</h3>
              <HBarChart data={rentals.top_equipments.map((e) => ({ label: e.name, value: e.qty }))} color={C.indigo} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
