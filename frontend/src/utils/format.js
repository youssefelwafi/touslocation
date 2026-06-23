// Formatage adapté au Maroc : dates JJ/MM/AAAA, heures 24h, devise DH par défaut.

// Accepte "2026-06-10" ou un ISO datetime ; renvoie "10/06/2026".
export function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

// "10/06/2026 14:30"
export function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d)) return value;
  return new Intl.DateTimeFormat("fr-MA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

// "2 500,00 DH"
export function formatMoney(amount, symbol = "DH") {
  const n = Number(amount ?? 0);
  const formatted = new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  return `${formatted} ${symbol}`;
}
