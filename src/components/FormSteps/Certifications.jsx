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
import React, { useMemo, useCallback, useEffect, useState } from "react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

const SortableItem = React.memo(({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </motion.div>
  );
});

const Certifications = ({ value = [], onChange }) => {
  const { t } = useTranslation();
  const months = t("months", { returnObjects: true });
  const certifications = Array.isArray(value) ? value : [];
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (certifications.length === 0) {
      onChange([
        {
          id: crypto.randomUUID(),
          titel: "",
          startMaand: "",
          startJaar: "",
          eindMaand: "",
          eindJaar: "",
          heden: false,
          beschrijving: "",
        },
      ]);
    }
  }, [certifications, onChange]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateField = useCallback(
    (id, field, val) => {
      const updated = certifications.map((item) =>
        item.id === id ? { ...item, [field]: val } : item
      );
      onChange(updated);
      validateDates(id, updated.find((i) => i.id === id));
    },
    [certifications, onChange]
  );

  const validateDates = (id, item) => {
    const err = {};
    if (!item.heden && item.startJaar && item.eindJaar) {
      const start = new Date(`${item.startMaand || "January"} 1, ${item.startJaar}`);
      const end = new Date(`${item.eindMaand || "December"} 1, ${item.eindJaar}`);
      if (start > end) err.date = t("startBeforeEnd");
    }
    setErrors((prev) => ({ ...prev, [id]: err }));
  };

  const addItem = () => {
    onChange([
      ...certifications,
      {
        id: crypto.randomUUID(),
        titel: "",
        startMaand: "",
        startJaar: "",
        eindMaand: "",
        eindJaar: "",
        heden: false,
        beschrijving: "",
      },
    ]);
  };

  const removeItem = useCallback(
    (id) => {
      onChange(certifications.filter((item) => item.id !== id));
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    },
    [certifications, onChange]
  );

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      if (active.id !== over?.id) {
        const oldIndex = certifications.findIndex((i) => i.id === active.id);
        const newIndex = certifications.findIndex((i) => i.id === over.id);
        onChange(arrayMove(certifications, oldIndex, newIndex));
      }
    },
    [certifications, onChange]
  );

  const yearOptions = useMemo(
    () => years.map((y) => <option key={y} value={y}>{y}</option>),
    []
  );
  const monthOptions = useMemo(
    () => months.map((m, i) => <option key={i} value={m}>{m}</option>),
    [months]
  );

  return (
    <div className="w-full max-w-[600px] px-3 sm:px-4 font-[Poppins] text-sm space-y-6">
      <h2 className="text-lg font-semibold">{t("certifications")}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={certifications.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {certifications.map((item) => {
              const err = errors[item.id] || {};
              return (
                <SortableItem key={item.id} id={item.id}>
                  {({ dragHandleProps }) => (
                    <div className="relative bg-white shadow-sm border rounded-xl p-4 sm:p-5 space-y-4">
                      {certifications.length > 1 && (
                        <div
                          {...dragHandleProps}
                          className="absolute top-3 right-3 text-gray-400 cursor-grab group"
                        >
                          <GripVertical size={16} />
                          <div className="absolute right-0 mt-1 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                            {t("dragToReorder")}
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-medium">{t("certificateName")}</label>
                        <input
                          type="text"
                          value={item.titel}
                          onChange={(e) => updateField(item.id, "titel", e.target.value)}
                          className="w-full border rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium">{t("startDate")}</label>
                          <div className="flex gap-2 mt-1">
                            <select
                              value={item.startMaand}
                              onChange={(e) => updateField(item.id, "startMaand", e.target.value)}
                              className="w-1/2 border rounded-lg px-2 py-1.5"
                            >
                              <option value="">{t("month")}</option>
                              {monthOptions}
                            </select>
                            <select
                              value={item.startJaar}
                              onChange={(e) => updateField(item.id, "startJaar", e.target.value)}
                              className="w-1/2 border rounded-lg px-2 py-1.5"
                            >
                              <option value="">{t("year")}</option>
                              {yearOptions}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium flex items-center gap-2">
                            {t("endDate")}
                            <input
                              type="checkbox"
                              checked={item.heden}
                              onChange={(e) => updateField(item.id, "heden", e.target.checked)}
                            />
                            <span className="text-xs text-gray-500">{t("current")}</span>
                          </label>
                          {!item.heden && (
                            <div className="flex gap-2 mt-1">
                              <select
                                value={item.eindMaand}
                                onChange={(e) => updateField(item.id, "eindMaand", e.target.value)}
                                className="w-1/2 border rounded-lg px-2 py-1.5"
                              >
                                <option value="">{t("month")}</option>
                                {monthOptions}
                              </select>
                              <select
                                value={item.eindJaar}
                                onChange={(e) => updateField(item.id, "eindJaar", e.target.value)}
                                className="w-1/2 border rounded-lg px-2 py-1.5"
                              >
                                <option value="">{t("year")}</option>
                                {yearOptions}
                              </select>
                            </div>
                          )}
                          {err.date && <p className="text-xs text-red-500 mt-1">{err.date}</p>}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-medium">{t("description")}</label>
                        <textarea
                          value={item.beschrijving}
                          onChange={(e) => updateField(item.id, "beschrijving", e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 resize-none text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
                          rows={3}
                        />
                      </div>

                      {certifications.length > 1 && (
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 text-xs hover:underline"
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
        + {t("addCertification")}
      </button>
    </div>
  );
};

export default Certifications;