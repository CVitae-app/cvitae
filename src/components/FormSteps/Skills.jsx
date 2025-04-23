import React, { useCallback, useMemo, useEffect, useState } from "react";
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../contexts/LanguageContext";

const MAX_SKILLS = 5;
const defaultSkill = () => ({ id: crypto.randomUUID(), naam: "", niveau: "" });

const SortableItem = React.memo(({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

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
      transition={{ duration: 0.2 }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </motion.div>
  );
});

function Skills({ value = [], onChange }) {
  const { t } = useTranslation();
  const [skills, setSkillsState] = useState([]);

  useEffect(() => {
    const initialized = (Array.isArray(value) ? value : []).map((s) => ({
      ...s,
      id: s.id || crypto.randomUUID(),
    }));
    setSkillsState(initialized);
  }, [value]);

  const setSkills = useCallback((next) => {
    const resolved = typeof next === "function" ? next(skills) : next;
    setSkillsState(resolved);
    onChange?.(resolved.filter((s) => s.naam?.trim()));
  }, [skills, onChange]);

  const suggestions = useMemo(() => {
    const list = t("skillSuggestions", { returnObjects: true });
    return Array.isArray(list) ? list : [];
  }, [t]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateField = useCallback((id, field, value) => {
    setSkills((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  }, [setSkills]);

  const addSkill = useCallback(() => {
    setSkills((prev) => [...prev, defaultSkill()]);
  }, [setSkills]);

  const removeSkill = useCallback((id) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
  }, [setSkills]);

  const handleSuggestionClick = useCallback((suggestion) => {
    const exists = skills.some(
      (s) => s.naam.toLowerCase() === suggestion.toLowerCase()
    );
    if (!exists && skills.length < MAX_SKILLS) {
      setSkills((prev) => [...prev, { id: crypto.randomUUID(), naam: suggestion, niveau: "" }]);
    }
  }, [skills, setSkills]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = skills.findIndex((s) => s.id === active.id);
      const newIndex = skills.findIndex((s) => s.id === over.id);
      setSkills((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }, [skills, setSkills]);

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("skills")}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {skills.map((skill) => (
              <SortableItem key={skill.id} id={skill.id}>
                {({ dragHandleProps }) => (
                  <div className="relative bg-white shadow-sm border rounded-xl p-4 space-y-4">
                    <div
                      {...dragHandleProps}
                      className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 group"
                      title={t("dragToReorder")}
                    >
                      <GripVertical size={16} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm">{t("skill")}</label>
                        <input
                          type="text"
                          value={skill.naam}
                          onChange={(e) => updateField(skill.id, "naam", e.target.value)}
                          className="w-full border rounded-lg px-4 py-2"
                          placeholder={t("skillPlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="text-sm">{t("level")}</label>
                        <select
                          value={skill.niveau}
                          onChange={(e) => updateField(skill.id, "niveau", e.target.value)}
                          className="w-full border rounded-lg px-4 py-2"
                        >
                          <option value="">{t("selectLevel")}</option>
                          {["beginner", "fair", "good", "veryGood", "excellent"].map((key) => (
                            <option key={key} value={t(`languageLevels.${key}`)}>
                              {t(`languageLevels.${key}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="text-left">
                      <button
                        onClick={() => removeSkill(skill.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        {t("remove")}
                      </button>
                    </div>
                  </div>
                )}
              </SortableItem>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {skills.length < MAX_SKILLS && (
        <button onClick={addSkill} className="text-sm text-blue-600 hover:underline">
          + {t("addSkill")}
        </button>
      )}

      <div>
        <h3 className="text-sm text-gray-500 mb-2 mt-4">{t("suggestions")}</h3>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => {
            const exists = skills.some((skill) => skill.naam.toLowerCase() === s.toLowerCase());
            const isDisabled = exists || skills.length >= MAX_SKILLS;

            return (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                disabled={isDisabled}
                className={`text-xs px-3 py-1 rounded-full transition border
                  ${isDisabled
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                  }`}
              >
                + {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Skills;
