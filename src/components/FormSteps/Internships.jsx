import { useMemo, useState, useCallback, useEffect } from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { GripVertical } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

const defaultInternship = () => ({
  id: crypto.randomUUID(),
  functie: "",
  bedrijf: "",
  stad: "",
  startMaand: "",
  startJaar: "",
  eindMaand: "",
  eindJaar: "",
  heden: false,
  beschrijving: "",
});

function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
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
        cursor: "grab",
      }}
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </motion.div>
  );
}

function Internships({ value = [], onChange }) {
  const { t } = useTranslation();
  const months = useMemo(() => t("months", { returnObjects: true }), [t]);
  const [errors, setErrors] = useState({});

  const internships = useMemo(() => (
    value.length > 0 ? value : [defaultInternship()]
  ), [value]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateField = useCallback((id, field, val) => {
    const updated = internships.map((i) =>
      i.id === id ? { ...i, [field]: val } : i
    );
    onChange(updated);
    validateDates(id, updated.find((i) => i.id === id));
  }, [internships, onChange]);

  const validateDates = useCallback((id, item) => {
    const err = {};
    if (!item.heden && item.startJaar && item.eindJaar) {
      const start = new Date(`${item.startMaand || "January"} 1, ${item.startJaar}`);
      const end = new Date(`${item.eindMaand || "December"} 1, ${item.eindJaar}`);
      if (start > end) err.date = t("startBeforeEnd");
    }
    setErrors((prev) => ({ ...prev, [id]: err }));
  }, [t]);

  const addItem = useCallback(() => {
    onChange([...internships, defaultInternship()]);
  }, [internships, onChange]);

  const removeItem = useCallback((id) => {
    const updated = internships.filter((i) => i.id !== id);
    onChange(updated.length > 0 ? updated : [defaultInternship()]);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }, [internships, onChange]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = internships.findIndex((i) => i.id === active.id);
      const newIndex = internships.findIndex((i) => i.id === over.id);
      onChange(arrayMove(internships, oldIndex, newIndex));
    }
  }, [internships, onChange]);

  return (
    <div className="max-w-2xl w-full space-y-6 px-4 font-[Poppins] text-sm">
      <h2 className="text-xl sm:text-2xl font-semibold">{t("internships")}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={internships.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {internships.map((item) => {
              const err = errors[item.id] || {};
              return (
                <SortableItem key={item.id} id={item.id}>
                  {({ dragHandleProps }) => (
                    <div className="relative bg-white shadow-sm border rounded-xl p-6 space-y-4">
                      {internships.length > 1 && (
                        <div
                          className="absolute top-3 right-3 text-gray-400 cursor-grab group"
                          {...dragHandleProps}
                          title={t("dragToReorder")}
                        >
                          <GripVertical size={16} />
                          <div className="absolute right-0 mt-1 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            {t("dragToReorder")}
                          </div>
                        </div>
                      )}

                      {/* Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label={t("jobTitle")} value={item.functie} onChange={(val) => updateField(item.id, "functie", val)} />
                        <Input label={t("company")} value={item.bedrijf} onChange={(val) => updateField(item.id, "bedrijf", val)} />
                        <Input label={t("cityField")} value={item.stad} onChange={(val) => updateField(item.id, "stad", val)} />
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DateRange
                          id={item.id}
                          item={item}
                          months={months}
                          years={years}
                          onChange={updateField}
                          error={err.date}
                          t={t}
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-sm font-medium">{t("description")}</label>
                        <textarea
                          value={item.beschrijving}
                          onChange={(e) => updateField(item.id, "beschrijving", e.target.value)}
                          className="w-full border rounded-lg px-4 py-2 resize-none"
                          rows={3}
                        />
                      </div>

                      {internships.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
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

      <button
        onClick={addItem}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        + {t("addInternship")}
      </button>
    </div>
  );
}

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-sm font-medium">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border rounded-lg px-4 py-2"
    />
  </div>
);

const DateRange = ({ id, item, months, years, onChange, error, t }) => (
  <>
    <div>
      <label className="text-sm font-medium">{t("startDate")}</label>
      <div className="flex gap-2 mt-1">
        <select
          value={item.startMaand}
          onChange={(e) => onChange(id, "startMaand", e.target.value)}
          className="w-1/2 border rounded-lg px-3 py-2"
        >
          <option value="">{t("month")}</option>
          {months.map((m, i) => <option key={i} value={m}>{m}</option>)}
        </select>
        <select
          value={item.startJaar}
          onChange={(e) => onChange(id, "startJaar", e.target.value)}
          className="w-1/2 border rounded-lg px-3 py-2"
        >
          <option value="">{t("year")}</option>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
    </div>

    <div>
      <label className="text-sm font-medium flex items-center gap-2">
        {t("endDate")}
        <input
          type="checkbox"
          checked={item.heden}
          onChange={(e) => onChange(id, "heden", e.target.checked)}
        />
        <span className="text-xs text-gray-500">{t("current")}</span>
      </label>

      {!item.heden && (
        <div className="flex gap-2 mt-2">
          <select
            value={item.eindMaand}
            onChange={(e) => onChange(id, "eindMaand", e.target.value)}
            className="w-1/2 border rounded-lg px-3 py-2"
          >
            <option value="">{t("month")}</option>
            {months.map((m, i) => <option key={i} value={m}>{m}</option>)}
          </select>
          <select
            value={item.eindJaar}
            onChange={(e) => onChange(id, "eindJaar", e.target.value)}
            className="w-1/2 border rounded-lg px-3 py-2"
          >
            <option value="">{t("year")}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  </>
);

export default Internships;
