import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ChevronUpDownIcon,
  PaintBrushIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "../contexts/LanguageContext";

const fonts = [
  "Poppins", "Arial", "Calibri", "Courier New", "Georgia",
  "Helvetica", "Lato", "Noto Sans", "Times New Roman"
];
const fontSizes = ["xs", "s", "m", "l", "xl"];
const lineSpacings = ["1", "1.15", "1.25", "1.5", "2"];
const defaultColors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];

const templates = [
  { id: "luna", name: "Luna", img: "/templates/luna.png" },
  { id: "athena", name: "Athena", img: "/templates/athena.png" },
  { id: "phoenix", name: "Phoenix", img: "/templates/phoenix.png" },
  { id: "orion", name: "Orion", img: "/templates/orion.png" },
  { id: "caesar", name: "Caesar", img: "/templates/caesar.png" },
  { id: "sherlock", name: "Sherlock", img: "/templates/sherlock.png" },
  { id: "gatsby", name: "Gatsby", img: "/templates/gatsby.png" },
];

function FloatingBar({ settings, onChange, onRequireAuth, onTogglePreview }) {
  const { t } = useTranslation();
  const [openDropdown, setOpenDropdown] = useState(null);

  const [template, setTemplate] = useState(settings.template);
  const [font, setFont] = useState(settings.font);
  const [fontSize, setFontSize] = useState(settings.fontSize);
  const [lineSpacing, setLineSpacing] = useState(settings.lineSpacing);
  const [themeColor, setThemeColor] = useState(settings.themeColor);

  const refs = {
    template: useRef(),
    font: useRef(),
    fontSize: useRef(),
    lineSpacing: useRef(),
    themeColor: useRef(),
  };

  useEffect(() => {
    setTemplate(settings.template);
    setFont(settings.font);
    setFontSize(settings.fontSize);
    setLineSpacing(settings.lineSpacing);
    setThemeColor(settings.themeColor);
  }, [settings]);

  useEffect(() => {
    const newConfig = { template, font, fontSize, lineSpacing, themeColor };
    onChange?.(newConfig);
    localStorage.setItem("cvSettings", JSON.stringify(newConfig));
  }, [template, font, fontSize, lineSpacing, themeColor]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const inside = Object.values(refs).some(ref => ref.current?.contains(e.target));
      if (!inside) setOpenDropdown(null);
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const toggleDropdown = useCallback((key) => {
    setOpenDropdown(prev => (prev === key ? null : key));
  }, []);

  const renderMenu = (key, icon, title, content, widthClass = "w-48") => (
    <div className="relative" ref={refs[key]}>
      <button
        onClick={() => toggleDropdown(key)}
        className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl bg-white shadow text-xs sm:text-sm border hover:bg-gray-50 transition"
      >
        {icon}
        <span className="hidden sm:inline">{title}</span>
        <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
      </button>

      <AnimatePresence>
        {openDropdown === key && (
          <motion.div
            className={`fixed bottom-24 left-4 md:left-auto z-[9999] bg-white border rounded-xl shadow-xl p-4 max-h-[320px] overflow-auto ${widthClass}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
          >
            <h3 className="text-xs font-semibold text-gray-600 mb-2">{title}</h3>
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="bg-white border shadow-lg rounded-xl px-2 py-1.5 flex items-center gap-1 sm:gap-3 font-[Poppins] text-xs sm:text-sm max-w-full overflow-x-auto">
      {renderMenu("template", <Squares2X2Icon className="w-4 h-4" />, t("template"),
        <div className="flex gap-4 overflow-x-auto pr-1">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => {
                setTemplate(tpl.id);
                setOpenDropdown(null);
              }}
              className={`flex flex-col items-center w-[88px] p-1.5 rounded-xl border transition ${
                template === tpl.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
              } hover:shadow-sm`}
            >
              <div className="w-[70px] h-[99px] bg-white border overflow-hidden rounded">
                <img src={tpl.img} alt={tpl.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-[11px] mt-1 font-medium text-center">{tpl.name}</span>
            </button>
          ))}
        </div>, "w-[380px]")}

      {renderMenu("themeColor", <PaintBrushIcon className="w-4 h-4" />, t("themeColor"),
        <div className="space-y-3">
          <div className="grid grid-cols-5 gap-2">
            {defaultColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  setThemeColor(color);
                  setOpenDropdown(null);
                }}
                className={`w-6 h-6 rounded-full border-2 ${themeColor === color ? "border-blue-500" : "border-transparent"}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-10 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              className="w-[88px] border rounded px-2 py-1 text-sm"
              placeholder="#000000"
            />
          </div>
        </div>)}

      {renderMenu("font", <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>, t("font"),
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {fonts.map(f => (
            <button
              key={f}
              onClick={() => {
                setFont(f);
                setOpenDropdown(null);
              }}
              className={`px-2 py-1 rounded text-left text-sm ${font === f ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}`}
              style={{ fontFamily: f }}
            >
              {f}
            </button>
          ))}
        </div>)}

      {renderMenu("fontSize", <AdjustmentsHorizontalIcon className="w-4 h-4" />, t("fontSize"),
        <div className="flex flex-col gap-2 text-center">
          {fontSizes.map(size => (
            <button
              key={size}
              onClick={() => {
                setFontSize(size);
                setOpenDropdown(null);
              }}
              className={`w-16 px-2 py-1 rounded text-sm border ${fontSize === size ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
            >
              {size}
            </button>
          ))}
        </div>, "w-24")}

      {renderMenu("lineSpacing", <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /></svg>, t("lineSpacing"),
        <div className="flex flex-col gap-2 text-center">
          {lineSpacings.map(spacing => (
            <button
              key={spacing}
              onClick={() => {
                setLineSpacing(spacing);
                setOpenDropdown(null);
              }}
              className={`w-16 px-2 py-1 rounded text-sm border ${lineSpacing === spacing ? "bg-blue-500 text-white" : "hover:bg-gray-100"}`}
            >
              {spacing}
            </button>
          ))}
        </div>, "w-24")}

      {/* 👇 Preview toggle button (mobile only) */}
      <div className="ml-auto xl:hidden">
        <button
          onClick={onTogglePreview}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-blue-600 border border-blue-600 shadow hover:bg-blue-50"
        >
          <EyeIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t("preview") || "Preview"}</span>
        </button>
      </div>
    </div>
  );
}

export default FloatingBar;
