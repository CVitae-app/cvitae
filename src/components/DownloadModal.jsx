import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { downloadCV } from "../utils/downloadPDF";
import CVPreview from "./CVPreview";

const plans = [
  { id: "1month", labelKey: "plan1MonthLabel", descriptionKey: "plan1MonthDesc", priceId: "price_1RQ3CARwXOeOt11YY4gEeYsj" },
  { id: "3months", labelKey: "plan3MonthsLabel", descriptionKey: "plan3MonthsDesc", priceId: "price_1RQ3CsRwXOeOt11YQh5Ld2Ls", popular: true },
  { id: "6months", labelKey: "plan6MonthsLabel", descriptionKey: "plan6MonthsDesc", priceId: "price_1RQ3DHRwXOeOt11YhER7lxsd" },
  { id: "1year", labelKey: "plan1YearLabel", descriptionKey: "plan1YearDesc", priceId: "price_1RQ3DaRwXOeOt11YdHNWKCc5" },
];

function DownloadModal({ isOpen, onClose, onDownload, cvData, startAtSubscribe = false }) {
  const { t } = useTranslation();
  const { user, isHydrated, refreshSession } = useAuth();
  const modalRef = useRef();
  const previewRef = useRef();
  const [step, setStep] = useState("login");
  const [emailMode, setEmailMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("1month");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [inlineError, setInlineError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedPlanData = useMemo(() => plans.find((p) => p.id === selectedPlan), [selectedPlan]);

  const setStepSmart = useCallback(async () => {
    if (!isHydrated) return;
    if (!user) {
      setStep("login");
      return;
    }

    try {
      const { data: profile } = await supabase.from("profiles").select("is_subscribed").eq("id", user.id).maybeSingle();
      const isSubscribed = profile?.is_subscribed === true;
      setStep(isSubscribed ? "download" : "subscribe");
    } catch {
      setInlineError(t("errorFetchingProfile"));
      setStep("subscribe");
    }
  }, [user, t, isHydrated]);

  useEffect(() => {
    if (isOpen) {
      setEmail("");
      setPassword("");
      setErrors({});
      setInlineError("");
      setSuccessMessage("");
      setLoading(false);
      setGoogleLoading(false);
      
      if (new URL(window.location.href).searchParams.get("fromStripe") === "true") {
        refreshSession().then(() => setTimeout(() => setStepSmart(), 500));
        window.history.replaceState(null, "", window.location.pathname);
      } else if (startAtSubscribe) {
        setStep("subscribe");
      } else {
        setStepSmart();
      }
    }
  }, [isOpen, user, startAtSubscribe, setStepSmart, refreshSession]);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

const validate = useCallback(() => {
  const newErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t("invalidEmail");
  if (emailMode !== "reset" && password.length < 8) {
    newErrors.password = t("passwordCriteria");
  }
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}, [email, password, emailMode, t]);

const handleEmailAuth = useCallback(async () => {
  if (loading || !validate()) return;
  setLoading(true);
  setInlineError("");
  setSuccessMessage("");

  try {
    const isSignup = emailMode === "signup";
    const language = navigator.language.startsWith("nl") ? "nl" : "en";
    const { error } = isSignup
      ? await supabase.auth.signUp({ email, password, options: { data: { language } } })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) throw new Error(error.message);
    if (isSignup) setSuccessMessage(t("signupSuccess"));
    await refreshSession();
    await setStepSmart();
  } catch (err) {
    setInlineError(err.message || t("loginError"));
  } finally {
    setLoading(false);
  }
}, [email, password, emailMode, validate, setStepSmart, loading, t, refreshSession]);

const handleGoogleLogin = useCallback(async () => {
  setGoogleLoading(true);
  setInlineError("");
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    setInlineError(err.message || t("loginError"));
  } finally {
    setGoogleLoading(false);
  }
}, [t]);

const handleResetPassword = useCallback(async () => {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErrors({ email: t("invalidEmail") });
    return;
  }

  setLoading(true);
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(error.message);
    setSuccessMessage(t("resetEmailSent"));
  } catch (err) {
    setInlineError(err.message || t("resetError"));
  } finally {
    setLoading(false);
  }
}, [email, t]);

