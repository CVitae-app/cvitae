import React, { useEffect, useState, useCallback, useMemo } from "react";
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

const MAX_TRAITS = 5;
const defaultTrait = () => ({ id: crypto.randomUUID(), naam: "" });

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

function Traits({ value = [], onChange }) {
  const { t } = useTranslation();
  const [traits, setTraitsState] = useState([]);

  useEffect(() => {
    setTraitsState(Array.isArray(value) ? value : []);
  }, [value]);

  const setTraits = useCallback((updater) => {
    setTraitsState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      const clean = Array.isArray(next) ? next.map(t => ({
        id: t?.id || crypto.randomUUID(),
        naam: t?.naam || "",
      })) : [];
      onChange?.(clean.filter((t) => t.naam.trim() !== ""));
      return clean;
    });
  }, [onChange]);

  const updateField = useCallback((id, value) => {
    setTraits((prev) =>
      prev.map((s) => (s.id === id ? { ...s, naam: value } : s))
    );
  }, [setTraits]);

  const addTrait = useCallback(() => {
    setTraits((prev) =>
      prev.length < MAX_TRAITS ? [...prev, defaultTrait()] : prev
    );
  }, [setTraits]);

  const removeTrait = useCallback((id) => {
    setTraits((prev) => prev.filter((s) => s.id !== id));
  }, [setTraits]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setTraits((prev) => {
      const exists = prev.some((s) => s.naam.toLowerCase() === suggestion.toLowerCase());
      return !exists && prev.length < MAX_TRAITS
        ? [...prev, { id: crypto.randomUUID(), naam: suggestion }]
        : prev;
    });
  }, [setTraits]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      setTraits((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }, [setTraits]);

  const suggestions = useMemo(() => {
    const list = t("traitSuggestions", { returnObjects: true });
    return Array.isArray(list) ? list : [];
  }, [t]);

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("traits")}</h2>

      <DndContext sensors={useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
      )} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={traits.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {traits.map((trait) => (
              <SortableItem key={trait.id} id={trait.id}>
                {({ dragHandleProps }) => (
                  <div className="relative bg-white shadow-sm border rounded-xl p-4 space-y-3">
                    <div
                      {...dragHandleProps}
                      className="absolute top-2 right-2 text-gray-300 hover:text-gray-500 group"
                      title={t("dragToReorder")}
                    >
                      <GripVertical size={16} />
                    </div>

                    <div>
                      <label className="text-sm">{t("trait")}</label>
                      <input
                        type="text"
                        value={trait.naam}
                        onChange={(e) => updateField(trait.id, e.target.value)}
                        className="w-full border rounded-lg px-4 py-2"
                        placeholder={t("traitPlaceholder")}
                      />
                    </div>

                    <div className="text-right">
                      <button
                        onClick={() => removeTrait(trait.id)}
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

      {traits.length < MAX_TRAITS && (
        <button onClick={addTrait} className="text-sm text-blue-600 hover:underline">
          + {t("addTrait")}
        </button>
      )}

      {suggestions.length > 0 && (
        <div>
          <h3 className="text-sm text-gray-500 mb-2 mt-4">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => {
              const exists = traits.some((t) => t.naam.toLowerCase() === s.toLowerCase());
              const isDisabled = exists || traits.length >= MAX_TRAITS;

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
      )}
    </div>
  );
}

export default Traits;
