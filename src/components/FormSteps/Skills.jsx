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
import { XMarkIcon } from "@heroicons/react/24/outline";
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
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const initialized = (Array.isArray(value) ? value : []).map((s) => ({
      ...s,
      id: s.id || crypto.randomUUID(),
    }));
    setSkillsState(initialized);
  }, [value]);

  useEffect(() => {
    onChange?.(skills.filter((s) => s.naam?.trim()));
  }, [skills, onChange]);

  const setSkills = useCallback((next) => {
    const resolved = typeof next === "function" ? next(skills) : next;
    setSkillsState(resolved);
  }, [skills]);

  const suggestions = useMemo(() => {
    const list = t("skillSuggestions", { returnObjects: true });
    return Array.isArray(list) ? list : [];
  }, [t]);

  const filteredSuggestions = useMemo(
    () => suggestions.filter((s) => !skills.some((skill) => skill.naam.toLowerCase() === s.toLowerCase())),
    [suggestions, skills]
  );

  const addSkill = useCallback((val) => {
    const trimmed = val.trim();
    if (!trimmed) return setError(t("requiredField"));
    if (skills.some((s) => s.naam.toLowerCase() === trimmed.toLowerCase())) {
      return setError(t("duplicateValue"));
    }
    if (skills.length >= MAX_SKILLS) {
      return setError(t("maxSkillsReached"));
    }
    setSkills((prev) => [...prev, { id: crypto.randomUUID(), naam: trimmed, niveau: "" }]);
    setInput("");
    setError("");
  }, [skills, t, setSkills]);

  const removeSkill = useCallback((id) => {
    setSkills((prev) => prev.filter((s) => s.id !== id));
    if (error) setError("");
  }, [error]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill(input);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (error) setError("");
  };

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
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("skillPlaceholder")}
          disabled={skills.length >= MAX_SKILLS}
          className={`flex-1 border rounded-xl px-4 py-2 transition ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={() => addSkill(input)}
          disabled={skills.length >= MAX_SKILLS}
          className={`px-4 py-2 rounded-xl text-white transition ${
            skills.length >= MAX_SKILLS
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {t("addSkill")}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <DndContext sensors={useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))} 
                  collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={skills.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {skills.map((skill) => (
              <SortableItem key={skill.id} id={skill.id}>
                {({ dragHandleProps }) => (
                  <div className="relative bg-white shadow-sm border rounded-xl p-4 space-y-4">
                    <div {...dragHandleProps} className="absolute top-2 right-2">
                      <GripVertical size={16} className="text-gray-300 hover:text-gray-500" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{skill.naam}</span>
                      <XMarkIcon
                        onClick={() => removeSkill(skill.id)}
                        className="w-4 h-4 text-gray-500 cursor-pointer hover:text-red-500"
                      />
                    </div>
                  </div>
                )}
              </SortableItem>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {filteredSuggestions.length > 0 && skills.length < MAX_SKILLS && (
        <div className="mt-4">
          <h3 className="text-sm text-gray-500">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => addSkill(s)}
                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Skills;
