import { useState, useMemo, useCallback } from "react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { XMarkIcon as RemoveIcon } from "@heroicons/react/20/solid";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";

const animationProps = {
  initial: { opacity: 0, y: 5 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 5 },
  transition: { duration: 0.2, ease: "easeOut" },
};

function Sidebar({ currentStep, setStep, dynamicSteps, onAddStep, onRemoveStep }) {
  const { t, ready } = useTranslation();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const fixedSteps = useMemo(() => ([
    { key: "personal", label: t("personalInfo") },
    { key: "work", label: t("workExperience") },
    { key: "education", label: t("education") },
    { key: "skills", label: t("skills") },
    { key: "languages", label: t("languages") },
    { key: "hobbies", label: t("hobbies") },
  ]), [t]);

  const suggestions = useMemo(() => ([
    { key: "courses", label: t("courses") },
    { key: "internships", label: t("internships") },
    { key: "traits", label: t("traits") },
    { key: "certifications", label: t("certifications") },
  ]), [t]);

  const dynamicStepObjects = useMemo(
    () => suggestions.filter(s => dynamicSteps.includes(s.key)),
    [suggestions, dynamicSteps]
  );

  const allSteps = useMemo(
    () => [...fixedSteps, ...dynamicStepObjects],
    [fixedSteps, dynamicStepObjects]
  );

  const remainingSuggestions = useMemo(
    () => suggestions.filter(s => !dynamicSteps.includes(s.key)),
    [suggestions, dynamicSteps]
  );

  const handleSetStep = useCallback((index) => {
    setStep(index);
    localStorage.setItem("currentStep", index);
  }, [setStep]);

  const handleAddStep = useCallback((key) => {
    onAddStep(key);
    const newIndex = fixedSteps.length + dynamicSteps.length;
    handleSetStep(newIndex);
  }, [onAddStep, fixedSteps.length, dynamicSteps.length, handleSetStep]);

  const handleRemoveStep = useCallback(async (key, index) => {
    onRemoveStep(key);
    if (currentStep === index) {
      const fallback = Math.max(0, index - 1);
      handleSetStep(fallback);
    }

    if (user) {
      const id = localStorage.getItem("currentCVId");
      if (id) {
        await supabase
          .from("cvs")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("user_id", user.id);
      }
    }
  }, [currentStep, handleSetStep, onRemoveStep, user]);

  const StepItem = ({ step, index, isMobile = false }) => {
    const isFixed = fixedSteps.some(f => f.key === step.key);
    const isActive = index === currentStep;
    const baseStyle = isActive
      ? "bg-blue-50 text-blue-600 font-semibold"
      : "text-gray-700 hover:bg-gray-100";

    return (
      <div
        key={step.key}
        onClick={() => {
          handleSetStep(index);
          if (isMobile) setMenuOpen(false);
        }}
        className={`group flex justify-between items-center px-3 py-1.5 rounded-lg cursor-pointer transition ${baseStyle}`}
        role="button"
        aria-label={step.label}
        tabIndex={0}
      >
        <span>{step.label}</span>
        {!isFixed && (
          <RemoveIcon
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveStep(step.key, index);
              if (isMobile) setMenuOpen(false);
            }}
            className="w-4 h-4 text-red-400 hover:text-red-600 transition-opacity opacity-0 group-hover:opacity-100"
            role="button"
            aria-label={t("remove")}
            tabIndex={-1}
          />
        )}
      </div>
    );
  };

  const SuggestionList = ({ isMobile = false }) => {
    if (!remainingSuggestions.length) return null;

    return (
      <motion.div className="mt-4 space-y-2" {...animationProps}>
        <h3 className="text-xs text-gray-400">{t("suggestions")}</h3>
        <div className="flex flex-wrap gap-2">
          {remainingSuggestions.map(s => (
            <button
              key={s.key}
              onClick={() => {
                handleAddStep(s.key);
                if (isMobile) setMenuOpen(false);
              }}
              className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 hover:bg-gray-200 transition"
            >
              + {s.label}
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-52 h-screen bg-white shadow-xl border-r border-gray-200 p-4 font-[Poppins] text-sm"
        aria-label={t("sidebarNavigation")}
      >
        <nav className="space-y-2 overflow-y-auto flex-grow pr-1">
          <AnimatePresence>
            {allSteps.map((step, index) => (
              <motion.div key={step.key} {...animationProps}>
                <StepItem step={step} index={index} />
              </motion.div>
            ))}
          </AnimatePresence>
          <SuggestionList />
        </nav>
      </aside>

      {/* Mobile Toggle Button */}
      <div className="fixed bottom-4 left-4 md:hidden z-50">
        <button
          onClick={() => setMenuOpen(prev => !prev)}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg transition"
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
        >
          {menuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            {...animationProps}
            className="fixed bottom-20 left-4 right-4 z-40 bg-white rounded-xl shadow-xl p-4 border border-gray-200 space-y-3 md:hidden font-[Poppins] text-sm"
            aria-label={t("sidebarMobileMenu")}
          >
            {allSteps.map((step, index) => (
              <div key={step.key}>
                <StepItem step={step} index={index} isMobile />
              </div>
            ))}
            <SuggestionList isMobile />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
