import { useEffect, useRef, useState, useMemo } from "react";
import {
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslation } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient";
import AccountSettingsModal from "./AccountSettingsModal";
import DownloadModal from "../DownloadModal";

function ProfileMenu({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const modalRef = useRef();

  const [showSettings, setShowSettings] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const displayName = useMemo(() => {
    const raw = localStorage.getItem("formData");
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const personal = parsed?.personal || {};
      const { firstName, lastName } = personal;

      if (firstName?.trim() && lastName?.trim()) {
        return `${firstName.trim()} ${lastName.trim()}`;
      }
    } catch (err) {
      console.warn("Failed to parse formData from localStorage:", err);
    }

    return null;
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && !user) {
      setShowDownloadModal(true);
    }
  }, [isOpen, user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = "/dashboard";
  };

  const handleOpenSettings = () => {
    setShowSettings(true);
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && user && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative space-y-5 font-[Poppins]"
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center gap-1 text-center">
                <UserIcon className="w-8 h-8 text-blue-600" />
                <p className="text-sm font-semibold text-gray-800">
                  {displayName || user.email}
                </p>
                {displayName && (
                  <p className="text-xs text-gray-500">{user.email}</p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <button
                  onClick={handleOpenSettings}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-gray-500" />
                  <span>{t("accountSettings")}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 text-left px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>{t("logout")}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AccountSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      <DownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
        fromProfileMenu={true}
      />
    </>
  );
}

export default ProfileMenu;
