import { useState, useEffect, useCallback } from "react";
import { XMarkIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient";
import DownloadModal from "../DownloadModal";

function AccountSettingsModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user, refreshProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [subscription, setSubscription] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [error, setError] = useState("");

  const isGoogleUser = user?.app_metadata?.provider === "google";

  // ✅ Fetch subscription data when the modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchSubscription();
    }
  }, [isOpen, user]);

  // ✅ Fetch Subscription Data Efficiently
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const { data, error } = await supabase
        .from("profiles")
        .select("is_subscribed, subscription_plan, subscription_ends")
        .eq("id", user.id)
        .single();

      if (error) throw new Error(t("subscriptionFetchError"));
      setSubscription(data);
    } catch (err) {
      setError(err.message || t("subscriptionFetchError"));
      console.error("❌ Subscription fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  // ✅ Handle Password Change for Non-Google Users
  const handleChangePassword = useCallback(async () => {
    if (newPassword.length < 6) {
      alert(t("passwordMinLength"));
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
      alert(t("passwordUpdated"));
      setNewPassword("");
    } catch (err) {
      alert(err.message);
      console.error("❌ Password update error:", err);
    } finally {
      setLoading(false);
    }
  }, [newPassword, t]);

  // ✅ Handle Manage Subscription via Stripe Billing Portal
  const handleManageStripe = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      if (!token) throw new Error(t("paymentError"));

      const response = await fetch("https://app.cvitae.nl/functions/v1/billing-portal", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const { url, error } = await response.json();
      if (error || !url) throw new Error(error || t("paymentError"));

      window.location.href = url;
    } catch (err) {
      setError(err.message || t("paymentError"));
      console.error("❌ Manage subscription error:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ✅ Handle User Logout Securely
  const handleLogout = useCallback(async () => {
    await logout();
    location.href = "/";
  }, [logout]);

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
                <div className="text-sm text-green-700">
                  ✅ {t("activePlan")} - {t(`planNames.${subscription.subscription_plan}`)}
                  {subscription.subscription_ends && (
                    <div className="text-xs text-gray-500">
                      {t("planRenewsOn", {
                        date: new Date(subscription.subscription_ends).toLocaleDateString(),
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
                  className="w-full px-3 py-2 border rounded-md focus:ring-blue-500"
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
