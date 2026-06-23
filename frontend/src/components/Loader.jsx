import { useTranslation } from "react-i18next";

// Indicateur de chargement animé (spinner).
export default function Loader({ label }) {
  const { t } = useTranslation();
  return (
    <div className="loader">
      <span className="spinner" aria-hidden="true" />
      <span className="loader-label">{label ?? t("common.loading")}</span>
    </div>
  );
}
