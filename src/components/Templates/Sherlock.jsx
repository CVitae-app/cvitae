import React from "react";

const Sherlock = ({
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
  renderExtraPersonalInfo,
  dynamicSteps,
  translateIfPossible,
}) => {
  const fontSize = getFontSize();
  const headerFontSize = getHeaderFontSize();
  const themeColor = settings.themeColor || "#111827";
  const personal = data.personal || {};

  const renderDateRange = (item) => {
    const start = renderDate(item, "start");
    const end = item.heden || item.werktHier ? t("current") : renderDate(item, "eind");
    return [start, end].filter(Boolean).join(" – ");
  };

  const extendedInfo = [
    personal.birthplace && `${t("birthplace")}: ${personal.birthplace}`,
    personal.nationality && `${t("nationality")}: ${t(personal.nationality) || personal.nationality}`,
    personal.gender && `${t("gender")}: ${t(personal.gender) || personal.gender}`,
    personal.license && `${t("license")}: ${t(personal.license) || personal.license}`,
    personal.maritalStatus && `${t("maritalStatus")}: ${t(personal.maritalStatus) || personal.maritalStatus}`,
  ].filter(Boolean);

  const renderStyledSection = (key, items) => {
    if (!shouldRenderSection(items, ["titel", "beschrijving", "functie", "bedrijf", "opleiding", "instituut"])) return null;

    return (
      <section
        key={key}
        className="cv-block avoid-break-inside"
        style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
      >
        <h2
          className="font-semibold mb-2 border-b pb-1"
          style={{ fontSize: headerFontSize, color: themeColor }}
        >
          {t(key)}
        </h2>
        {items.map((item, i) => {
          const title = item.functie || item.opleiding || item.titel || item.bedrijf || "";
          const org = item.bedrijf || item.instituut || item.platform || "";
          const city = item.stad || "";
          const dates = renderDateRange(item);

          return (
            <div key={`${key}-${i}`} className="mb-4 space-y-1">
              <div className="flex justify-between font-medium">
                <span>{capitalize(title)}</span>
                <span>{dates}</span>
              </div>
              <p className="text-gray-600">{[org, city].filter(Boolean).join(", ")}</p>
              {item.beschrijving && (
                <p className="whitespace-pre-line text-gray-700">{item.beschrijving}</p>
              )}
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
        color: "#111827",
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
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <header
          className="avoid-break-inside text-center border-b px-8 pt-6 pb-4 mb-4"
          style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
        >
          <h1
            className="font-bold tracking-tight uppercase"
            style={{
              fontSize: "32px",
              color: themeColor,
              letterSpacing: "0.03em",
            }}
          >
            {capitalize(personal.firstName)} {capitalize(personal.lastName)}
          </h1>

          {imageUrl && (
            <div className="flex justify-center mt-3 mb-1">
              <img
                src={imageUrl}
                alt="Profile"
                className="w-24 h-24 object-cover rounded-full border border-gray-300"
              />
            </div>
          )}

          <div className="text-gray-700 mt-2 space-y-1" style={{ fontSize }}>
            {personal.email && <p>{personal.email}</p>}
            {personal.phone && <p>{personal.phone}</p>}
            {[personal.address, personal.postalCode, personal.city].some(Boolean) && (
              <p>{[personal.address, personal.postalCode, personal.city].filter(Boolean).join(" ")}</p>
            )}
            {personal.country && <p>{personal.country}</p>}
            {personal.website && <p>{personal.website}</p>}
            {personal.linkedin && <p>{personal.linkedin}</p>}
            {extendedInfo.map((line, idx) => (
              <p key={idx} className="text-gray-600">
                {line}
              </p>
            ))}
          </div>
        </header>

        {/* Main Content */}
        <main
          className="flex flex-col gap-6 text-sm px-8 pb-10 overflow-hidden"
          style={{ fontSize }}
        >
          {renderStyledSection("workExperience", data.workExperience)}
          {renderStyledSection("education", data.education)}
          {renderStyledSection("courses", data.courses)}
          {renderStyledSection("internships", data.internships)}
          {renderStyledSection("certifications", data.certifications)}

          {dynamicSteps
            .filter(
              (step) =>
                ![
                  "workExperience",
                  "education",
                  "courses",
                  "internships",
                  "certifications",
                ].includes(step)
            )
            .map((step) => renderStyledSection(step, data[step]))}

          {/* Skills */}
          {shouldRenderSection(data.skills, ["naam"]) && (
            <section
              className="cv-block avoid-break-inside"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <h2
                className="font-semibold mb-2 border-b pb-1"
                style={{ fontSize: headerFontSize, color: themeColor }}
              >
                {t("skills")}
              </h2>
              <ul className="space-y-1">
                {data.skills.map((skill, i) => (
                  <li key={`skill-${i}`}>{translateIfPossible(skill.naam)}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Traits */}
          {data.traits?.length > 0 && (
            <section
              className="cv-block avoid-break-inside"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <h2
                className="font-semibold mb-2 border-b pb-1"
                style={{ fontSize: headerFontSize, color: themeColor }}
              >
                {t("traits")}
              </h2>
              <ul className="space-y-1">
                {data.traits.map((trait, i) => (
                  <li key={`trait-${i}`}>{translateIfPossible(trait.naam || trait)}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Languages */}
          {shouldRenderSection(data.languages, ["naam"]) && (
            <section
              className="cv-block avoid-break-inside"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <h2
                className="font-semibold mb-2 border-b pb-1"
                style={{ fontSize: headerFontSize, color: themeColor }}
              >
                {t("languages")}
              </h2>
              <ul className="space-y-1">
                {data.languages.map((lang, i) => (
                  <li key={`lang-${i}`}>
                    {translateIfPossible(lang.naam)} – {t(lang.niveau)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hobbies */}
          {data.hobbies?.length > 0 && (
            <section
              className="cv-block avoid-break-inside"
              style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
            >
              <h2
                className="font-semibold mb-2 border-b pb-1"
                style={{ fontSize: headerFontSize, color: themeColor }}
              >
                {t("hobbies")}
              </h2>
              <ul className="list-disc list-inside space-y-1">
                {data.hobbies.map((hobby, i) => (
                  <li key={`hobby-${i}`}>{translateIfPossible(hobby)}</li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default Sherlock;
