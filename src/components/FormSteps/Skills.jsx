import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "../../contexts/LanguageContext";
import { AnimatePresence, motion } from "framer-motion";

const MAX_SKILLS = 5;

function Skills({ value = [], onChange }) {
  const { t } = useTranslation();
  const [skills, setSkills] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSkills(Array.isArray(value) ? value : []);
  }, [value]);

  useEffect(() => {
    onChange?.(skills);
  }, [skills, onChange]);

  const addSkill = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return setError(t("requiredField"));
    if (skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      return setError(t("duplicateValue"));
    }
    if (skills.length >= MAX_SKILLS) {
      return setError(t("maxSkillsReached"));
    }
    setSkills((prev) => [...prev, trimmed]);
    setInput("");
    setError("");
  }, [skills, input, t]);

  const removeSkill = useCallback((skill) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
    if (error) setError("");
  }, [error]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (error) setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const suggestions = useMemo(() => {
    const list = t("skillSuggestions", { returnObjects: true });
    return Array.isArray(list) ? list : [];
  }, [t]);

  const filteredSuggestions = useMemo(
    () => suggestions.filter((s) => !skills.some((sk) => sk.toLowerCase() === s.toLowerCase())),
    [suggestions, skills]
  );

  return (
    <div className="max-w-[600px] w-full space-y-6 px-3 sm:px-4 font-[Poppins] text-sm">
      <h2 className="text-lg font-semibold">{t("skills")}</h2>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t("skillPlaceholder")}
          className={`w-full border rounded-lg px-4 py-2 transition ${error ? "border-red-500" : "border-gray-300"}`}
          disabled={skills.length >= MAX_SKILLS}
        />
        <button
          type="button"
          onClick={addSkill}
          disabled={skills.length >= MAX_SKILLS}
          className={`w-full py-2 rounded-lg text-white transition ${
            skills.length >= MAX_SKILLS
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {t("addSkill")}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <AnimatePresence mode="popLayout">
        {skills.length > 0 && (
          <motion.div
            className="flex flex-wrap gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {skills.map((skill) => (
              <motion.span
                key={skill}
                className="flex items-center bg-gray-100 text-gray-800 px-3 py-1 rounded-full"
                layout
              >
                {skill}
                <button
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-red-500 hover:underline text-xs"
                >
                  {t("remove")}
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {filteredSuggestions.length > 0 && skills.length < MAX_SKILLS && (
        <div>
          <h3 className="text-sm text-gray-500 mb-2 mt-4">{t("suggestions")}</h3>
          <div className="flex flex-wrap gap-2">
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
