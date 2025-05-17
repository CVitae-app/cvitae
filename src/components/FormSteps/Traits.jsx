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
  const [traits, setTraits] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTraits(Array.isArray(value) ? value : []);
  }, [value]);

  useEffect(() => {
    onChange?.(traits);
  }, [traits, onChange]);

  const addTrait = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return setError(t("requiredField"));
    if (traits.some((t) => t.naam.toLowerCase() === trimmed.toLowerCase())) {
      return setError(t("duplicateValue"));
    }
    if (traits.length >= MAX_TRAITS) {
      return setError(t("maxTraitsReached"));
    }
    setTraits((prev) => [...prev, { id: crypto.randomUUID(), naam: trimmed }]);
    setInput("");
    setError("");
  }, [traits, input, t]);

  const removeTrait = useCallback((id) => {
    setTraits((prev) => prev.filter((t) => t.id !== id));
    if (error) setError("");
  }, [error]);

  const updateTrait = useCallback((id, value) => {
    setTraits((prev) =>
      prev.map((t) => (t.id === id ? { ...t, naam: value } : t))
    );
  }, []);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (error) setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTrait();
    }
  };

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = traits.findIndex((t) => t.id === active.id);
      const newIndex = traits.findIndex((t) => t.id === over.id);
      setTraits((prev) => arrayMove(prev, oldIndex, newIndex));
    }
  }, [traits]);

  const suggestions = useMemo(() => {
    const list = t("traitSuggestions", { returnObjects: true });
    return Array.isArray(list) ? list : [];
  }, [t]);

  const filteredSuggestions = useMemo(
    () => suggestions.filter((s) => !traits.some((t) => t.naam.toLowerCase() === s.toLowerCase())),
    [suggestions, traits]
  );

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("traits")}</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("traitPlaceholder")}
          className={`flex-1 border rounded-lg px-4 py-2 transition ${error ? "border-red-500" : "border-gray-300"}`}
          disabled={traits.length >= MAX_TRAITS}
        />
        <button
          type="button"
          onClick={addTrait}
          disabled={traits.length >= MAX_TRAITS}
          className={`px-4 py-2 rounded-lg text-white transition ${
            traits.length >= MAX_TRAITS
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {t("addTrait")}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <DndContext sensors={useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))} 
                  collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={traits.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {traits.map((trait) => (
              <SortableItem key={trait.id} id={trait.id}>
                {({ dragHandleProps }) => (
                  <div className="relative bg-white shadow-sm border rounded-xl p-4 space-y-3">
                    <div {...dragHandleProps} className="absolute top-2 right-2 text-gray-300 hover:text-gray-500">
                      <GripVertical size={16} />
                    </div>
                    <input
                      type="text"
                      value={trait.naam}
                      onChange={(e) => updateTrait(trait.id, e.target.value)}
                      className="w-full border rounded-lg px-4 py-2"
                      placeholder={t("traitPlaceholder")}
                    />
                    <button
                      onClick={() => removeTrait(trait.id)}
                      className="text-red-500 text-sm hover:underline"
                    >
                      {t("remove")}
                    </button>
                  </div>
                )}
              </SortableItem>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {filteredSuggestions.length > 0 && traits.length < MAX_TRAITS && (
        <div>
          <h3 className="text-sm text-gray-500 mb-2 mt-4">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => addTrait(s)}
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

export default Traits;