const handleSubscribe = useCallback(async () => {
  setLoading(true);
  setInlineError("");

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) {
      setInlineError(t("notLoggedIn"));
      setLoading(false);
      return;
    }

    const response = await fetch(
      "https://aftjpjxbcmzswhxitozl.supabase.co/functions/v1/create-checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          price_id: selectedPlanData.priceId,
          success_url: `${window.location.origin}/?fromStripe=true`,
          cancel_url: `${window.location.origin}/`,
        }),
      }
    );

    const data = await response.json();
    if (data?.url) {
      window.location.href = data.url;
    } else {
      setInlineError(t("checkoutError"));
    }
  } catch {
    setInlineError(t("checkoutError"));
  } finally {
    setLoading(false);
  }
}, [selectedPlanData, t]);

const handleDownload = useCallback(async () => {
  setLoading(true);
  try {
    const personal = cvData?.data?.personal || {};
    await downloadCV(previewRef.current, personal);

    window.dataLayer?.push({
      event: "cv_download",
      user_id: user?.id || "anonymous",
      cv_id: cvData?.id,
    });

    onDownload?.();
    onClose?.();
  } catch {
    setInlineError(t("downloadError"));
  } finally {
    setLoading(false);
  }
}, [cvData, onDownload, onClose, user, t]);

return (
  <div 
    className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
    }`}
    ref={modalRef}
  >
    <div className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4 p-6 relative">
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        onClick={onClose}
      >
        <XMarkIcon className="w-6 h-6" />
      </button>

      {step === "login" && (
        <div>
          <h3 className="text-2xl font-semibold text-center mb-4">{t("login")}</h3>
          <form onSubmit={(e) => {
            e.preventDefault();
            emailMode === "reset" ? handleResetPassword() : handleEmailAuth();
          }} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full border px-3 py-2 rounded-md text-sm"
            />
            {emailMode !== "reset" && (
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="w-full border px-3 py-2 rounded-md text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-2 text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            )}
            {inlineError && <p className="text-xs text-red-500 text-center">{inlineError}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
            >
              {loading ? t("loading") + "..." : t(emailMode)}
            </button>
          </form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative text-center text-sm text-gray-500 bg-white px-2">
              {t("orContinueWith")}
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full border border-gray-300 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-50 transition"
          >
            <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-4 h-4" />
            {googleLoading ? t("loading") + "..." : t("continueWithGoogle")}
          </button>

          <div className="flex justify-between text-xs mt-2 text-blue-600 cursor-pointer">
            <span onClick={() => setEmailMode(emailMode === "signup" ? "login" : "signup")}>
              {emailMode === "signup" ? t("alreadyHaveAccount") : t("createAccount")}
            </span>
            <span onClick={() => setEmailMode("reset")}>{t("forgotPassword")}</span>
          </div>
        </div>
      )}

      {step === "subscribe" && (
        <div>
          <h3 className="text-2xl font-semibold text-center mb-4">{t("selectSubscriptionToProceed")}</h3>
          <div className="grid gap-4">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`border rounded-lg p-4 transition ${
                  selectedPlan === plan.id ? "border-blue-600 bg-blue-50" : "border-gray-200"
                }`}
              >
                <div className="font-semibold">{t(plan.labelKey)}</div>
                <div className="text-xs text-gray-500 mt-1">{t(plan.descriptionKey)}</div>
              </button>
            ))}
          </div>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mt-4"
          >
            {loading ? t("loading") + "..." : t("try3DaysFor", { price: "€1,95" })}
          </button>
        </div>
      )}

      {step === "download" && (
        <div className="text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h3 className="text-xl font-semibold text-gray-800">{t("readyToDownload")}</h3>
          <p className="text-sm text-gray-600">{t("clickToDownload")}</p>
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md hover:opacity-90 transition"
          >
            {loading ? t("loading") + "..." : t("downloadNow")}
          </button>
        </div>
      )}

      {/* Hidden CVPreview for PDF Generation */}
      <div className="hidden">
        <div ref={previewRef}>
          <CVPreview 
            data={cvData?.data || {}} 
            dynamicSteps={cvData?.dynamic_steps || []} 
            settings={cvData?.settings || {}} 
            currentCVId={cvData?.id} 
          />
        </div>
      </div>
    </div>
  </div>
);
}

export default DownloadModal;