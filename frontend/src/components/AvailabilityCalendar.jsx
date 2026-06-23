import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../api";
import Modal from "./Modal";

// Renvoie "YYYY-MM" pour un objet {year, month0}.
function ym(year, month0) {
  return `${year}-${String(month0 + 1).padStart(2, "0")}`;
}

export default function AvailabilityCalendar({ equipment, onClose }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "ar" ? "ar-MA" : "fr-MA";

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month0, setMonth0] = useState(today.getMonth());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/materiels/${equipment.id}/disponibilite`, { params: { month: ym(year, month0) } })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [equipment.id, year, month0]);

  function shift(delta) {
    let m = month0 + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth0(m);
    setYear(y);
  }

  // En-têtes des jours de la semaine (localisés, semaine commençant lundi).
  const weekdays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2024-01-01 est un lundi.
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" })
    .format(new Date(year, month0, 1));

  // Construit la grille (cellules vides avant le 1er, lundi=0).
  const cells = useMemo(() => {
    if (!data) return [];
    const byDate = Object.fromEntries(data.days.map((d) => [d.date, d]));
    const first = new Date(year, month0, 1);
    const lead = (first.getDay() + 6) % 7; // décale pour lundi
    const daysInMonth = new Date(year, month0 + 1, 0).getDate();
    const out = Array.from({ length: lead }, () => null);
    for (let day = 1; day <= daysInMonth; day++) {
      out.push(byDate[ym(year, month0) + "-" + String(day).padStart(2, "0")] || { day });
    }
    return out;
  }, [data, year, month0]);

  function cellClass(c) {
    if (!c || c.available === undefined) return "cal-cell empty-cell";
    if (c.blocked) return "cal-cell full";
    if (c.buffer) return "cal-cell buffer";
    return "cal-cell avail";
  }

  return (
    <Modal title={`${t("calendar.title")} — ${equipment.nom}`} onClose={onClose}>
      <div className="cal-meta">
        <span>{t("calendar.capacity")}: <strong>{equipment.quantite}</strong></span>
        {equipment.jours_tampon > 0 && (
          <span title={equipment.note_tampon || ""}>
            {t("calendar.buffer_after", { days: equipment.jours_tampon })}
            {equipment.note_tampon ? ` — ${equipment.note_tampon}` : ""}
          </span>
        )}
      </div>

      <div className="cal-nav">
        <button className="icon-btn" onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
        <strong className="cal-title">{monthLabel}</strong>
        <button className="icon-btn" onClick={() => shift(1)}><ChevronRight size={18} /></button>
      </div>

      {loading ? <p>{t("common.loading")}</p> : (
        <>
          <div className="cal-grid cal-head">
            {weekdays.map((w, i) => <div key={i} className="cal-wd">{w}</div>)}
          </div>
          <div className="cal-grid">
            {cells.map((c, i) => (
              <div key={i} className={cellClass(c)} title={c && c.available !== undefined ? `${t("calendar.available")}: ${c.available}/${equipment.quantite}` : ""}>
                {c && (c.day || (c.date && Number(c.date.slice(-2)))) ? (
                  <>
                    <span className="cal-day">{c.day || Number(c.date.slice(-2))}</span>
                    {c.available !== undefined && <span className="cal-av">{c.available}</span>}
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <div className="cal-legend">
            <span><i className="dot avail" /> {t("calendar.legend_avail")}</span>
            <span><i className="dot buffer" /> {t("calendar.legend_buffer")}</span>
            <span><i className="dot full" /> {t("calendar.legend_full")}</span>
          </div>
        </>
      )}
    </Modal>
  );
}
