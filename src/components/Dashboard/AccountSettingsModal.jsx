import { useState, useEffect, useCallback } from "react";
import { XMarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient";
import DownloadModal from "../DownloadModal";

function AccountSettingsModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const isGoogleUser = user?.app_metadata?.provider === "google";

  // Fetch subscription data
  useEffect(() => {
    if (!user) return;

    const fetchSubscription = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_subscribed, subscription_plan, subscription_ends")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ Subscription fetch error:", error.message);
      } else {
        setSubscription(data);
      }
    };

    fetchSubscription();
  }, [user]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      alert(t("passwordMinLength"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      alert(error.message);
    } else {
      alert(t("passwordUpdated"));
      setNewPassword("");
    }
  }, [newPassword, t]);

  const handleManageStripe = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        alert(t("paymentError"));
        return;
      }

      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error || !data?.url) {
        alert(t("paymentError"));
      } else {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error(err);
      alert(t("paymentError"));
    }
  }, [t]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    location.href = "/";
  }, []);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-settings-title"
      >
        <div className="w-full max-w-md bg-white rounded-2xl p-6 relative shadow-xl space-y-6 font-[Poppins] text-sm">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            aria-label={t("close")}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <h2 id="account-settings-title" className="text-lg font-semibold text-center">
            {t("accountSettings")}
          </h2>

          <div className="space-y-4 text-gray-800">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {t("email")}
              </label>
              <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">
                {user?.email}
              </div>
              {isGoogleUser && (
                <p className="text-xs text-blue-600 mt-1">{t("loggedInWithGoogle")}</p>
              )}
            </div>

            {/* Subscription Info */}
            <div className="bg-gray-50 border rounded-md p-3 space-y-2">
              <p className="font-medium">{t("manageSubscription")}</p>

              {subscription?.is_subscribed ? (
                <div className="space-y-1 text-sm text-green-700">
                  ✅ {t("activePlan")}<br />
                  <span className="text-gray-700">
                    {t("planLabel")}: {t("planWithPrice", {
                      plan: t(`planNames.${subscription.subscription_plan}`),
                      price: t(`pricing.${subscription.subscription_plan}`)
                    })}
                  </span>
                  {subscription.subscription_ends && (
                    <div className="text-xs text-gray-500">
                      {t("planRenewsOn", {
                        date: new Date(subscription.subscription_ends).toLocaleDateString("nl-NL", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      })}
                    </div>
                  )}
                  <button
                    onClick={handleManageStripe}
                    className="text-xs underline text-blue-600 hover:text-blue-800 mt-1"
                  >
                    {t("manageViaStripe")}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDownloadModal(true)}
                  className="text-red-600 text-sm underline hover:text-red-700 transition"
                >
                  {t("noPlan")}
                </button>
              )}
            </div>

            {/* Password Update (non-Google users only) */}
            {!isGoogleUser && (
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  {t("passwordPlaceholder")}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                >
                  {loading ? `${t("loading")}...` : t("updatePassword")}
                </button>
              </div>
            )}

            {/* Logout */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 py-2 px-4 rounded-md transition"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>{t("logout")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal for non-subscribed users */}
      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        startAtSubscribe
      />
    </>
  );
}

export default AccountSettingsModal;
