import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../utils/supabaseClient";
import {
  DndContext,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

const defaultEducation = () => ({
  id: crypto.randomUUID(),
  opleiding: "",
  instituut: "",
  stad: "",
  startMaand: "",
  startJaar: "",
  eindMaand: "",
  eindJaar: "",
  heden: false,
  beschrijving: "",
});

const SortableItem = ({ id, children }) => {
  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
      }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </motion.div>
  );
};

function Education({ value = [], onChange }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const months = t("months", { returnObjects: true });

  const [educations, setEducations] = useState(() =>
    value.length > 0 ? value : [defaultEducation()]
  );
  const [errors, setErrors] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    onChange?.(educations);
    const id = localStorage.getItem("currentCVId");
    if (!id) return;
    const updatedData = JSON.parse(localStorage.getItem("formData")) || {};
    updatedData.education = educations;
    localStorage.setItem("formData", JSON.stringify(updatedData));
    if (user) {
      supabase.from("cvs").upsert({
        id,
        user_id: user.id,
        data: updatedData,
        updated_at: new Date().toISOString(),
      });
    }
  }, [educations, user]);

  const validate = useCallback((id, edu) => {
    const err = {};
    if (!edu.opleiding?.trim()) err.opleiding = t("requiredField");
    if (!edu.instituut?.trim()) err.instituut = t("requiredField");
    if (!edu.startMaand || !edu.startJaar) err.start = t("startDateRequired");

    if (
      !edu.heden &&
      edu.startMaand &&
      edu.startJaar &&
      edu.eindMaand &&
      edu.eindJaar
    ) {
      const start = new Date(`${edu.startMaand} 1, ${edu.startJaar}`);
      const end = new Date(`${edu.eindMaand} 1, ${edu.eindJaar}`);
      if (start > end) err.date = t("startBeforeEnd");
    }

    setErrors((prev) => ({ ...prev, [id]: err }));
  }, [t]);

  const updateField = useCallback((id, field, val) => {
    setEducations((prev) => {
      const updated = prev.map((e) => e.id === id ? { ...e, [field]: val } : e);
      const edu = updated.find((e) => e.id === id);
      validate(id, edu);
      return updated;
    });
  }, [validate]);

  const addEducation = useCallback(() => {
    setEducations((prev) => [...prev, defaultEducation()]);
  }, []);

  const removeEducation = useCallback((id) => {
    setEducations((prev) => prev.filter((e) => e.id !== id));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, []);

  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = educations.findIndex((e) => e.id === active.id);
      const newIndex = educations.findIndex((e) => e.id === over.id);
      setEducations(arrayMove(educations, oldIndex, newIndex));
    }
  };

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("education")}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={educations.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {educations.map((edu) => {
              const err = errors[edu.id] || {};
              return (
                <SortableItem key={edu.id} id={edu.id}>
                  {({ dragHandleProps }) => (
                    <div className="relative bg-white shadow-sm border rounded-xl p-6 space-y-4">
                      {educations.length > 1 && (
                        <div
                          {...dragHandleProps}
                          className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 cursor-grab group"
                          title={t("dragToReorder")}
                        >
                          <GripVertical size={16} />
                          <div className="absolute right-0 mt-1 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            {t("dragToReorder")}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InputField
                          label={t("educationTitle")}
                          value={edu.opleiding}
                          onChange={(val) => updateField(edu.id, "opleiding", val)}
                          error={err.opleiding}
                        />
                        <InputField
                          label={t("institute")}
                          value={edu.instituut}
                          onChange={(val) => updateField(edu.id, "instituut", val)}
                          error={err.instituut}
                        />
                        <InputField
                          label={t("cityField")}
                          value={edu.stad}
                          onChange={(val) => updateField(edu.id, "stad", val)}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateField
                          label={t("startDate")}
                          month={edu.startMaand}
                          year={edu.startJaar}
                          onMonthChange={(val) => updateField(edu.id, "startMaand", val)}
                          onYearChange={(val) => updateField(edu.id, "startJaar", val)}
                          months={months}
                          years={years}
                          error={err.start}
                        />

                        <DateField
                          label={t("endDate")}
                          month={edu.eindMaand}
                          year={edu.eindJaar}
                          onMonthChange={(val) => updateField(edu.id, "eindMaand", val)}
                          onYearChange={(val) => updateField(edu.id, "eindJaar", val)}
                          months={months}
                          years={years}
                          error={err.date}
                          disabled={edu.heden}
                          checkbox={{
                            checked: edu.heden,
                            onChange: (val) => updateField(edu.id, "heden", val),
                            label: t("current"),
                          }}
                        />
                      </div>

                      <div>
                        <label className="text-sm">{t("description")}</label>
                        <textarea
                          value={edu.beschrijving}
                          onChange={(e) => updateField(edu.id, "beschrijving", e.target.value)}
                          className="w-full border rounded-lg px-4 py-2 resize-none"
                          rows={3}
                        />
                      </div>

                      {educations.length > 1 && (
                        <button
                          onClick={() => removeEducation(edu.id)}
                          className="text-red-500 text-sm hover:underline"
                        >
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

      <button onClick={addEducation} className="mt-2 text-sm text-blue-600 hover:underline">
        + {t("addEducation")}
      </button>
    </div>
  );
}

const InputField = ({ label, value, onChange, error }) => (
  <div>
    <label className="text-sm">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border rounded-lg px-4 py-2 ${error ? "border-red-500" : ""}`}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);

const DateField = ({ label, month, year, onMonthChange, onYearChange, months, years, error, disabled, checkbox }) => (
  <div>
    <label className="text-sm flex items-center gap-2">
      {label}
      {checkbox && (
        <>
          <input type="checkbox" checked={checkbox.checked} onChange={(e) => checkbox.onChange(e.target.checked)} />
          <span className="text-xs text-gray-500">{checkbox.label}</span>
        </>
      )}
    </label>
    {!disabled && (
      <div className="flex gap-2 mt-1">
        <select value={month} onChange={(e) => onMonthChange(e.target.value)} className="w-1/2 border rounded-lg px-3 py-2">
          <option value="">{label}</option>
          {months.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => onYearChange(e.target.value)} className="w-1/2 border rounded-lg px-3 py-2">
          <option value="">{label}</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    )}
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

export default Education;
