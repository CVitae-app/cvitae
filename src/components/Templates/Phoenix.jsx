import React from "react";

const Phoenix = ({
  A4_WIDTH,
  A4_HEIGHT,
  settings,
  imageUrl,
  data,
  t,
  getFontSize,
  getHeaderFontSize,
  capitalize,
  shouldRenderSection,
  renderDotLevel,
  renderDate,
  renderMainSection,
  renderExtraPersonalInfo,
  dynamicSteps,
  translateIfPossible,
}) => {
  const fontSize = getFontSize();
  const headerFontSize = getHeaderFontSize();
  const themeColor = settings.themeColor || "#000000";

  const renderStyledSection = (key, items) => {
    if (!shouldRenderSection(items, ["titel", "beschrijving", "functie", "bedrijf", "opleiding"])) return null;

    return (
      <section key={key} className="cv-block avoid-break-inside">
        <h2
          className="font-bold uppercase mb-2"
          style={{ borderBottom: `2px solid ${themeColor}`, fontSize: headerFontSize }}
        >
          {t(key)}
        </h2>
        {items.map((item, i) => {
          const title = item.functie || item.opleiding || item.titel || item.bedrijf || "";
          const org = item.bedrijf || item.instituut || item.platform || "";
          const city = item.stad || "";
          const start = renderDate(item, "start");
          const end = item.heden || item.werktHier ? t("current") : renderDate(item, "eind");
          const dateRange = [start, end].filter(Boolean).join(" – ");

          return (
            <div key={i} className="mb-4 space-y-1" style={{ fontSize }}>
              <div className="flex justify-between font-medium">
                <span>{capitalize(title)}</span>
                <span>{dateRange}</span>
              </div>
              <p className="text-gray-600">{[org, city].filter(Boolean).join(", ")}</p>
              {item.beschrijving && <p className="whitespace-pre-line">{item.beschrijving}</p>}
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: settings.font,
        fontSize,
        lineHeight: settings.lineSpacing,
        color: "#1f2937",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        data-exportable
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          className="avoid-break-inside flex items-center justify-between px-6 py-6 text-white"
          style={{ backgroundColor: themeColor }}
        >
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold uppercase tracking-wider mb-1">
              {capitalize(data.personal?.firstName)} {capitalize(data.personal?.lastName)}
            </h1>
            <div className="text-sm space-y-1">
              <p>
                {[data.personal?.email, data.personal?.phone, data.personal?.website]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p>
                {[data.personal?.address, data.personal?.postalCode, data.personal?.city]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {renderExtraPersonalInfo()}
              </div>
            </div>
          </div>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Profile"
              className="w-28 h-28 object-cover rounded-lg border border-white ml-6"
            />
          )}
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 pt-6 pr-0 pb-0 overflow-hidden">
          {/* Sidebar */}
          <aside className="md:col-span-1 space-y-6 pr-4">
            {shouldRenderSection(data.skills, ["naam"]) && (
              <section className="avoid-break-inside">
                <h2
                  className="font-bold uppercase mb-2"
                  style={{ borderBottom: `2px solid ${themeColor}`, fontSize: headerFontSize }}
                >
                  {t("skills")}
                </h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.skills.map((skill, i) => (
                    <li key={i}>{translateIfPossible(skill.naam)}</li>
                  ))}
                </ul>
              </section>
            )}

            {data.traits?.length > 0 && (
              <section className="avoid-break-inside">
                <h2
                  className="font-bold uppercase mb-2"
                  style={{ borderBottom: `2px solid ${themeColor}`, fontSize: headerFontSize }}
                >
                  {t("traits")}
                </h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.traits.map((trait, i) => (
                    <li key={i}>{translateIfPossible(trait.naam || trait)}</li>
                  ))}
                </ul>
              </section>
            )}

            {shouldRenderSection(data.languages, ["naam"]) && (
              <section className="avoid-break-inside">
                <h2
                  className="font-bold uppercase mb-2"
                  style={{ borderBottom: `2px solid ${themeColor}`, fontSize: headerFontSize }}
                >
                  {t("languages")}
                </h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.languages.map((lang, i) => (
                    <li key={i}>
                      {translateIfPossible(lang.naam)} – {t(lang.niveau)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.hobbies?.length > 0 && (
              <section className="avoid-break-inside">
                <h2
                  className="font-bold uppercase mb-2"
                  style={{ borderBottom: `2px solid ${themeColor}`, fontSize: headerFontSize }}
                >
                  {t("hobbies")}
                </h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.hobbies.map((hobby, i) => (
                    <li key={i}>{translateIfPossible(hobby)}</li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          {/* Main Content */}
          <main className="md:col-span-2 space-y-6 text-sm overflow-hidden">
            {renderStyledSection("workExperience", data.workExperience)}
            {renderStyledSection("education", data.education)}
            {renderStyledSection("courses", data.courses)}
            {renderStyledSection("internships", data.internships)}
            {renderStyledSection("certifications", data.certifications)}

            {dynamicSteps
              .filter(
                (step) =>
                  !["workExperience", "education", "courses", "internships", "certifications"].includes(step)
              )
              .map((step) => renderStyledSection(step, data[step]))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Phoenix;
