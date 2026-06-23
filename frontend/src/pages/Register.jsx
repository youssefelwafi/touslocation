import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth";

export default function Register() {
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({ nom: "", email: "", password: "", password_confirmation: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(""); setErrors({}); setLoading(true);
    try {
      await register(form);
      navigate("/tableau-de-bord");
    } catch (err) {
      if (err.response?.status === 422) setErrors(err.response.data.errors || {});
      else setError(err.response?.data?.message || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <Link to="/"><img src="/logo.png" alt="TousLocation" className="brand-logo" /></Link>
        <p className="subtitle">{t("register.subtitle")}</p>
        {error && <div className="alert">{error}</div>}

        <label>{t("register.name")}</label>
        <input value={form.nom} onChange={set("nom")} required />
        {errors.nom && <small className="err">{errors.nom[0]}</small>}

        <label>{t("register.email")}</label>
        <input type="email" value={form.email} onChange={set("email")} required />
        {errors.email && <small className="err">{errors.email[0]}</small>}

        <label>{t("register.password")}</label>
        <input type="password" value={form.password} onChange={set("password")} required minLength={8} />
        {errors.password && <small className="err">{errors.password[0]}</small>}

        <label>{t("register.password_confirm")}</label>
        <input type="password" value={form.password_confirmation} onChange={set("password_confirmation")} required />

        <button disabled={loading} type="submit">
          {loading ? t("register.submitting") : t("register.submit")}
        </button>

        <small className="hint">
          {t("register.have_account")} <Link to="/connexion">{t("register.login_link")}</Link>
        </small>
      </form>
    </div>
  );
}
