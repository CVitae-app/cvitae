import React from "react";

const Orion = ({
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
  const themeColor = settings.themeColor || "#3B82F6";
  const fontSize = getFontSize();
  const headerFontSize = getHeaderFontSize();
  const personal = data.personal || {};

  const extendedInfo = [
    personal.birthplace && `${t("birthplace")}: ${personal.birthplace}`,
    personal.nationality && `${t("nationality")}: ${t(personal.nationality) || personal.nationality}`,
    personal.gender && `${t("gender")}: ${t(personal.gender) || personal.gender}`,
    personal.license && `${t("license")}: ${t(personal.license) || personal.license}`,
    personal.maritalStatus && `${t("maritalStatus")}: ${t(personal.maritalStatus) || personal.maritalStatus}`,
  ].filter(Boolean);

  const renderStyledSection = (key, items) => {
    if (!shouldRenderSection(items, ["titel", "beschrijving", "functie", "bedrijf"])) return null;

    return (
      <section key={key} className="cv-block avoid-break-inside">
        <h2 className="font-semibold mb-2" style={{ fontSize: headerFontSize, color: themeColor }}>
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
        padding: "0px",
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
          className="avoid-break-inside text-white text-center px-6 py-5"
          style={{ backgroundColor: themeColor }}
        >
          <h1
            className="font-bold uppercase tracking-wide"
            style={{ fontSize: headerFontSize }}
          >
            {capitalize(personal.firstName)} {capitalize(personal.lastName)}
          </h1>

          <div style={{ fontSize, marginTop: "4px" }}>
            {personal.email && <p>{personal.email}</p>}
            {personal.phone && <p>{personal.phone}</p>}
            {[personal.address, personal.postalCode, personal.city].some(Boolean) && (
              <p>
                {[personal.address, personal.postalCode, personal.city].filter(Boolean).join(" ")}
              </p>
            )}
            {personal.website && <p>{personal.website}</p>}
            {personal.linkedin && <p>{personal.linkedin}</p>}
            {extendedInfo.length > 0 &&
              extendedInfo.map((item, idx) => (
                <p key={idx} className="text-white">
                  {item}
                </p>
              ))}
          </div>
        </header>

        {/* Content */}
        <div className="flex flex-1 flex-col md:flex-row gap-6  py-6 overflow-hidden">
          {/* Sidebar */}
          <aside className="md:w-1/3 space-y-6" style={{ fontSize }}>
            {imageUrl?.startsWith("data:") || imageUrl?.startsWith("blob:") || imageUrl?.startsWith("http") ? (
              <div className="flex justify-center mb-2">
                <img
                  src={imageUrl}
                  alt="Profile"
                  className="w-40 h-40 object-cover rounded-full border-2 border-gray-300"
                />
              </div>
            ) : null}

            {shouldRenderSection(data.skills, ["naam"]) && (
              <section className="avoid-break-inside">
                <h2 className="font-semibold mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
                  {t("skills")}
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  {data.skills.map((skill, i) => (
                    <li key={i}>{translateIfPossible(skill.naam)}</li>
                  ))}
                </ul>
              </section>
            )}

            {data.traits?.length > 0 && (
              <section className="avoid-break-inside">
                <h2 className="font-semibold mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
                  {t("traits")}
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  {data.traits.map((trait, i) => (
                    <li key={i}>{translateIfPossible(trait.naam || trait)}</li>
                  ))}
                </ul>
              </section>
            )}

            {shouldRenderSection(data.languages, ["naam"]) && (
              <section className="avoid-break-inside">
                <h2 className="font-semibold mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
                  {t("languages")}
                </h2>
                <ul className="list-disc list-inside space-y-1">
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
                <h2 className="font-semibold mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
                  {t("hobbies")}
                </h2>
                <ul className="list-disc list-inside space-y-1">
                  {data.hobbies.map((hobby, i) => (
                    <li key={i}>{translateIfPossible(hobby)}</li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          {/* Main Content */}
          <main className="md:w-2/3 space-y-6 overflow-hidden" style={{ fontSize }}>
            {renderMainSection("workExperience", data.workExperience)}
            {renderMainSection("education", data.education)}
            {renderMainSection("internships", data.internships)}
            {renderMainSection("courses", data.courses)}
            {renderMainSection("certifications", data.certifications)}

            {dynamicSteps
              .filter((step) =>
                !["workExperience", "education", "internships", "courses", "certifications"].includes(step)
              )
              .map((step) => renderMainSection(step, data[step]))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Orion;
