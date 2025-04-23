import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useTranslation } from "../../contexts/LanguageContext";
import { motion } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const BASE_MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const SortableItem = React.memo(({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    cursor: "grab",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </motion.div>
  );
});

function WorkExperience({ value = [], onChange }) {
  const { t } = useTranslation();

  const [jobs, setJobs] = useState(() => (value.length > 0 ? value : [generateJob()]));
  const [errors, setErrors] = useState({});

  const translatedMonths = useMemo(() => t("months", { returnObjects: true }), [t]);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 50 }, (_, i) => now - i);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    onChange?.(jobs);
  }, [jobs]);

  const validateJob = useCallback((id, job) => {
    const jobErrors = {};
    if (!job.functie) jobErrors.functie = t("requiredField");
    if (!job.bedrijf) jobErrors.bedrijf = t("requiredField");
    if (!job.startMaand || !job.startJaar) jobErrors.start = t("startDateRequired");

    if (!job.werktHier && job.startJaar && job.eindJaar) {
      const start = new Date(`${job.startMaand || "january"} 1, ${job.startJaar}`);
      const end = new Date(`${job.eindMaand || "december"} 1, ${job.eindJaar}`);
      if (start > end) jobErrors.date = t("startBeforeEnd");
    }

    setErrors((prev) => ({ ...prev, [id]: jobErrors }));
  }, [t]);

  const updateJob = useCallback((id, key, value) => {
    setJobs((prev) => {
      const updated = prev.map((job) =>
        job.id === id ? { ...job, [key]: value } : job
      );
      validateJob(id, updated.find((j) => j.id === id));
      return updated;
    });
  }, [validateJob]);

  const addJob = useCallback(() => setJobs((prev) => [...prev, generateJob()]), []);
  const removeJob = useCallback((id) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIdx = jobs.findIndex((j) => j.id === active.id);
      const newIdx = jobs.findIndex((j) => j.id === over.id);
      setJobs(arrayMove(jobs, oldIdx, newIdx));
    }
  }, [jobs]);

  return (
    <div className="w-full max-w-[600px] px-3 sm:px-4 space-y-6 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("workExperience")}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {jobs.map((job) => {
              const jobErr = errors[job.id] || {};
              return (
                <SortableItem key={job.id} id={job.id}>
                  {({ dragHandleProps }) => (
                    <div className="relative bg-white shadow-sm border rounded-xl p-4 sm:p-5 space-y-4 transition-all">
                      {jobs.length > 1 && (
                        <div
                          className="absolute top-3 right-3 text-gray-400 group"
                          {...dragHandleProps}
                          aria-label={t("dragToReorder")}
                        >
                          <GripVertical size={16} />
                          <span className="absolute right-0 mt-1 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            {t("dragToReorder")}
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField label={t("jobTitle")} value={job.functie} error={jobErr.functie} onChange={(val) => updateJob(job.id, "functie", val)} />
                        <InputField label={t("company")} value={job.bedrijf} error={jobErr.bedrijf} onChange={(val) => updateJob(job.id, "bedrijf", val)} />
                        <InputField label={t("cityField")} value={job.stad} onChange={(val) => updateJob(job.id, "stad", val)} full />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DateSelect
                          label={t("startDate")}
                          month={job.startMaand}
                          year={job.startJaar}
                          onMonthChange={(val) => updateJob(job.id, "startMaand", val)}
                          onYearChange={(val) => updateJob(job.id, "startJaar", val)}
                          months={BASE_MONTHS}
                          monthLabels={translatedMonths}
                          years={years}
                          error={jobErr.start}
                        />

                        <DateSelect
                          label={t("endDate")}
                          month={job.eindMaand}
                          year={job.eindJaar}
                          onMonthChange={(val) => updateJob(job.id, "eindMaand", val)}
                          onYearChange={(val) => updateJob(job.id, "eindJaar", val)}
                          months={BASE_MONTHS}
                          monthLabels={translatedMonths}
                          years={years}
                          hide={job.werktHier}
                          checkbox={{
                            checked: job.werktHier,
                            onChange: (val) => updateJob(job.id, "werktHier", val),
                            label: t("current"),
                          }}
                          error={jobErr.date}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">{t("description")}</label>
                        <textarea value={job.beschrijving} onChange={(e) => updateJob(job.id, "beschrijving", e.target.value)} className="w-full border rounded-lg px-3 py-2 resize-none" rows={3} />
                      </div>

                      {jobs.length > 1 && (
                        <button onClick={() => removeJob(job.id)} className="text-red-500 text-xs hover:underline">
                          {t("remove")}
                        </button>
                      )}
                    </div>
                  )}
                </SortableItem>
              );
            })}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      <button onClick={addJob} className="mt-2 text-sm text-blue-600 hover:underline">
        + {t("addExperience")}
      </button>
    </div>
  );
}

const InputField = ({ label, value, onChange, error, full }) => (
  <div className={full ? "sm:col-span-2" : ""}>
    <label className="text-xs font-medium">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded-lg px-3 py-2 ${error ? "border-red-500" : ""}`}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const DateSelect = ({ label, month, year, onMonthChange, onYearChange, months, monthLabels, years, hide = false, checkbox, error }) => (
  <div>
    <label className="text-xs font-medium flex items-center gap-2">
      {label}
      {checkbox && (
        <>
          <input type="checkbox" checked={checkbox.checked} onChange={(e) => checkbox.onChange(e.target.checked)} />
          <span className="text-xs text-gray-500">{checkbox.label}</span>
        </>
      )}
    </label>
    {!hide && (
      <div className="flex gap-2 mt-1">
        <select value={month} onChange={(e) => onMonthChange(e.target.value)} className="w-1/2 border rounded-lg px-2 py-1.5">
          <option value="">{label}</option>
          {months.map((m, i) => (
            <option key={m} value={m}>{monthLabels[i]}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => onYearChange(e.target.value)} className="w-1/2 border rounded-lg px-2 py-1.5">
          <option value="">{label}</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    )}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const generateJob = () => ({
  id: crypto.randomUUID(),
  functie: "",
  bedrijf: "",
  stad: "",
  startMaand: "",
  startJaar: "",
  eindMaand: "",
  eindJaar: "",
  werktHier: false,
  beschrijving: "",
});

export default WorkExperience;
