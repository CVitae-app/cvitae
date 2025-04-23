import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { AnimatePresence, motion } from "framer-motion";

import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../utils/supabaseClient";

import useUndoRedo from "../hooks/useUndoRedo";
import useDebouncedCallback from "../hooks/useDebouncedCallback";
import MetaTags from "../utils/MetaTags";

import TopBar from "../sections/Topbar";
import Sidebar from "../sections/Sidebar";
import FloatingBar from "../components/FloatingBar";
import DownloadModal from "../components/DownloadModal";
import CVPreview from "../components/CVPreview";

import PersonalInfo from "../components/FormSteps/PersonalInfo";
import WorkExperience from "../components/FormSteps/WorkExperience";
import Education from "../components/FormSteps/Education";
import Skills from "../components/FormSteps/Skills";
import Languages from "../components/FormSteps/Languages";
import Hobbies from "../components/FormSteps/Hobbies";
import Courses from "../components/FormSteps/Courses";
import Internships from "../components/FormSteps/Internships";
import Traits from "../components/FormSteps/Traits";
import Certifications from "../components/FormSteps/Certifications";

const defaultSettings = {
  template: "modern",
  font: "Poppins",
  fontSize: "m",
  lineSpacing: "1.25",
  themeColor: "#3B82F6",
};

const defaultFormData = {
  personal: {},
  work: [],
  education: [],
  skills: [],
  languages: [],
  hobbies: [],
  courses: [],
  internships: [],
  traits: [],
  certifications: [],
};

const FORM_KEYS = {
  local: {
    step: "currentStep",
    name: "cvName",
    settings: "cvSettings",
    form: "formData",
    id: "currentCVId",
    dynamic: "dynamicSteps",
  },
};

