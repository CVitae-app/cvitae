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
    checkoutUrl: "https://buy.stripe.com/test_fZe2blcAx5BNa8UfYY",
  },
  {
    id: "3months",
    labelKey: "plan3MonthsLabel",
    descriptionKey: "plan3MonthsDesc",
    checkoutUrl: "https://buy.stripe.com/test_5kA7vFfMJ4xJepa4gh",
    popular: true,
  },
  {
    id: "6months",
    labelKey: "plan6MonthsLabel",
    descriptionKey: "plan6MonthsDesc",
    checkoutUrl: "https://buy.stripe.com/test_14k6rB2ZXggr94Q3ce",
  },
  {
    id: "1year",
    labelKey: "plan1YearLabel",
    descriptionKey: "plan1YearDesc",
    checkoutUrl: "https://buy.stripe.com/test_fZe7vF0RP6FR5SEcMP",
  },
];

function DownloadModal({
  isOpen,
  onClose,
  onDownload,
  cvData,
  fromProfileMenu = false,
  startAtSubscribe = false,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const modalRef = useRef();
  const previewRef = useRef();

  const [step, setStep] = useState("login");
  const [emailMode, setEmailMode] = useState("signup");
  const [email, setEmail] = useState(() => localStorage.getItem("lastEmail") || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("1month");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [inlineError, setInlineError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  const selectedPlanData = useMemo(() => plans.find((p) => p.id === selectedPlan), [selectedPlan]);

  const setStepSmart = useCallback(async () => {
    console.log("🧠 Checking smart step based on Supabase session...");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      console.log("🔍 Session user:", currentUser);

      if (!currentUser) return setStep("login");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", currentUser.id)
        .maybeSingle();

      console.log("📋 Profile lookup:", profile, profileError);

      const subscribed = profile?.is_subscribed === true;
      if (subscribed) {
        console.log("✅ User is subscribed");
        localStorage.removeItem("modalStep");
        setStep("download");
      } else {
        console.log("📦 User not subscribed → go to subscribe step");
        setStep("subscribe");
      }
    } catch (err) {
      console.error("❌ setStepSmart error:", err);
      setInlineError("Something went wrong.");
      setStep("subscribe");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    console.log("📥 Modal opened. Checking context and localStorage...");

    const url = new URL(window.location.href);
    const fromStripe = url.searchParams.get("fromStripe");
    const savedStep = localStorage.getItem("modalStep");

    const init = async () => {
      if (user?.email) {
        console.log("📧 User email from context:", user.email);
        setEmail(user.email);
        localStorage.setItem("lastEmail", user.email);
      }

      if (fromProfileMenu) {
        console.log("👤 Opened from profile menu → login step");
        return setStep("login");
      }

      if (startAtSubscribe || fromStripe) {
        console.log("💳 Coming from Stripe or AccountSettings → skip to subscribe");
        window.dataLayer?.push({
          event: "returned_from_stripe",
          user_id: user?.id || "anonymous",
        });
        return setStep("subscribe");
      }

      if (savedStep === "subscribe" || savedStep === "download") {
        console.log("💾 Restoring step from localStorage:", savedStep);
        await setStepSmart();
      } else {
        console.log("🔐 Defaulting to login step");
        setStep("login");
      }
    };

    init();
  }, [isOpen, fromProfileMenu, startAtSubscribe, setStepSmart, user]);

  useEffect(() => {
    const handler = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) onClose();
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", handler);
    };
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    console.log("🔄 Resetting modal state...");
    setStep("login");
    setEmailMode("signup");
    setEmail(localStorage.getItem("lastEmail") || "");
    setPassword("");
    setErrors({});
    setInlineError("");
    setSuccessMessage("");
    setLoading(false);
    setLoginAttempts(0);
    setShowPassword(false);
  }, [isOpen]);

  const validate = useCallback(() => {
    const newErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = t("invalidEmail");
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (emailMode !== "reset" && !passwordRegex.test(password)) {
      newErrors.password = t("passwordCriteria");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [email, password, emailMode, t]);

  const handleEmailAuth = async () => {
    if (loading || !validate()) return;

    console.log("🚀 Starting email auth:", { emailMode, email });
    setLoading(true);
    setInlineError("");
    setSuccessMessage("");

    if (loginAttempts >= 5) {
      setInlineError(t("tooManyAttempts") || "Too many failed attempts. Please try again later.");
      setLoading(false);
      return;
    }

    localStorage.setItem("lastEmail", email);
    const isSignup = emailMode === "signup";
    const language = navigator.language.startsWith("nl") ? "nl" : "en";

    try {
      const { data, error } = isSignup
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { language } },
          })
        : await supabase.auth.signInWithPassword({ email, password });

      console.log("🟢 Supabase auth response:", { data, error });

      if (error) {
        setLoginAttempts((prev) => prev + 1);
        setInlineError(error.message);
        setLoading(false);
        return;
      }

      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        console.log(`⏳ Session check ${i + 1}/10:`, data.session?.user?.email);
        if (data.session?.user) {
          session = data.session;
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
      }

      const currentUser = session?.user;
      console.log("✅ Hydrated session user:", currentUser);

      if (!currentUser) {
        setInlineError(t("loginError"));
        setLoading(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", currentUser.id)
        .maybeSingle();

      console.log("📄 Profile check:", profile, profileError);

      if (!profile) {
        await supabase.from("profiles").insert([
          {
            id: currentUser.id,
            email: currentUser.email,
            is_subscribed: false,
            language,
          },
        ]);
        console.log("🆕 Profile inserted for:", currentUser.email);
      }

      window.dataLayer?.push({
        event: isSignup ? "auth_email_signup" : "auth_email_login",
        email,
      });

      localStorage.setItem("modalStep", "subscribe");
      await setStepSmart();
    } catch (err) {
      console.error("🔥 Email auth error:", err);
      setInlineError(t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (loading || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: t("invalidEmail") });
      return;
    }

    setLoading(true);
    setInlineError("");
    setSuccessMessage("");

    try {
      console.log("🔁 Sending reset email to:", email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("❌ Reset password error:", error);
        setInlineError(t("resetError"));
      } else {
        console.log("✅ Reset email sent");
        setSuccessMessage(t("resetEmailSent"));
        window.dataLayer?.push({
          event: "auth_reset_requested",
          email,
        });
      }
    } catch (err) {
      console.error("🔥 Reset email error:", err);
      setInlineError(t("resetError"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);

    try {
      localStorage.setItem("modalStep", step);
      console.log("🟢 Starting Google login");
      window.dataLayer?.push({ event: "google_login_click" });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error("❌ Google login error:", error.message);
        setInlineError(t("loginError"));
      }
    } catch (err) {
      console.error("🔥 Unexpected Google login error:", err);
      setInlineError(t("loginError"));
    }
    // no finally → user gets redirected
  };

  const handleSubscribe = () => {
    console.log("🛒 Subscribing to plan:", selectedPlanData.id);
    localStorage.setItem("modalStep", "subscribe");

    window.dataLayer?.push({
      event: "subscribe_click",
      plan_id: selectedPlanData.id,
      plan_label: t(selectedPlanData.labelKey),
    });

    window.location.href = selectedPlanData.checkoutUrl;
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const personal = cvData?.data?.personal || {};
      await new Promise((r) => setTimeout(r, 300));
      await downloadCV(previewRef.current, personal);

      window.dataLayer?.push({
        event: "cv_download",
        user_id: user?.id || "anonymous",
        cv_id: cvData?.id,
      });

      console.log("📄 CV downloaded successfully");
      onDownload?.();
      onClose?.();
      localStorage.removeItem("modalStep");
    } catch (err) {
      console.error("❌ CV download error:", err);
      setInlineError(t("downloadError"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
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

      <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-sm flex items-center justify-center px-2 sm:px-4">
        <div
          ref={modalRef}
          className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-6 sm:p-8 font-[Poppins] relative overflow-y-auto max-h-[90vh] text-sm space-y-6 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
        >
          {/* Header and step tracker already shown in Part 1 */}

          {step === "subscribe" && (
            <div>
              <p className="text-center text-gray-600 text-sm mb-4">
                {t("selectSubscriptionToProceed")}
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {plans.map((plan) => {
                  const isSelected = selectedPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => {
                        setSelectedPlan(plan.id);
                        console.log("📦 Selected plan:", plan.id);
                        window.dataLayer?.push({
                          event: "plan_selected",
                          plan_id: plan.id,
                          plan_label: t(plan.labelKey),
                        });
                      }}
                      className={`relative border rounded-xl p-4 text-left transition text-sm ${
                        isSelected
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{t(plan.labelKey)}</div>
                      <div className="text-xs text-gray-500 mt-1">{t(plan.descriptionKey)}</div>
                      {plan.popular && (
                        <span className="absolute top-2 right-2 text-[10px] bg-yellow-400 text-white font-semibold px-2 py-0.5 rounded-full shadow">
                          {t("mostPopular")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mt-6"
              >
                {loading ? t("loading") + "..." : t("try3DaysFor", { price: "€1,95" })}
              </button>

              <div className="flex items-center justify-center mt-3 gap-2 text-xs text-gray-400">
                <img src="/stripe.svg" alt="Stripe" className="h-4" />
                <span>{t("secureStripeCheckout")}</span>
              </div>
            </div>
          )}

          {step === "download" && (
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
          )}
        </div>
      </div>

      <style jsx>{`
        .loader {
          border: 2px solid #f3f3f3;
          border-top: 2px solid #000;
          border-radius: 50%;
          width: 14px;
          height: 14px;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

export default DownloadModal;
