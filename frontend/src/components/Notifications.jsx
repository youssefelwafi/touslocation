import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { registerHandlers } from "../notify";
import Modal from "./Modal";

let counter = 0;
const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export default function Notifications() {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null); // { message, resolve }

  useEffect(() => {
    registerHandlers({
      toast: (message, type) => {
        const id = ++counter;
        setToasts((list) => [...list, { id, message, type }]);
        setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 4200);
      },
      confirm: (message) => new Promise((resolve) => setConfirmState({ message, resolve })),
    });
  }, []);

  const dismiss = (id) => setToasts((list) => list.filter((x) => x.id !== id));
  function answer(value) {
    confirmState?.resolve(value);
    setConfirmState(null);
  }

  return (
    <>
      <div className="toast-stack">
        {toasts.map((tst) => {
          const Icon = ICONS[tst.type] || AlertCircle;
          return (
            <div key={tst.id} className={`toast toast-${tst.type}`} role="status">
              <Icon size={18} className="toast-icon" />
              <span>{tst.message}</span>
              <button className="toast-close" onClick={() => dismiss(tst.id)} aria-label="Fermer"><X size={14} /></button>
            </div>
          );
        })}
      </div>

      {confirmState && (
        <Modal title={t("common.confirm") || "Confirmation"} onClose={() => answer(false)}>
          <p className="confirm-msg">{confirmState.message}</p>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => answer(false)}>{t("common.cancel")}</button>
            <button className="btn-danger" onClick={() => answer(true)}>{t("common.delete")}</button>
          </div>
        </Modal>
      )}
    </>
  );
}
