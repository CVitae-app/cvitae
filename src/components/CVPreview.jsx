import { useEffect, useRef, useState, useLayoutEffect } from "react";
import WebFont from "webfontloader";
import { useTranslation } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { getDotLevel } from "../utils/getDotLevel";

// Templates
import Luna from "./Templates/Luna";
import Athena from "./Templates/Athena";
import Phoenix from "./Templates/Phoenix";
import Orion from "./Templates/Orion";
import Caesar from "./Templates/Caesar";
import Sherlock from "./Templates/Sherlock";
import Gatsby from "./Templates/Gatsby";

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

const fontSizeMap = {
  xs: "11px",
  s: "12px",
  m: "13px",
  l: "14px",
  xl: "15px",
};

const headerFontSizeMap = {
  xs: "13px",
  s: "14px",
  m: "15px",
  l: "16px",
  xl: "17px",
};

const BASE_MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

const TEMPLATES = {
  luna: Luna,
  athena: Athena,
  phoenix: Phoenix,
  orion: Orion,
  caesar: Caesar,
  sherlock: Sherlock,
  gatsby: Gatsby,
};

export default function CVPreview({
  data,
  dynamicSteps,
  settings,
  setSettings,
  currentCVId,
  isCompact = false,
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const wrapperRef = useRef(null);
  const measuringRef = useRef(null);
  const [scale, setScale] = useState(isCompact ? 0.325 : 1);
  const [imageUrl, setImageUrl] = useState(null);
  const [forceRender, setForceRender] = useState(false);
  const [pages, setPages] = useState([]);

  const TemplateComponent = TEMPLATES[settings.template?.toLowerCase()] || Luna;

  const capitalize = (str) =>
    typeof str === "string" && str.length > 0
      ? str.charAt(0).toUpperCase() + str.slice(1)
      : "";

  const translateIfPossible = (value) => {
    if (!value || typeof value !== "string") return value;
    const translated = t(value);
    return translated === value ? capitalize(value) : translated;
  };

  const getFontSize = () => fontSizeMap[settings.fontSize] || "16px";
  const getHeaderFontSize = () => headerFontSizeMap[settings.fontSize] || "17px";

  const renderDotLevel = (level, isSidebar = false) => {
    const filled = getDotLevel(level);
    return (
      <div className="flex gap-[3px]" style={{ marginTop: isSidebar ? "2px" : "0px" }}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full"
            style={{
              backgroundColor: i < filled ? "#FFFFFF" : "rgba(255,255,255,0.3)",
            }}
          />
        ))}
      </div>
    );
  };

  const renderDate = (item, type = "start") => {
    const maand = item[`${type}Maand`];
    const jaar = item[`${type}Jaar`];
    if (!maand || !jaar) return "";

    const input = maand.trim().toLowerCase();
    const monthsShort = t("monthsShort", { returnObjects: true });
    const nlToBase = {
      januari: "january", februari: "february", maart: "march",
      april: "april", mei: "may", juni: "june", juli: "july",
      augustus: "august", september: "september", oktober: "october",
      november: "november", december: "december",
    };

    let baseMonth = BASE_MONTHS.find((m) => m === input || m.startsWith(input));
    if (!baseMonth && nlToBase[input]) baseMonth = nlToBase[input];

    const index = BASE_MONTHS.findIndex((m) => m === baseMonth);
    const short = monthsShort?.[index];
    if (!short) return `${capitalize(maand)} ${jaar}`;
    return `${short.charAt(0).toUpperCase() + short.slice(1)} ${jaar}`;
  };

  const shouldRenderSection = (items = [], keys = []) =>
    items?.some((item) =>
      keys.some((key) => {
        const value = item?.[key];
        return typeof value === "string" ? value.trim() !== "" : value !== undefined;
      })
    );

  const renderMainSection = (key, items) => {
    const sectionKeys = {
      workExperience: ["functie", "bedrijf", "stad", "startMaand", "startJaar", "beschrijving"],
      education: ["opleiding", "instituut", "stad", "startMaand", "startJaar", "beschrijving"],
      internships: ["functie", "bedrijf", "stad", "startMaand", "startJaar", "beschrijving"],
      certifications: ["titel", "startMaand", "startJaar", "beschrijving"],
      courses: ["titel", "startMaand", "startJaar", "beschrijving"],
    };

    const hasData = shouldRenderSection(items, sectionKeys[key] || ["titel", "beschrijving"]);
    if (!hasData) return null;

    const title = t(key);

    return (
      <section key={key} className="cv-block avoid-break-inside space-y-2">
        <h2
          className="font-semibold border-b border-gray-300"
          style={{
            fontSize: getHeaderFontSize(),
            lineHeight: "1.8",
            paddingBottom: "9px",
            marginBottom: "8px",
          }}
        >
          {title}
        </h2>
        {items.map((item, i) => {
          const name = item.functie || item.opleiding || item.titel || item.bedrijf || "";
          const institution = item.bedrijf || item.instituut || "";
          const city = item.stad || "";
          const start = renderDate(item, "start");
          const end = item.heden || item.werktHier ? t("current") : renderDate(item, "eind");

          return (
            <div key={i} className="cv-chunk space-y-1" style={{ fontSize: getFontSize() }}>
              <div className="flex justify-between font-medium">
                <span>{capitalize(name)}</span>
                <span>{[start, end].filter(Boolean).join(" - ")}</span>
              </div>
              <div className="text-gray-600">
                {[institution, city].filter(Boolean).join(", ")}
              </div>
              {item.beschrijving && (
                <p className="text-gray-700 whitespace-pre-line">{item.beschrijving}</p>
              )}
            </div>
          );
        })}
      </section>
    );
  };

  const renderExtraPersonalInfo = (fontSize) => {
    const p = data.personal || {};
    const fields = [
      ["birthplace", p.birthplace],
      ["nationality", p.nationality],
      ["gender", p.gender],
      ["license", p.license],
      ["maritalStatus", p.maritalStatus],
    ];

    return fields
      .filter(([, val]) => val)
      .map(([key, val]) => (
        <p key={key} style={{ fontSize }} className="text-white mb-1">
          {t(key)}: {typeof val === "string" ? t(val) || val : val}
        </p>
      ));
  };

  useEffect(() => {
    const font = settings.font;
    if (["Poppins", "Lato", "Noto Sans", "Calibri"].includes(font)) {
      WebFont.load({
        google: { families: [font] },
        active: () => {
          document.fonts.ready.then(() => setForceRender((prev) => !prev));
        },
      });
    }
  }, [settings.font]);

  useEffect(() => {
    const photo = data.personal?.photo;
    if (!photo) return setImageUrl(null);

    let objectUrl = null;
    if (photo instanceof File || photo instanceof Blob) {
      objectUrl = URL.createObjectURL(photo);
      setImageUrl(objectUrl);
    } else if (typeof photo === "string") {
      setImageUrl(photo);
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data.personal?.photo]);

  useLayoutEffect(() => {
    const splitIntoPages = () => {
      if (!measuringRef.current) return;
      const chunks = Array.from(measuringRef.current.querySelectorAll(".cv-chunk"));
      const pages = [];
      let currentPage = [];
      let heightSoFar = 0;

      chunks.forEach((chunk, index) => {
        const height = chunk.offsetHeight;
        if (heightSoFar + height <= A4_HEIGHT) {
          currentPage.push(index);
          heightSoFar += height;
        } else {
          if (currentPage.length) pages.push(currentPage);
          currentPage = [index];
          heightSoFar = height;
        }
      });

      if (currentPage.length) pages.push(currentPage);
      setPages(pages);
    };

    const handleResize = () => {
      if (!wrapperRef.current) return;
      const wrapperWidth = wrapperRef.current.offsetWidth;
      const newScale = isCompact
        ? Math.min(wrapperWidth / A4_WIDTH, 0.34)
        : Math.min(1, wrapperWidth / A4_WIDTH);

      setScale((prev) => (Math.abs(prev - newScale) > 0.001 ? newScale : prev));
      setTimeout(splitIntoPages, 50);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isCompact, forceRender, data, settings, dynamicSteps]);

  useEffect(() => {
    const blockContextMenu = (e) => e.preventDefault();
    const blockShortcuts = (e) => {
      const key = e.key.toLowerCase();
      if ((key === "p" || key === "s") && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", blockContextMenu);
    document.addEventListener("keydown", blockShortcuts);
    return () => {
      document.removeEventListener("contextmenu", blockContextMenu);
      document.removeEventListener("keydown", blockShortcuts);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`w-full h-full flex justify-center items-start bg-transparent overflow-x-hidden print:scale-[1] ${
        isCompact ? "" : "overflow-y-auto"
      }`}
    >
      {/* Measuring block (hidden) */}
      <div
        ref={measuringRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          zIndex: -1,
          width: `${A4_WIDTH}px`,
          padding: isCompact ? "0px" : "40px 50px",
          boxSizing: "border-box",
        }}
      >
        <TemplateComponent
          A4_WIDTH={A4_WIDTH}
          A4_HEIGHT={A4_HEIGHT}
          wrapperRef={measuringRef}
          settings={settings}
          imageUrl={imageUrl}
          data={data}
          t={t}
          getFontSize={getFontSize}
          getHeaderFontSize={getHeaderFontSize}
          capitalize={capitalize}
          translateIfPossible={translateIfPossible}
          shouldRenderSection={shouldRenderSection}
          renderDotLevel={renderDotLevel}
          renderDate={renderDate}
          renderMainSection={renderMainSection}
          renderExtraPersonalInfo={() => renderExtraPersonalInfo(getFontSize())}
          dynamicSteps={dynamicSteps}
          pageBlocks={null} // ✅ Show all chunks
          globalChunkIndexRef={{ current: 0 }} // ✅ Track index
        />
      </div>

      {/* Rendered visible pages */}
      <div style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}>
        <div style={{ width: `${A4_WIDTH}px` }}>
          {(() => {
            let globalChunkIndex = 0;
            return (pages.length ? pages : [null])
              .filter((page) => page === null || page.length > 0)
              .map((pageChunkIndexes, index) => {
                const pageStart = globalChunkIndex;
                globalChunkIndex += pageChunkIndexes?.length || 0;

                return (
                  <div
                    key={`page-${index}`}
                    className="a4-page shadow-2xl bg-white text-black overflow-hidden print:break-after-page"
                    style={{
                      width: `${A4_WIDTH}px`,
                      height: `${A4_HEIGHT}px`,
                      padding: isCompact ? "0px" : "40px 50px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      marginBottom: isCompact ? "0px" : "0px",
                    }}
                  >
                    <TemplateComponent
                      A4_WIDTH={A4_WIDTH}
                      A4_HEIGHT={A4_HEIGHT}
                      wrapperRef={null}
                      settings={settings}
                      imageUrl={imageUrl}
                      data={data}
                      t={t}
                      getFontSize={getFontSize}
                      getHeaderFontSize={getHeaderFontSize}
                      capitalize={capitalize}
                      translateIfPossible={translateIfPossible}
                      shouldRenderSection={shouldRenderSection}
                      renderDotLevel={renderDotLevel}
                      renderDate={renderDate}
                      renderMainSection={renderMainSection}
                      renderExtraPersonalInfo={() => renderExtraPersonalInfo(getFontSize())}
                      dynamicSteps={dynamicSteps}
                      pageIndex={index}
                      pageBlocks={pageChunkIndexes}
                      globalChunkIndexRef={{ current: pageStart }}
                    />
                  </div>
                );
              });
          })()}
        </div>
      </div>
    </div>
  );
}
