import { useState, useEffect, useCallback } from "react";
import { Squares2X2Icon, Bars3Icon } from "@heroicons/react/24/outline";
import { useNavigate, useLocation } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence } from "framer-motion";

import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";
import { supabase } from "../utils/supabaseClient";
import MetaTags from "../utils/MetaTags";

import TopBar from "../sections/Topbar";
import CVCard from "../components/Dashboard/CVCard";
import ProfileMenu from "../components/Dashboard/ProfileMenu";

function Dashboard() {
  const { t, ready } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem("cvViewMode") || "grid");

  // Load CVs
  useEffect(() => {
    const loadCVs = async () => {
      setLoading(true);
      if (user) {
        const { data, error } = await supabase
          .from("cvs")
          .select("id, name, data, dynamic_steps, settings, updated_at, user_id")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("❌ Supabase error:", error.message);
          setError(t("failedToLoadCVs"));
        } else {
          setCvs(data || []);
        }
      } else {
        const saved = JSON.parse(localStorage.getItem("savedCVs") || "[]");
        setCvs(saved);
      }
      setLoading(false);
    };

    if (user !== undefined) loadCVs();
  }, [user, t]);

  useEffect(() => {
    localStorage.setItem("cvViewMode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (!user) {
      localStorage.setItem("savedCVs", JSON.stringify(cvs));
    }
  }, [cvs, user]);

  const handleCreateCV = useCallback(async () => {
    if (cvs.length >= 5) return;

    const id = uuidv4();
    const name = t("cvWithoutName");

    const newCV = {
      id,
      name,
      data: {
        personal: {},
        workExperience: [],
        education: [],
        internships: [],
        courses: [],
        certifications: [],
        languages: [],
        skills: [],
        traits: [],
        hobbies: [],
      },
      dynamic_steps: ["internships", "courses", "certifications"],
      settings: {
        template: "luna", // or another default
        font: "Poppins",
        fontSize: "m",
        lineSpacing: "1.25",
        themeColor: "#3B82F6",
      },
      updated_at: new Date().toISOString(),
    };

    if (user) {
      const { data, error } = await supabase
        .from("cvs")
        .insert({ ...newCV, user_id: user.id })
        .select("id")
        .single();

      if (error) {
        console.error("❌ Supabase insert error:", error.message);
        return;
      }

      localStorage.setItem("currentCVId", data.id);
    } else {
      const saved = JSON.parse(localStorage.getItem("savedCVs") || "[]");
      localStorage.setItem("savedCVs", JSON.stringify([newCV, ...saved]));
      localStorage.setItem("currentCVId", id);
    }

    localStorage.setItem("currentStep", "0");
    navigate("/");
  }, [user, t, navigate, cvs]);

  const handleDeleteCV = useCallback((id) => {
    setCvs((prev) => prev.filter((cv) => cv.id !== id));

    if (user) {
      supabase.from("cvs").delete().eq("id", id).then(({ error }) => {
        if (error) console.error("❌ Delete error:", error.message);
      });
    } else {
      const updated = cvs.filter((cv) => cv.id !== id);
      localStorage.setItem("savedCVs", JSON.stringify(updated));
    }
  }, [user, cvs]);

  const handleOpenCV = useCallback((cv) => {
    localStorage.setItem("currentCVId", cv.id);
    localStorage.setItem("currentStep", "0");
    navigate("/");
  }, [navigate]);

  const handleRenameCV = useCallback((id, newName) => {
    setCvs((prev) =>
      prev.map((cv) => (cv.id === id ? { ...cv, name: newName } : cv))
    );

    if (user) {
      supabase.from("cvs").update({ name: newName }).eq("id", id);
    } else {
      const saved = JSON.parse(localStorage.getItem("savedCVs") || "[]");
      const updated = saved.map((cv) =>
        cv.id === id ? { ...cv, name: newName } : cv
      );
      localStorage.setItem("savedCVs", JSON.stringify(updated));
    }
  }, [user]);

  const handleDuplicateCV = useCallback((cv) => {
    if (cvs.length >= 5) return;

    const id = uuidv4();
    const name = `${cv.name} (Copy)`;
    const duplicated = {
      ...cv,
      id,
      name,
      updated_at: new Date().toISOString(),
    };

    if (user) {
      supabase.from("cvs").insert({ ...duplicated, user_id: user.id });
    } else {
      const saved = JSON.parse(localStorage.getItem("savedCVs") || "[]");
      localStorage.setItem("savedCVs", JSON.stringify([duplicated, ...saved]));
    }

    setCvs((prev) => [duplicated, ...prev]);
  }, [user, cvs]);

  const handleProfileClick = () => {
    setProfileOpen((prev) => !prev);
  };

  return (
    <>
      <MetaTags /> {/* ✅ Inject dynamic tab title & meta */}
      
      <div className="flex flex-col min-h-screen bg-gray-50 font-[Poppins] text-sm">
        <TopBar onProfileClick={handleProfileClick} hideDownload hideDashboard />
        <ProfileMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
  
        <main className="flex-1 px-4 sm:px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <h1 className="text-xl sm:text-2xl font-semibold">{t("yourCVs")}</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  <Squares2X2Icon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  <Bars3Icon className="w-5 h-5" />
                </button>
              </div>
            </div>
  
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
                  : "flex flex-col gap-3"
              }
            >
              {cvs.length < 5 && (
                <CVCard isNew onCreate={handleCreateCV} viewMode={viewMode} />
              )}
  
              <AnimatePresence>
                {cvs.map((cv) => (
                  <CVCard
                    key={cv.id}
                    data={cv}
                    viewMode={viewMode}
                    onDelete={() => handleDeleteCV(cv.id)}
                    onDuplicate={() => handleDuplicateCV(cv)}
                    onRename={(name) => handleRenameCV(cv.id, name)}
                    onSelect={() => handleOpenCV(cv)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </>
  );  
}

export default Dashboard;
