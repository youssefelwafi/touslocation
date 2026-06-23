import { formatMoney } from "../utils/format";

// Palette cohérente avec l'UI (Apple-like).
const C = {
  blue: "#0071e3", green: "#34c759", red: "#ff3b30", orange: "#ff9500",
  purple: "#af52de", gray: "#c7c7cc", teal: "#30b0c7", indigo: "#5856d6",
};
const PIE_COLORS = [C.blue, C.green, C.orange, C.purple, C.red, C.teal, C.indigo];

const shortMonth = (ym) => {
  const m = Number((ym || "").slice(5, 7));
  const names = ["", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"];
  return names[m] || ym;
};

// Histogramme groupé (séries multiples par mois).
export function GroupedBarChart({ data, series, height = 220, money = true }) {
  const W = Math.max(data.length * (series.length * 16 + 26), 320);
  const H = height;
  const pad = { top: 16, right: 12, bottom: 28, left: 12 };
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.flatMap((d) => series.map((s) => Math.abs(Number(d[s.key]) || 0))));
  const groupW = (W - pad.left - pad.right) / data.length;
  const barW = Math.min(18, (groupW - 10) / series.length);

  return (
    <div className="chart-scroll">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="chart-svg" role="img">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line key={g} x1={pad.left} x2={W - pad.right} y1={pad.top + innerH * (1 - g)} y2={pad.top + innerH * (1 - g)} className="chart-grid" />
        ))}
        {data.map((d, i) => {
          const gx = pad.left + groupW * i + (groupW - barW * series.length) / 2;
          return (
            <g key={i}>
              {series.map((s, j) => {
                const val = Number(d[s.key]) || 0;
                const h = (Math.abs(val) / max) * innerH;
                const x = gx + j * barW;
                const y = pad.top + innerH - h;
                const fill = val < 0 ? C.red : s.color;
                return (
                  <rect key={s.key} x={x} y={y} width={barW - 2} height={Math.max(h, val ? 1 : 0)} rx="2" fill={fill}>
                    <title>{`${shortMonth(d.month)} · ${s.label}: ${money ? formatMoney(val) : val}`}</title>
                  </rect>
                );
              })}
              <text x={pad.left + groupW * i + groupW / 2} y={H - 9} textAnchor="middle" className="chart-axis">{shortMonth(d.month)}</text>
            </g>
          );
        })}
      </svg>
      <div className="chart-legend">
        {series.map((s) => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}
      </div>
    </div>
  );
}

// Courbe (tendance) — une seule série.
export function LineChart({ data, valueKey, color = C.blue, height = 200, money = true }) {
  const W = 560, H = height;
  const pad = { top: 16, right: 14, bottom: 28, left: 14 };
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));
  const n = data.length;
  const xAt = (i) => pad.left + (n <= 1 ? innerW / 2 : (innerW * i) / (n - 1));
  const yAt = (v) => pad.top + innerH - (Math.max(0, v) / max) * innerH;
  const pts = data.map((d, i) => [xAt(i), yAt(Number(d[valueKey]) || 0)]);
  const path = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${pts[pts.length - 1]?.[0] ?? pad.left},${pad.top + innerH} L${pts[0]?.[0] ?? pad.left},${pad.top + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} className="chart-svg" role="img" preserveAspectRatio="none">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line key={g} x1={pad.left} x2={W - pad.right} y1={pad.top + innerH * (1 - g)} y2={pad.top + innerH * (1 - g)} className="chart-grid" />
      ))}
      {n > 0 && <path d={area} fill={color} opacity="0.12" />}
      {n > 0 && <path d={path} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3.5" fill="#fff" stroke={color} strokeWidth="2">
            <title>{`${shortMonth(data[i].month)}: ${money ? formatMoney(data[i][valueKey]) : data[i][valueKey]}`}</title>
          </circle>
          <text x={p[0]} y={H - 9} textAnchor="middle" className="chart-axis">{shortMonth(data[i].month)}</text>
        </g>
      ))}
    </svg>
  );
}

// Donut / camembert.
export function DonutChart({ data, size = 180, money = false, centerLabel }) {
  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const r = size / 2, ir = r * 0.62, cx = r, cy = r;
  let acc = 0;
  const arcs = total > 0 ? data.map((d, i) => {
    const frac = (Number(d.value) || 0) / total;
    const a0 = acc * 2 * Math.PI - Math.PI / 2;
    acc += frac;
    const a1 = acc * 2 * Math.PI - Math.PI / 2;
    const large = frac > 0.5 ? 1 : 0;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const xi0 = cx + ir * Math.cos(a1), yi0 = cy + ir * Math.sin(a1);
    const xi1 = cx + ir * Math.cos(a0), yi1 = cy + ir * Math.sin(a0);
    const path = `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} L${xi0},${yi0} A${ir},${ir} 0 ${large} 0 ${xi1},${yi1} Z`;
    return { path, color: d.color || PIE_COLORS[i % PIE_COLORS.length], label: d.label, value: d.value, frac };
  }) : [];

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="chart-svg" role="img">
        {total === 0 && <circle cx={cx} cy={cy} r={(r + ir) / 2} fill="none" stroke={C.gray} strokeWidth={r - ir} opacity="0.4" />}
        {arcs.map((a, i) => (
          <path key={i} d={a.path} fill={a.color}>
            <title>{`${a.label}: ${money ? formatMoney(a.value) : a.value} (${Math.round(a.frac * 100)}%)`}</title>
          </path>
        ))}
        {centerLabel && <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="donut-center">{centerLabel}</text>}
      </svg>
      <div className="chart-legend col">
        {data.map((d, i) => (
          <span key={i}>
            <i style={{ background: d.color || PIE_COLORS[i % PIE_COLORS.length] }} />
            {d.label} · <strong>{money ? formatMoney(d.value) : d.value}</strong>
          </span>
        ))}
        {total === 0 && <span className="muted">—</span>}
      </div>
    </div>
  );
}

// Barres horizontales (classement).
export function HBarChart({ data, money = false, color = C.blue }) {
  const max = Math.max(1, ...data.map((d) => Number(d.value) || 0));
  return (
    <div className="hbar">
      {data.map((d, i) => (
        <div className="hbar-row" key={i}>
          <span className="hbar-label" title={d.label}>{d.label}</span>
          <div className="hbar-track">
            <div className="hbar-fill" style={{ width: `${((Number(d.value) || 0) / max) * 100}%`, background: d.color || color }} />
          </div>
          <span className="hbar-val">{money ? formatMoney(d.value) : d.value}</span>
        </div>
      ))}
      {data.length === 0 && <p className="muted">—</p>}
    </div>
  );
}

export { C as chartColors };
