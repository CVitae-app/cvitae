import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { XMarkIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";
import { downloadCV } from "../utils/downloadPDF";
import CVPreview from "./CVPreview";

const plans = [/* your plans stay unchanged */];

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
      if (user?.email) {
        setEmail(user.email);
        localStorage.setItem("lastEmail", user.email);
      }

      if (fromProfileMenu) return setStep("login");

      if (startAtSubscribe || fromStripe) {
        window.dataLayer?.push({
          event: "returned_from_stripe",
          user_id: user?.id || "anonymous",
        });
        return setStep("subscribe");
      }

      if (savedStep === "subscribe" || savedStep === "download") {
        await setStepSmart();
      } else {
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
    if (!isOpen) {
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
    if (loading || !validate()) return;
  
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
  
      console.log("🟢 Auth response:", data, error);
  
      if (error) {
        setLoginAttempts((prev) => prev + 1);
        setInlineError(error.message);
        setLoading(false);
        return;
      }
  
      // 🔁 Wait for Supabase session to hydrate
      let session = null;
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          session = data.session;
          break;
        }
        console.log("⏳ Waiting for session...");
        await new Promise((r) => setTimeout(r, 250));
      }
  
      const user = session?.user;
      console.log("✅ Final session:", session);
  
      if (!user) {
        setInlineError(t("loginError"));
        setLoading(false);
        return;
      }
  
      // 🧠 Make sure profile exists
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();
  
      if (!profile) {
        await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email,
            is_subscribed: false,
            language,
          },
        ]);
      }
  
      // 🎯 GTM tracking
      window.dataLayer?.push({
        event: isSignup ? "auth_email_signup" : "auth_email_login",
        email,
      });
  
      localStorage.setItem("modalStep", "subscribe");
      await setStepSmart(); // Move user to next step
    } catch (err) {
      console.error("🔥 Auth error:", err);
      setInlineError(t("loginError"));
    } finally {
      setLoading(false); // ✅ Always stop loading
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setInlineError(t("resetError"));
      } else {
        setSuccessMessage(t("resetEmailSent"));

        window.dataLayer?.push({
          event: "auth_reset_requested",
          email,
        });
      }
    } catch (err) {
      console.error("Reset password error:", err);
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

      window.dataLayer?.push({ event: "google_login_click" });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        console.error("Google login error:", error.message);
        setInlineError(t("loginError"));
      }
    } catch (err) {
      console.error("Unexpected Google login error:", err);
      setInlineError(t("loginError"));
    } finally {
      // Don't unset loading here because user is redirected
    }
  };

  const handleSubscribe = () => {
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
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}

                  {successMessage && (
                    <p className="text-xs text-green-600 text-center">{successMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-black text-white py-2 rounded-md hover:opacity-90 transition flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <span className="loader mr-2" />
                        {t("loading")}...
                      </>
                    ) : (
                      emailMode === "reset" ? t("sendResetLink") : t(emailMode)
                    )}
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
                  disabled={loading}
                >
                  <img
                    src="https://authjs.dev/img/providers/google.svg"
                    alt="Google"
                    className="w-4 h-4"
                  />
                  {loading ? `${t("loading")}...` : t("continueWithGoogle")}
                </button>
              </div>
            )}

            {/* Subscribe and Download steps stay unchanged */}
            {/* ... */}

          </div>
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
