import { useMemo, useCallback } from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { GripVertical } from "lucide-react";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

const defaultCourse = () => ({
  id: crypto.randomUUID(),
  titel: "",
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
};

function Courses({ value = [], onChange }) {
  const { t } = useTranslation();
  const months = t("months", { returnObjects: true });

  const courses = useMemo(() => (
    value.length > 0 ? value : [defaultCourse()]
  ), [value]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleChange = useCallback((id, field, val) => {
    const updated = courses.map((course) =>
      course.id === id ? { ...course, [field]: val } : course
    );

    // Prevent invalid end date
    const target = updated.find((c) => c.id === id);
    if (!target.heden && target.startJaar && target.eindJaar) {
      const start = new Date(`${target.startMaand || "January"} 1, ${target.startJaar}`);
      const end = new Date(`${target.eindMaand || "December"} 1, ${target.eindJaar}`);
      if (start > end) return; // block invalid state
    }

    onChange(updated);
  }, [courses, onChange]);

  const handleAdd = useCallback(() => {
    onChange([...courses, defaultCourse()]);
  }, [courses, onChange]);

  const handleRemove = useCallback((id) => {
    const updated = courses.filter((course) => course.id !== id);
    onChange(updated.length > 0 ? updated : [defaultCourse()]);
  }, [courses, onChange]);

  const handleDragEnd = useCallback(({ active, over }) => {
    if (active.id !== over?.id) {
      const oldIndex = courses.findIndex((i) => i.id === active.id);
      const newIndex = courses.findIndex((i) => i.id === over.id);
      onChange(arrayMove(courses, oldIndex, newIndex));
    }
  }, [courses, onChange]);

  const courseList = useMemo(() => (
    courses.map((course) => (
      <SortableItem key={course.id} id={course.id}>
        {({ dragHandleProps }) => (
          <div className="relative bg-white border rounded-xl p-4 sm:p-5 space-y-4 shadow-sm">
            {courses.length > 1 && (
              <div
                className="absolute top-3 right-3 text-gray-400 cursor-grab group"
                {...dragHandleProps}
              >
                <GripVertical size={16} />
                <span className="absolute right-0 mt-1 text-xs bg-black text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                  {t("dragToReorder")}
                </span>
              </div>
            )}

            <div>
              <label className="text-xs font-medium">{t("courseTitle")}</label>
              <input
                type="text"
                value={course.titel}
                onChange={(e) => handleChange(course.id, "titel", e.target.value)}
                className="w-full border rounded-lg px-3 py-1.5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium">{t("startDate")}</label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={course.startMaand}
                    onChange={(e) => handleChange(course.id, "startMaand", e.target.value)}
                    className="w-1/2 border rounded-lg px-2 py-1.5"
                  >
                    <option value="">{t("month")}</option>
                    {months.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={course.startJaar}
                    onChange={(e) => handleChange(course.id, "startJaar", e.target.value)}
                    className="w-1/2 border rounded-lg px-2 py-1.5"
                  >
                    <option value="">{t("year")}</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium flex items-center gap-2">
                  {t("endDate")}
                  <input
                    type="checkbox"
                    checked={course.heden}
                    onChange={(e) => handleChange(course.id, "heden", e.target.checked)}
                  />
                  <span className="text-xs text-gray-500">{t("current")}</span>
                </label>
                {!course.heden && (
                  <div className="flex gap-2 mt-1">
                    <select
                      value={course.eindMaand}
                      onChange={(e) => handleChange(course.id, "eindMaand", e.target.value)}
                      className="w-1/2 border rounded-lg px-2 py-1.5"
                    >
                      <option value="">{t("month")}</option>
                      {months.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <select
                      value={course.eindJaar}
                      onChange={(e) => handleChange(course.id, "eindJaar", e.target.value)}
                      className="w-1/2 border rounded-lg px-2 py-1.5"
                    >
                      <option value="">{t("year")}</option>
                      {years.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium">{t("description")}</label>
              <textarea
                value={course.beschrijving}
                onChange={(e) => handleChange(course.id, "beschrijving", e.target.value)}
                className="w-full border rounded-lg px-3 py-2 resize-none text-sm"
                rows={3}
              />
            </div>

            {courses.length > 1 && (
              <button
                onClick={() => handleRemove(course.id)}
                className="text-red-500 text-xs hover:underline"
              >
                {t("remove")}
              </button>
            )}
          </div>
        )}
      </SortableItem>
    ))
  ), [courses, handleChange, handleRemove, t, months]);

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("courses")}</h2>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={courses.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>{courseList}</AnimatePresence>
        </SortableContext>
      </DndContext>

      <button
        onClick={handleAdd}
        className="mt-2 text-sm text-blue-600 hover:underline"
      >
        + {t("addCourse")}
      </button>
    </div>
  );
}

export default Courses;
