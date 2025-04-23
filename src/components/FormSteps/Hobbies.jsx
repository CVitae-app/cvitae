import { useState, useEffect, useCallback, useMemo } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../../contexts/LanguageContext";

const MAX_HOBBIES = 5;

function Hobbies({ value = [], onChange }) {
  const { t } = useTranslation();

  const [hobbies, setHobbies] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setHobbies(Array.isArray(value) ? value : []);
  }, [value]);

  useEffect(() => {
    onChange?.(hobbies);
  }, [hobbies]);

  const suggestions = useMemo(() => {
    const list = t("hobbySuggestions", { returnObjects: true });
    return Array.isArray(list) ? list : [];
  }, [t]);

  const isMaxReached = hobbies.length >= MAX_HOBBIES;

  const addHobby = useCallback((val) => {
    const trimmed = val.trim();
    if (!trimmed) return setError(t("requiredField"));
    if (hobbies.some((h) => h.toLowerCase() === trimmed.toLowerCase())) {
      return setError(t("duplicateValue"));
    }
    if (hobbies.length >= MAX_HOBBIES) {
      return setError(t("maxHobbiesReached"));
    }

    setHobbies((prev) => [...prev, trimmed]);
    setInput("");
    setError("");
  }, [hobbies, t]);

  const removeHobby = useCallback((val) => {
    setHobbies((prev) => prev.filter((h) => h !== val));
    if (error) setError("");
  }, [error]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addHobby(input);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (error) setError("");
  };

  const filteredSuggestions = useMemo(() =>
    suggestions.filter(
      (s) => !hobbies.some((h) => h.toLowerCase() === s.toLowerCase())
    ), [suggestions, hobbies]);

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("hobbies")}</h2>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("hobbyPlaceholder")}
          disabled={isMaxReached}
          className={`flex-1 border rounded-xl px-4 py-2 transition ${
            error ? "border-red-500" : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={() => addHobby(input)}
          disabled={isMaxReached}
          className={`px-4 py-2 rounded-xl text-white transition ${
            isMaxReached
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {t("addHobby")}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <AnimatePresence mode="popLayout">
        {hobbies.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {hobbies.map((hobby) => (
              <motion.span
                key={hobby}
                className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
                layout
              >
                {hobby}
                <XMarkIcon
                  onClick={() => removeHobby(hobby)}
                  className="w-4 h-4 ml-2 cursor-pointer hover:text-red-500"
                />
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {!isMaxReached && filteredSuggestions.length > 0 && (
        <div>
          <h3 className="text-sm text-gray-500 mb-2 mt-4">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2">
            {filteredSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => addHobby(s)}
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

export default Hobbies;
