import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "../contexts/LanguageContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowDownTrayIcon,
  GlobeAltIcon,
  ArrowLeftIcon,
  HomeIcon,
  PencilIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function TopBar({
  cvName,
  setCvName,
  cvRef,
  onDownload,
  onProfileClick,
  hideDownload = false,
  hideDashboard = false,
}) {
  const { t, language, setLanguage } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [editingName, setEditingName] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const getDynamicName = useCallback(() => {
    try {
      const formData = JSON.parse(localStorage.getItem("formData")) || {};
      const first = formData.personal?.firstName || "";
      const last = formData.personal?.lastName || "";
      return first && last ? `${t("cvOf")} ${first} ${last}` : t("cvWithoutName");
    } catch {
      return t("cvWithoutName");
    }
  }, [t]);

  const saveName = useCallback(
    async (name) => {
      const trimmed = name.trim();
      const finalName = trimmed || getDynamicName();

      setCvName?.(finalName);
      setInputValue(finalName);
      localStorage.setItem("cvName", finalName);
    },
    [getDynamicName, setCvName]
  );

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "nl" ? "en" : "nl");
  }, [language, setLanguage]);

  useEffect(() => {
    if (!hideDownload) {
      const stored = localStorage.getItem("cvName");
      const isDefault = !stored || stored === "CV without name" || stored === "CV zonder naam";

      const defaultName = getDynamicName();
      setCvName?.(isDefault ? defaultName : stored);
      setInputValue(isDefault ? defaultName : stored);
    }
  }, [getDynamicName, setCvName, hideDownload]);

  const handleBackClick = () => {
    const path = location.pathname;
    if (path === "/" || /^\/cv\/[^/]+$/.test(path)) {
      navigate("/dashboard");
    } else if (path === "/dashboard") {
      navigate("/");
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-3 py-2 md:px-6 border-b bg-white shadow-sm text-sm font-sans">
      {/* Left section */}
      <div className="flex items-center">
        <button
          onClick={handleBackClick}
          className="p-2 rounded-full hover:bg-gray-100 transition md:hidden"
          title="Back"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </button>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-blue-600 font-semibold text-base hover:opacity-90 transition"
          >
            CVitae
          </button>

          {!hideDashboard && (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition"
            >
              <HomeIcon className="w-4 h-4" />
              <span>{t("dashboard")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Center title */}
      {!hideDownload && (
        <div className="absolute left-1/2 -translate-x-1/2 max-w-[70%] px-4 text-center">
          {editingName ? (
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => {
                saveName(inputValue);
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  saveName(inputValue);
                  setEditingName(false);
                }
              }}
              autoFocus
              className="w-full px-2 py-0.5 border-b border-blue-500 text-center text-sm sm:text-base font-medium focus:outline-none"
            />
          ) : (
            <div
              onClick={() => setEditingName(true)}
              className="flex items-center justify-center gap-1 text-gray-800 hover:text-blue-600 cursor-pointer transition text-sm sm:text-base font-medium"
            >
              {cvName || getDynamicName()}
              <PencilIcon className="w-4 h-4 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Right buttons */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Language */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition"
          title={t("switchLanguage")}
        >
          <GlobeAltIcon className="w-5 h-5 text-gray-600" />
          <span className="text-xs font-medium text-gray-600 hidden sm:inline">
            {language === "nl" ? "NL" : "ENG"}
          </span>
        </button>

        {/* Download / Profile */}
        {!hideDownload ? (
          <button
            onClick={onDownload}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs sm:text-sm hover:bg-blue-700 transition"
            title={t("download")}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t("download")}</span>
          </button>
        ) : (
          <button
            onClick={onProfileClick}
            className="p-2 rounded-full hover:bg-gray-100 transition"
            title={t("profile")}
          >
            <UserCircleIcon className="w-6 h-6 text-gray-600" />
          </button>
        )}

        {/* Logout Button (Only if logged in) */}
        {user && (
          <button
            onClick={logout}
            className="p-2 rounded-full hover:bg-red-100 transition"
            title="Logout"
          >
            <XMarkIcon className="w-5 h-5 text-red-500" />
          </button>
        )}
      </div>
    </header>
  );
}

export default TopBar;
