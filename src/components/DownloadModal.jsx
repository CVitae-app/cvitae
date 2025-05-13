import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { downloadCV } from "../utils/downloadPDF";
import CVPreview from "./CVPreview";

const plans = [
  {
    id: "1month",
    labelKey: "plan1MonthLabel",
    descriptionKey: "plan1MonthDesc",
    priceId: "price_1RFc3fRpTB9d9YyvRz2fYeGM",
  },
  {
    id: "3months",
    labelKey: "plan3MonthsLabel",
    descriptionKey: "plan3MonthsDesc",
    priceId: "price_1RFcEJRpTB9d9YyvOYdhdKEn",
    popular: true,
  },
  {
    id: "6months",
    labelKey: "plan6MonthsLabel",
    descriptionKey: "plan6MonthsDesc",
    priceId: "price_1RFcEhRpTB9d9Yyvv0ydhDW4",
  },
  {
    id: "1year",
    labelKey: "plan1YearLabel",
    descriptionKey: "plan1YearDesc",
    priceId: "price_1RFcF3RpTB9d9Yvi2ILDgHI",
  },
];

function DownloadModal({ isOpen, onClose, onDownload, cvData, startAtSubscribe = false }) {
  const { t } = useTranslation();
  const { user, isHydrated, refreshSession } = useAuth();
  const modalRef = useRef();
  const previewRef = useRef();

  const [step, setStep] = useState("login");
  const [emailMode, setEmailMode] = useState("signup");
  const [email, setEmail] = useState(() => localStorage.getItem("lastEmail") || "");
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
    if (!user) {
      setStep("login");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", user.id)
        .maybeSingle();
        
      const isSubscribed = profile?.is_subscribed === true;
      setStep(isSubscribed ? "download" : "subscribe");
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
      setInlineError(t("errorFetchingProfile"));
      setStep("subscribe");
    }
  }, [user, t]);

  useEffect(() => {
    if (isOpen) {
      setEmail(localStorage.getItem("lastEmail") || "");
      setPassword("");
      setErrors({});
      setInlineError("");
      setSuccessMessage("");
      setLoading(false);
      setGoogleLoading(false);
      
      const url = new URL(window.location.href);
      if (url.searchParams.get("fromStripe") === "true") {
        refreshSession();
        setStepSmart();
        url.searchParams.delete("fromStripe");
        window.history.replaceState(null, "", url.pathname);
      } else if (startAtSubscribe) {
        setStep("subscribe");
      } else {
        setStepSmart();
      }
    }
  }, [isOpen, user, startAtSubscribe, setStepSmart, refreshSession]);

  useEffect(() => {
    const closeOnEscapeOrClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", closeOnEscapeOrClickOutside);
    document.addEventListener("keydown", closeOnEscapeOrClickOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnEscapeOrClickOutside);
      document.removeEventListener("keydown", closeOnEscapeOrClickOutside);
    };
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

    // ✅ Email Authentication (Signup/Login)
    const handleEmailAuth = useCallback(async () => {
      if (loading || !validate()) return;
      setLoading(true);
      setInlineError("");
      setSuccessMessage("");
  
      try {
        const isSignup = emailMode === "signup";
        localStorage.setItem("lastEmail", email);
        const language = navigator.language.startsWith("nl") ? "nl" : "en";
  
        const { error } = isSignup
          ? await supabase.auth.signUp({
              email,
              password,
              options: { data: { language } },
            })
          : await supabase.auth.signInWithPassword({ email, password });
  
        if (error) throw new Error(error.message);
        if (isSignup) setSuccessMessage(t("signupSuccess"));
  
        // Wait for session to initialize
        for (let i = 0; i < 10; i++) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session) {
            await setStepSmart();
            return;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
  
        setInlineError(t("loginFailed"));
      } catch (err) {
        setInlineError(err.message || t("loginError"));
      } finally {
        setLoading(false);
      }
    }, [email, password, emailMode, validate, setStepSmart, loading, t]);
  
    // ✅ Google OAuth Login
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
  
    // ✅ Password Reset Function
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
  
    // ✅ JSX: Login Form UI
    const renderLoginForm = () => (
      <div>
        <h3 className="text-xl font-semibold text-center mb-4">{t("login")}</h3>
        <form onSubmit={(e) => { e.preventDefault(); emailMode === "reset" ? handleResetPassword() : handleEmailAuth(); }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="w-full border px-3 py-2 rounded-md text-sm mb-3"
          />
          {emailMode !== "reset" && (
            <div className="relative mb-3">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full border px-3 py-2 rounded-md text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>
          )}
          {successMessage && <p className="text-xs text-green-600 text-center">{successMessage}</p>}
          {inlineError && <p className="text-xs text-red-500 text-center">{inlineError}</p>}
  
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-2 rounded-md hover:opacity-90 transition"
          >
            {loading ? t("loading") + "..." : emailMode === "reset" ? t("sendResetLink") : t(emailMode)}
          </button>
        </form>
  
        <div className="flex justify-between text-xs text-blue-600 mt-2 underline cursor-pointer">
          <span onClick={() => setEmailMode(emailMode === "signup" ? "login" : "signup")}>
            {emailMode === "signup" ? t("alreadyHaveAccount") : t("createAccount")}
          </span>
          <span onClick={() => setEmailMode("reset")}>{t("forgotPassword")}</span>
        </div>
  
        <div className="relative py-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative text-center text-xs text-gray-500 bg-white w-fit mx-auto px-2">
            {t("orContinueWith")}
          </div>
        </div>
  
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full border border-gray-300 py-2 rounded-md flex items-center justify-center gap-2 mt-3"
        >
          <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-4 h-4" />
          {googleLoading ? t("loading") + "..." : t("continueWithGoogle")}
        </button>
      </div>
    );

      // ✅ Subscription with Stripe (Secure Checkout)
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
    } catch (err) {
      console.error("❌ Error during Stripe subscription:", err);
      setInlineError(t("checkoutError"));
    } finally {
      setLoading(false);
    }
  }, [selectedPlanData, t]);

  // ✅ Download CV Function
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
    } catch (err) {
      console.error("❌ Error during CV download:", err);
      setInlineError(t("downloadError"));
    } finally {
      setLoading(false);
    }
  }, [cvData, onDownload, onClose, user]);

  // ✅ JSX: Subscription Step UI
  const renderSubscriptionStep = () => (
    <div>
      <h3 className="text-xl font-semibold text-center mb-4">{t("selectSubscriptionToProceed")}</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`relative border rounded-xl p-4 transition ${
              selectedPlan === plan.id ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="font-semibold text-gray-800">{t(plan.labelKey)}</div>
            <div className="text-xs text-gray-500 mt-1">{t(plan.descriptionKey)}</div>
            {plan.popular && (
              <div className="absolute top-2 right-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                {t("mostPopular")}
              </div>
            )}
          </button>
        ))}
      </div>
      <button
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mt-6"
      >
        {loading ? t("loading") + "..." : t("try3DaysFor", { price: "€1,95" })}
      </button>
      {inlineError && <p className="text-xs text-red-500 text-center mt-2">{inlineError}</p>}
    </div>
  );

  // ✅ JSX: Download Step UI
  const renderDownloadStep = () => (
    <div className="text-center space-y-4">
      <div className="text-4xl">✅</div>
      <h3 className="text-lg font-semibold text-gray-800">{t("readyToDownload")}</h3>
      <p className="text-sm text-gray-600">{t("clickToDownload")}</p>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full bg-black text-white py-2 rounded-md hover:opacity-90 transition"
      >
        {loading ? t("loading") + "..." : t("downloadNow")}
      </button>
      <p className="text-[11px] text-gray-400">{t("downloadHelpText")}</p>
    </div>
  );

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${!isOpen ? "hidden" : ""}`}
      ref={modalRef}
    >
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>
          <XMarkIcon className="w-6 h-6" />
        </button>

        {step === "login" && renderLoginForm()}
        {step === "subscribe" && renderSubscriptionStep()}
        {step === "download" && renderDownloadStep()}

        {/* Hidden CVPreview for PDF Generation */}
        <div style={{ position: "absolute", top: 0, left: "-9999px", width: "794px", height: "1123px" }}>
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
