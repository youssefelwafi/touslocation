import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import api from "../api";
import { toast } from "../notify";
import { formatDate, formatMoney } from "../utils/format";

const COLUMNS = ["pending", "ongoing", "returned", "cancelled"];

// Transitions autorisées : colonne cible -> endpoint, selon le statut courant.
function transitionFor(target, status) {
  if (status === target) return null;
  if (target === "ongoing" && status === "pending") return "confirmer";
  if (target === "returned" && ["pending", "confirmed", "ongoing"].includes(status)) return "retour";
  if (target === "cancelled" && !["returned", "cancelled"].includes(status)) return "annuler";
  return false; // transition invalide
}

export default function RentalKanban() {
  const { t } = useTranslation();
  const [rentals, setRentals] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [overCol, setOverCol] = useState(null);

  function load() {
    api.get("/locations").then((r) => setRentals(r.data.data || r.data));
  }
  useEffect(() => { load(); }, []);

  async function onDrop(target) {
    setOverCol(null);
    const card = rentals.find((r) => r.id === dragId);
    setDragId(null);
    if (!card) return;
    const action = transitionFor(target, card.statut);
    if (action === null) return;            // même colonne
    if (action === false) { toast(t("kanban.invalid"), "info"); return; }

    // mise à jour optimiste
    setRentals((list) => list.map((r) => (r.id === card.id ? { ...r, statut: target } : r)));
    try {
      await api.put(`/locations/${card.id}/${action}`);
      load();
    } catch (err) {
      toast(err.response?.data?.message || t("common.error"));
      load();
    }
  }

  return (
    <div className="kanban">
      {COLUMNS.map((col) => {
        const cards = rentals.filter((r) => r.statut === col);
        return (
          <div
            key={col}
            className={`kanban-col${overCol === col ? " over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOverCol(col); }}
            onDragLeave={() => setOverCol((c) => (c === col ? null : c))}
            onDrop={() => onDrop(col)}
          >
            <div className="kanban-head">
              <span className={`badge badge-${col}`}>{t(`status.${col}`)}</span>
              <span className="kanban-count">{cards.length}</span>
            </div>
            <div className="kanban-cards">
              {cards.map((r) => (
                <div
                  key={r.id}
                  className="kanban-card"
                  draggable
                  onDragStart={() => setDragId(r.id)}
                  onDragEnd={() => { setDragId(null); setOverCol(null); }}
                >
                  <div className="kc-top">
                    <strong>#{r.id} · {r.utilisateur?.nom || "-"}</strong>
                    <span className={`badge badge-pay-${r.statut_paiement}`}>{t(`status.${r.statut_paiement}`)}</span>
                  </div>
                  <div className="kc-dates">{formatDate(r.date_debut)} → {formatDate(r.date_fin)}</div>
                  <div className="kc-amount">{formatMoney(r.montant_total)}</div>
                </div>
              ))}
              {cards.length === 0 && <div className="kanban-empty">—</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
