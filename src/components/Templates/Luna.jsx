import React from "react";

const Luna = ({
  A4_WIDTH,
  A4_HEIGHT,
  settings,
  imageUrl,
  data,
  t,
  getFontSize,
  getHeaderFontSize,
  capitalize,
  translateIfPossible,
  shouldRenderSection,
  renderDotLevel,
  renderDate,
  renderMainSection,
  renderExtraPersonalInfo,
  dynamicSteps,
  wrapperRef,
  pageBlocks,
  globalChunkIndexRef,
}) => {
  const fontSize = getFontSize();
  const headerFontSize = getHeaderFontSize();
  const isPaged = Array.isArray(pageBlocks);

  const baseTextStyle = {
    fontSize,
    lineHeight: settings.lineSpacing,
  };

  const sectionHeaderStyle = {
    fontSize: headerFontSize,
    lineHeight: "1.8",
    paddingBottom: "9px",
    marginBottom: "8px",
  };

  const shouldRenderChunk = () => {
    if (!globalChunkIndexRef || typeof globalChunkIndexRef.current !== "number") return true;
    const index = globalChunkIndexRef.current;
    const result = !isPaged || pageBlocks.includes(index);
    globalChunkIndexRef.current = index + 1;
    return result;
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        columnGap: "32px",
        padding: 0,
        boxSizing: "border-box",
        overflow: "hidden",
        fontFamily: settings.font,
        color: "#1f2937",
        ...baseTextStyle,
      }}
    >
      {/* Sidebar */}
      <aside
        className="sidebar flex flex-col"
        style={{
          backgroundColor: settings.themeColor,
          borderRadius: "12px",
          padding: "24px",
          color: "white",
          height: "auto",
          maxHeight: "none",
          overflow: "visible",
          boxSizing: "border-box",
          ...baseTextStyle,
        }}
      >
        <div
          className="sidebar-inner flex flex-col items-center gap-2 text-center avoid-break-inside"
          style={baseTextStyle}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          )}
          <h1
            className="font-bold leading-snug text-center"
            style={{ fontSize: headerFontSize }}
          >
            {capitalize(data.personal?.firstName)}{" "}
            {capitalize(data.personal?.lastName)}
          </h1>
          {data.personal?.email && <p>{data.personal.email}</p>}
          {data.personal?.phone && <p>{data.personal.phone}</p>}
          {data.personal?.address && <p>{data.personal.address}</p>}
          {(data.personal?.postalCode || data.personal?.city) && (
            <p>
              {data.personal.postalCode} {data.personal.city}
            </p>
          )}
          {data.personal?.website && <p>{data.personal.website}</p>}
          {data.personal?.linkedin && <p>{data.personal.linkedin}</p>}
          {renderExtraPersonalInfo(fontSize)}
        </div>

        <div
          className="mt-8 space-y-6 overflow-visible avoid-break-inside"
          style={baseTextStyle}
        >
          {/* Skills */}
          {shouldRenderSection(data.skills, ["naam"]) && (
            <section>
              <h2 className="font-semibold border-b border-white" style={sectionHeaderStyle}>
                {t("skills")}
              </h2>
              <ul className="space-y-1">
                {data.skills.map((skill, i) =>
                  shouldRenderChunk() ? (
                    <div key={i} className="cv-chunk">
                      <li className="flex justify-between items-baseline gap-2">
                        <span>{translateIfPossible(skill.naam)}</span>
                        <div style={{ paddingTop: "2px" }}>
                          {renderDotLevel(skill.niveau)}
                        </div>
                      </li>
                    </div>
                  ) : null
                )}
              </ul>
            </section>
          )}

          {/* Languages */}
          {shouldRenderSection(data.languages, ["naam"]) && (
            <section>
              <h2 className="font-semibold border-b border-white" style={sectionHeaderStyle}>
                {t("languages")}
              </h2>
              <ul className="space-y-1">
                {data.languages.map((lang, i) =>
                  shouldRenderChunk() ? (
                    <div key={i} className="cv-chunk">
                      <li className="flex justify-between items-baseline gap-2">
                        <span>{translateIfPossible(lang.naam)}</span>
                        <div style={{ paddingTop: "2px" }}>
                          {renderDotLevel(lang.niveau)}
                        </div>
                      </li>
                    </div>
                  ) : null
                )}
              </ul>
            </section>
          )}

          {/* Hobbies */}
          {data.hobbies?.length > 0 && (
            <section>
              <h2 className="font-semibold border-b border-white" style={sectionHeaderStyle}>
                {t("hobbies")}
              </h2>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {data.hobbies.map((hobby, i) =>
                  shouldRenderChunk() ? (
                    <div key={i} className="cv-chunk">
                      <li>{translateIfPossible(hobby)}</li>
                    </div>
                  ) : null
                )}
              </ul>
            </section>
          )}

          {/* Traits */}
          {data.traits?.length > 0 && (
            <section>
              <h2 className="font-semibold border-b border-white" style={sectionHeaderStyle}>
                {t("traits")}
              </h2>
              <ul className="list-disc list-inside space-y-1 pl-4">
                {data.traits.map((trait, i) =>
                  shouldRenderChunk() ? (
                    <div key={i} className="cv-chunk">
                      <li>{translateIfPossible(trait.naam || trait)}</li>
                    </div>
                  ) : null
                )}
              </ul>
            </section>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className="space-y-6 overflow-hidden"
        style={{
          display: "flex",
          flexDirection: "column",
          ...baseTextStyle,
        }}
      >
        {renderMainSection("workExperience", data.workExperience)}
        {renderMainSection("education", data.education)}
        {dynamicSteps.map((key) => renderMainSection(key, data[key]))}
      </main>
    </div>
  );
};

export default Luna;