export default function CVBuilder() {
  const { t, ready } = useTranslation();
  const { user } = useAuth();
  const previewRef = useRef();

  const [mobileScale, setMobileScale] = useState(1); // ✅ for dynamic preview height
  const [showModal, setShowModal] = useState(false);
  const [forceSubscribeStep, setForceSubscribeStep] = useState(false);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);

  const storedName = localStorage.getItem(FORM_KEYS.local.name);
  const [cvName, setCvName] = useState(storedName || "");

  const [settings, setSettings] = useState(() =>
    JSON.parse(localStorage.getItem(FORM_KEYS.local.settings)) || defaultSettings
  );
  const [dynamicSteps, setDynamicSteps] = useState(() =>
    JSON.parse(localStorage.getItem(FORM_KEYS.local.dynamic)) || []
  );
  const [step, setStep] = useState(() =>
    parseInt(localStorage.getItem(FORM_KEYS.local.step), 10) || 0
  );
  const [openedKey, setOpenedKey] = useState("personal");

  const {
    state: formData,
    setState: setFormData,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo(() =>
    JSON.parse(localStorage.getItem(FORM_KEYS.local.form)) || defaultFormData
  );

  useEffect(() => {
    if (!storedName && ready) {
      setCvName(t("cvWithoutName"));
    }
  }, [ready, storedName, t]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get("checkout");

    if (checkoutStatus === "success") {
      setShowModal(true);
      setForceSubscribeStep(true);

      setTimeout(() => {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("checkout");
        window.history.replaceState({}, "", newUrl.toString());
      }, 1000);
    }
  }, []);

  const stepDefinitions = useMemo(() => ({
    fixed: [
      { key: "personal", label: t("personalInfo"), Component: PersonalInfo },
      { key: "work", label: t("workExperience"), Component: WorkExperience },
      { key: "education", label: t("education"), Component: Education },
      { key: "skills", label: t("skills"), Component: Skills },
      { key: "languages", label: t("languages"), Component: Languages },
      { key: "hobbies", label: t("hobbies"), Component: Hobbies },
    ],
    suggestions: [
      { key: "courses", label: t("courses"), Component: Courses },
      { key: "internships", label: t("internships"), Component: Internships },
      { key: "traits", label: t("traits"), Component: Traits },
      { key: "certifications", label: t("certifications"), Component: Certifications },
    ],
  }), [t]);

  const fixedSteps = stepDefinitions.fixed;
  const suggestions = stepDefinitions.suggestions;

  const allSteps = useMemo(() =>
    [...fixedSteps, ...suggestions.filter(s => dynamicSteps.includes(s.key))]
  , [fixedSteps, suggestions, dynamicSteps]);

  const safeStep = Math.min(step, allSteps.length - 1);
  const { key: activeKey, Component: ActiveComponent } = allSteps[safeStep] || {};

  const updateStep = useCallback((index) => {
    setStep(index);
    localStorage.setItem(FORM_KEYS.local.step, index);
  }, []);

  const addDynamicStep = useCallback((key) => {
    if (!dynamicSteps.includes(key)) {
      const updated = [...dynamicSteps, key];
      setDynamicSteps(updated);
      localStorage.setItem(FORM_KEYS.local.dynamic, JSON.stringify(updated));
      const newIndex = fixedSteps.length + updated.findIndex(k => k === key);
      updateStep(newIndex);
    }
  }, [dynamicSteps, fixedSteps.length, updateStep]);

  const removeDynamicStep = useCallback((key) => {
    const updated = dynamicSteps.filter(k => k !== key);
    setDynamicSteps(updated);
    localStorage.setItem(FORM_KEYS.local.dynamic, JSON.stringify(updated));
    if (activeKey === key) updateStep(Math.max(0, safeStep - 1));
  }, [dynamicSteps, activeKey, safeStep, updateStep]);

  const debouncedSync = useDebouncedCallback(() => {
    if (!user) return;
    const id = localStorage.getItem(FORM_KEYS.local.id);
    if (!id) return;

    const payload = {
      id,
      user_id: user.id,
      name: cvName,
      data: formData,
      dynamic_steps: dynamicSteps,
      settings,
      photo_url: formData?.personal?.photo || null,
      updated_at: new Date().toISOString(),
    };

    supabase.from("cvs").upsert(payload).then(({ error }) => {
      if (error) console.error("❌ Supabase sync error:", error.message);
    });
  }, 500);

  const handleFormUpdate = useCallback((key, data) => {
    const updated = { ...formData, [key]: data };
    setFormData(updated, { saveHistory: false });
    localStorage.setItem(FORM_KEYS.local.form, JSON.stringify(updated));
    debouncedSync();
  }, [formData, setFormData, debouncedSync]);

  const handleSettingsChange = useCallback((newSettings) => {
    setSettings(newSettings);
    localStorage.setItem(FORM_KEYS.local.settings, JSON.stringify(newSettings));
    debouncedSync();
  }, [debouncedSync]);

  useEffect(() => {
    let id = localStorage.getItem(FORM_KEYS.local.id);
    if (!id) {
      id = uuidv4();
      localStorage.setItem(FORM_KEYS.local.id, id);
    }

    if (!localStorage.getItem(FORM_KEYS.local.step)) updateStep(0);

    if (user) {
      supabase
        .from("cvs")
        .select("name, data, dynamic_steps, settings")
        .eq("id", id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error("❌ Failed to load CV:", error.message);
            return;
          }

          if (data) {
            data.name && setCvName(data.name);
            data.data && setFormData(data.data);
            data.dynamic_steps && setDynamicSteps(data.dynamic_steps);
            data.settings && setSettings(data.settings);
          }
        });
    }
  }, [user, updateStep, setFormData]);

  useEffect(() => {
    const maxStep = fixedSteps.length + dynamicSteps.length - 1;
    if (step > maxStep) updateStep(maxStep);
  }, [dynamicSteps]);

  useEffect(() => {
    localStorage.setItem(FORM_KEYS.local.name, cvName);
  }, [cvName]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

  if (!ready) return null;

  return (
    <>
      <MetaTags cvName={cvName} />

      <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-[Poppins] text-sm">
        <TopBar
          cvName={cvName}
          setCvName={setCvName}
          cvRef={previewRef}
          onDownload={() => setShowModal(true)}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div className="flex-1 flex flex-col xl:grid xl:grid-cols-[220px_minmax(300px,1fr)_minmax(794px,1fr)] overflow-hidden">
          <div className="hidden xl:block bg-gray-50">
            <Sidebar
              currentStep={safeStep}
              setStep={updateStep}
              dynamicSteps={dynamicSteps}
              onAddStep={addDynamicStep}
              onRemoveStep={removeDynamicStep}
              onDownload={() => setShowModal(true)}
            />
          </div>

          <div className="overflow-y-auto w-full bg-gray-50 px-4 pt-4 pb-[120px] max-w-full">
            <div className="block xl:hidden">
              {allSteps.map(({ key, label, Component }) => (
                <div key={key} className="mb-3 border border-gray-200 rounded-xl bg-white">
                  <button
                    className="w-full flex justify-between items-center px-4 py-3 font-medium text-left"
                    onClick={() => setOpenedKey(prev => (prev === key ? null : key))}
                    aria-expanded={openedKey === key}
                    aria-controls={`form-section-${key}`}
                  >
                    <span>{label}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {openedKey === key && (
                      <motion.div
                        id={`form-section-${key}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden px-4 pb-4"
                      >
                        <Component
                          value={formData[key]}
                          onChange={(data) => handleFormUpdate(key, data)}
                          currentCVId={localStorage.getItem(FORM_KEYS.local.id)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            <div className="hidden xl:block">
              {ActiveComponent ? (
                <ActiveComponent
                  value={formData[activeKey]}
                  onChange={(data) => handleFormUpdate(activeKey, data)}
                  currentCVId={localStorage.getItem(FORM_KEYS.local.id)}
                />
              ) : (
                <p className="text-gray-500 italic">{t("stepNotFound")}</p>
              )}
            </div>
          </div>

          <div className="relative h-full bg-gray-100 overflow-auto px-4 py-6 hidden xl:flex flex-col items-center">
            <div className="w-full max-w-[794px] rounded-2xl bg-white shadow-2xl overflow-hidden mb-0">
              <CVPreview
                data={{ ...formData, workExperience: formData.work }}
                dynamicSteps={dynamicSteps}
                settings={settings}
                setSettings={setSettings}
                currentCVId={localStorage.getItem(FORM_KEYS.local.id)}
              />
            </div>
          </div>

          {showPreviewMobile && (
            <div
              className="xl:hidden fixed inset-0 z-30 bg-gray-50 overflow-y-auto pt-4 px-4"
              style={{ paddingBottom: "0px" }}
            >
              <div
  className="w-full max-w-[794px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden"
>
                <CVPreview
                  data={{ ...formData, workExperience: formData.work }}
                  dynamicSteps={dynamicSteps}
                  settings={settings}
                  setSettings={setSettings}
                  currentCVId={localStorage.getItem(FORM_KEYS.local.id)}
                  onScaleChange={setMobileScale}
                />
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-4 right-4 z-50 hidden xl:block">
          <FloatingBar
            onChange={handleSettingsChange}
            settings={settings}
            onRequireAuth={() => !user && setShowModal(true)}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-4 xl:hidden">
          <div className="max-w-screen-sm mx-auto w-full">
            <FloatingBar
              onChange={handleSettingsChange}
              settings={settings}
              onRequireAuth={() => !user && setShowModal(true)}
              onTogglePreview={() => setShowPreviewMobile(prev => !prev)}
              isPreviewOpen={showPreviewMobile}
            />
          </div>
        </div>

        <DownloadModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          cvData={{
            data: { ...formData, workExperience: formData.work },
            dynamic_steps: dynamicSteps,
            settings,
            id: localStorage.getItem(FORM_KEYS.local.id),
          }}
          onDownload={() => {}}
          startAtSubscribe={forceSubscribeStep}
        />

        <div style={{ position: "absolute", top: 0, left: "-9999px", width: "794px", height: "1123px" }}>
          <div ref={previewRef}>
            <CVPreview
              data={{ ...formData, workExperience: formData.work }}
              dynamicSteps={dynamicSteps}
              settings={settings}
              currentCVId={localStorage.getItem(FORM_KEYS.local.id)}
              onScaleChange={() => {}} // no-op
            />
          </div>
        </div>
      </div>
    </>
  );
}
