import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
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
  const [selectedPlan, setSelectedPlan] = useState("1month");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [inlineError, setInlineError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedPlanData = useMemo(() => plans.find((p) => p.id === selectedPlan), [selectedPlan]);

  const setStepSmart = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData?.session?.user;
      if (!currentUser) return setStep("login");

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_subscribed")
        .eq("id", currentUser.id)
        .maybeSingle();

      const subscribed = profile?.is_subscribed === true;
      if (subscribed) {
        localStorage.removeItem("modalStep");
        setStep("download");
      } else {
        setStep("subscribe");
      }
    } catch {
      setInlineError("Something went wrong.");
      setStep("subscribe");
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const url = new URL(window.location.href);
    const fromStripe = url.searchParams.get("fromStripe");
    const savedStep = localStorage.getItem("modalStep");

    const init = async () => {
      if (fromProfileMenu) return setStep("login");
      if (startAtSubscribe || fromStripe) return setStep("subscribe");

      if (savedStep === "subscribe" || savedStep === "download") {
        await setStepSmart();
      } else {
        setStep("login");
      }
    };

    init();
  }, [isOpen, fromProfileMenu, startAtSubscribe, setStepSmart]);

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
    if (!isOpen) {
      setStep("login");
      setEmailMode("signup");
      setEmail(localStorage.getItem("lastEmail") || "");
      setPassword("");
      setErrors({});
      setInlineError("");
      setSuccessMessage("");
      setLoading(false);
    }
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
    if (!validate()) return;
    setLoading(true);
    setInlineError("");
    setSuccessMessage("");
    localStorage.setItem("lastEmail", email);

    const isSignup = emailMode === "signup";

    try {
      const { error: authError } = isSignup
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setInlineError(authError.message);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setInlineError(sessionError.message);
        return;
      }

      const currentUser = sessionData?.session?.user;
      if (!currentUser) {
        setInlineError(t("loginError"));
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!profile) {
        await supabase.from("profiles").insert([
          {
            id: currentUser.id,
            email: currentUser.email,
            is_subscribed: false,
          },
        ]);
      }

      localStorage.setItem("modalStep", "subscribe");
      await setStepSmart();
    } catch {
      setInlineError(t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    if (error) setInlineError(t("resetError"));
    else setSuccessMessage(t("resetEmailSent"));
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    localStorage.setItem("modalStep", step);
    await supabase.auth.signInWithOAuth({ provider: "google" });
  };

  const handleSubscribe = () => {
    localStorage.setItem("modalStep", "subscribe");
    window.location.href = selectedPlanData.checkoutUrl;
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const personal = cvData?.data?.personal || {};
      await new Promise((r) => setTimeout(r, 300));
      await downloadCV(previewRef.current, personal);
      onDownload?.();
      onClose?.();
      localStorage.removeItem("modalStep");
    } catch {
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
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            aria-label={t("close")}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <div className="flex justify-center gap-4 text-xs text-gray-500 uppercase font-medium tracking-widest">
            <span className={step === "login" ? "text-black font-semibold" : ""}>{t("stepLogin")}</span>
            <span className="h-4 border-l border-gray-300"></span>
            <span className={step === "subscribe" ? "text-black font-semibold" : ""}>{t("stepPlan")}</span>
            <span className="h-4 border-l border-gray-300"></span>
            <span className={step === "download" ? "text-black font-semibold" : ""}>{t("stepDownload")}</span>
          </div>

          <div className="transition-all duration-300 ease-in-out space-y-4" key={step}>
            {inlineError && <div className="text-red-500 text-sm text-center">{inlineError}</div>}

            {step === "login" && (
              <div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (emailMode === "reset") handleResetPassword();
                    else handleEmailAuth();
                  }}
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className="w-full border px-3 py-2 rounded-md text-sm mb-3"
                  />
                  {emailMode !== "reset" && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      className="w-full border px-3 py-2 rounded-md text-sm mb-3"
                    />
                  )}
                  {successMessage && (
                    <p className="text-xs text-green-600 text-center">{successMessage}</p>
                  )}
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
                  className="w-full border border-gray-300 text-gray-800 py-2 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-4 h-4" />
                  {t("continueWithGoogle")}
                </button>
              </div>
            )}

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
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`relative border rounded-xl p-4 text-left transition text-sm ${
                          isSelected ? "border-blue-600 bg-blue-50" : "border-gray-200 hover:border-gray-300"
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
      </div>
    </>
  );
}

export default DownloadModal;
