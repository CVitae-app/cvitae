import { useEffect, useState, useMemo, useCallback } from "react";
import { GripVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
} from "@dnd-kit/core";
import {
  arrayMove,
  useSortable,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "../../contexts/LanguageContext";

const MAX_LANGUAGES = 5;
const defaultLanguage = () => ({ id: crypto.randomUUID(), naam: "", niveau: "" });

const SortableItem = ({ id, children }) => {
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
};

function Languages({ value = [], onChange }) {
  const { t } = useTranslation();
  const [languages, setLanguagesState] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setLanguagesState(Array.isArray(value) ? value : []);
  }, [value]);

  useEffect(() => {
    onChange?.(languages.filter((l) => l.naam.trim() !== ""));
  }, [languages, onChange]);

  const setLanguages = useCallback((next) => {
    const resolved = typeof next === "function" ? next(languages) : next;
    setLanguagesState(resolved);
  }, [languages]);

  const addLanguage = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return setError(t("requiredField"));
    if (languages.some((l) => l.naam.toLowerCase() === trimmed.toLowerCase())) {
      return setError(t("duplicateValue"));
    }
    if (languages.length >= MAX_LANGUAGES) {
      return setError(t("maxLanguagesReached"));
    }
    setLanguages([...languages, { id: crypto.randomUUID(), naam: trimmed, niveau: "" }]);
    setInput("");
    setError("");
  }, [input, languages, setLanguages, t]);

  const removeLanguage = useCallback((id) => {
    setLanguages((prev) => prev.filter((l) => l.id !== id));
  }, [setLanguages]);

  const updateField = useCallback((id, field, value) => {
    setLanguages((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }, [setLanguages]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = languages.findIndex((l) => l.id === active.id);
      const newIndex = languages.findIndex((l) => l.id === over.id);
      setLanguages((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }, [languages, setLanguages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (error) setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLanguage();
    }
  };

  const suggestions = useMemo(() => (
    ["dutch", "english", "french", "german", "spanish"]
      .map((key) => t(`languageSuggestionList.${key}`))
  ), [t]);

  const unusedSuggestions = useMemo(() =>
    suggestions.filter(
      (s) => !languages.some((l) => l.naam.toLowerCase() === s.toLowerCase())
    ), [languages, suggestions]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("languages")}</h2>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("languagePlaceholder")}
          className={`flex-1 border rounded-lg px-4 py-2 transition ${error ? "border-red-500" : "border-gray-300"}`}
        />
        <button
          type="button"
          onClick={addLanguage}
          disabled={languages.length >= MAX_LANGUAGES}
          className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
        >
          {t("addLanguage")}
        </button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={languages.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {languages.map((lang) => (
              <SortableItem key={lang.id} id={lang.id}>
                {({ dragHandleProps }) => (
                  <div className="relative bg-white border shadow-sm rounded-xl p-4 space-y-2">
                    <div {...dragHandleProps} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">
                      <GripVertical size={16} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={lang.naam}
                        onChange={(e) => updateField(lang.id, "naam", e.target.value)}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder={t("languagePlaceholder")}
                      />
                      <select
                        value={lang.niveau}
                        onChange={(e) => updateField(lang.id, "niveau", e.target.value)}
                        className="w-full border rounded-lg px-4 py-2"
                      >
                        <option value="">{t("selectLevel")}</option>
                        {["beginner", "fair", "good", "fluent", "native"].map((key) => (
                          <option key={key} value={t(`languageLevels.${key}`)}>
                            {t(`languageLevels.${key}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button onClick={() => removeLanguage(lang.id)} className="text-red-500 text-sm">
                      {t("remove")}
                    </button>
                  </div>
                )}
              </SortableItem>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {unusedSuggestions.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm text-gray-500">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {unusedSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => addLanguage(s)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition"
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

export default Languages;
