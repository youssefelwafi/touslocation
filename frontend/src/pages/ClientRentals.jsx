import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api, { downloadInvoice } from "../api";
import { FileDown } from "lucide-react";
import Loader from "../components/Loader";
import { formatDate, formatMoney } from "../utils/format";

export default function ClientRentals() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/locations").then((r) => setRows(r.data.data || r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="page-head"><h2>{t("store.my_rentals")}</h2></div>
      <table className="table">
        <thead>
          <tr>
            <th>#</th><th>{t("rentals.start")}</th><th>{t("rentals.end")}</th>
            <th>{t("rentals.ttc")}</th><th>{t("rentals.payment")}</th><th>{t("common.status")}</th><th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.id}</td>
              <td>{formatDate(r.date_debut)}</td>
              <td>{formatDate(r.date_fin)}</td>
              <td>{formatMoney(r.montant_total)}</td>
              <td><span className={`badge badge-pay-${r.statut_paiement}`}>{t(`status.${r.statut_paiement}`)}</span></td>
              <td><span className={`badge badge-${r.statut}`}>{t(`status.${r.statut}`)}</span></td>
              <td className="actions-col">
                <button className="icon-btn" title={t("rentals.invoice")} onClick={() => downloadInvoice(r.id)}><FileDown size={16} /></button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan="7" className="empty">{t("rentals.none")}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
