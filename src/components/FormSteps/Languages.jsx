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

const defaultLanguage = () => ({
  id: crypto.randomUUID(),
  naam: "",
  niveau: "",
});

const SortableItem = ({ id, children }) => {
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
      transition={{ duration: 0.2 }}
    >
      {children({ dragHandleProps: { ...attributes, ...listeners } })}
    </motion.div>
  );
};

function Languages({ value = [], onChange }) {
  const { t } = useTranslation();
  const [languages, setLanguagesState] = useState([]);

  useEffect(() => {
    setLanguagesState(Array.isArray(value) ? value : []);
  }, [value]);

  const setLanguages = useCallback((next) => {
    const resolved = typeof next === "function" ? next(languages) : next;
    if (!Array.isArray(resolved)) return;

    const clean = resolved.map((l) => ({
      id: l?.id || crypto.randomUUID(),
      naam: l?.naam || "",
      niveau: l?.niveau || "",
    }));

    setLanguagesState(clean);
    onChange?.(clean.filter((l) => l.naam?.trim() !== ""));
  }, [languages, onChange]);

  const updateField = useCallback((id, field, value) => {
    setLanguages((prev) =>
      prev.map((lang) =>
        lang.id === id ? { ...lang, [field]: value } : lang
      )
    );
  }, [setLanguages]);

  const addLanguage = useCallback(() => {
    setLanguages((prev) => [...prev, defaultLanguage()]);
  }, [setLanguages]);

  const removeLanguage = useCallback((id) => {
    setLanguages((prev) => prev.filter((l) => l.id !== id));
  }, [setLanguages]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = languages.findIndex((l) => l.id === active.id);
      const newIndex = languages.findIndex((l) => l.id === over.id);
      setLanguages((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }, [languages, setLanguages]);

  const handleSuggestionClick = useCallback((suggestion) => {
    const exists = languages.some(
      (lang) => lang.naam?.toLowerCase() === suggestion.toLowerCase()
    );
    if (!exists) {
      setLanguages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), naam: suggestion, niveau: "" },
      ]);
    }
  }, [languages, setLanguages]);

  const suggestions = useMemo(() => (
    ["dutch", "english", "french", "german", "spanish"]
      .map((key) => t(`languageSuggestionList.${key}`))
  ), [t]);

  const unusedSuggestions = useMemo(() =>
    suggestions.filter(
      (s) =>
        !languages.some(
          (l) => l.naam?.toLowerCase() === s.toLowerCase()
        )
    ), [languages, suggestions]);

  const levelKeys = ["beginner", "fair", "good", "fluent", "native"];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("languages")}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={languages.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {languages.map((lang) => (
              <SortableItem key={lang.id} id={lang.id}>
                {({ dragHandleProps }) => (
                  <div className="relative bg-white border shadow-sm rounded-xl p-4 space-y-4">
                    {languages.length > 1 && (
                      <div
                        {...dragHandleProps}
                        className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 group"
                        title={t("dragToReorder")}
                      >
                        <GripVertical size={16} />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm">{t("language")}</label>
                        <input
                          type="text"
                          value={lang.naam}
                          onChange={(e) => updateField(lang.id, "naam", e.target.value)}
                          className="w-full border rounded-lg px-4 py-2"
                          placeholder={t("languagePlaceholder")}
                        />
                      </div>
                      <div>
                        <label className="text-sm">{t("languageLevel")}</label>
                        <select
                          value={lang.niveau}
                          onChange={(e) => updateField(lang.id, "niveau", e.target.value)}
                          className="w-full border rounded-lg px-4 py-2"
                        >
                          <option value="">{t("selectLevel")}</option>
                          {levelKeys.map((key) => (
                            <option key={key} value={t(`languageLevels.${key}`)}>
                              {t(`languageLevels.${key}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {languages.length > 1 && (
                      <button
                        onClick={() => removeLanguage(lang.id)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        {t("remove")}
                      </button>
                    )}
                  </div>
                )}
              </SortableItem>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      <button onClick={addLanguage} className="text-sm text-blue-600 hover:underline">
        + {t("addLanguage")}
      </button>

      {unusedSuggestions.length > 0 && (
        <div>
          <h3 className="text-sm text-gray-500 mb-2 mt-4">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition"
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
