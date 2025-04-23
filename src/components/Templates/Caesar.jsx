import React from "react";

const Caesar = ({
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
  translateIfPossible,
  dynamicSteps,
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

  const renderSection = (key, items) => {
    if (!shouldRenderSection(items, ["titel", "beschrijving", "functie", "bedrijf", "opleiding"])) return null;

    return (
      <section key={key} className="avoid-break-inside">
        <h2
          className="font-semibold border-b pb-1 mb-2"
          style={{ color: themeColor, fontSize: headerFontSize }}
        >
          {t(key)}
        </h2>
        {items.map((item, i) => {
          const title = item.functie || item.opleiding || item.titel || item.bedrijf || "";
          const org = item.bedrijf || item.instituut || item.platform || "";
          const city = item.stad || "";
          const dates = renderDateRange(item);

          return (
            <div key={i} className="mb-4 space-y-1">
              <div className="flex justify-between font-medium">
                <span>{capitalize(title)}</span>
                <span>{dates}</span>
              </div>
              <p className="text-gray-600">{[org, city].filter(Boolean).join(", ")}</p>
              {item.beschrijving && (
                <p className="whitespace-pre-line">{item.beschrijving}</p>
              )}
            </div>
          );
        })}
      </section>
    );
  };

  const personalInfo = [
    personal.email,
    personal.phone,
    personal.website,
    personal.linkedin,
    [personal.address, personal.postalCode, personal.city].filter(Boolean).join(" "),
    personal.country,
    personal.birthplace && `${t("birthplace")}: ${personal.birthplace}`,
    personal.nationality && `${t("nationality")}: ${t(personal.nationality) || personal.nationality}`,
    personal.gender && `${t("gender")}: ${t(personal.gender) || personal.gender}`,
    personal.license && `${t("license")}: ${t(personal.license) || personal.license}`,
    personal.maritalStatus && `${t("maritalStatus")}: ${t(personal.maritalStatus) || personal.maritalStatus}`,
  ].filter(Boolean);

  const midpoint = Math.ceil(personalInfo.length / 2);
  const leftCol = personalInfo.slice(0, midpoint);
  const rightCol = personalInfo.slice(midpoint);

  const predefinedSections = [
    ["workExperience", data.workExperience],
    ["education", data.education],
    ["internships", data.internships],
    ["courses", data.courses],
    ["certifications", data.certifications],
  ];

  const extraSteps = dynamicSteps.filter(
    (key) => !predefinedSections.map(([k]) => k).includes(key)
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: settings.font,
        fontSize,
        lineHeight: settings.lineSpacing,
        color: "#1f2937",
        padding: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div data-exportable style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header className="avoid-break-inside text-center border-b border-gray-300 pb-4 mb-6 pt-6">
          <h1
            className="text-4xl font-extrabold tracking-wide mb-6"
            style={{ color: themeColor }}
          >
            {capitalize(personal.firstName)} {capitalize(personal.lastName)}
          </h1>
          {personal.jobTitle && (
            <p className="text-base text-gray-600 mb-4">{personal.jobTitle}</p>
          )}
          <div className="grid grid-cols-2 gap-x-8 text-sm text-gray-700 px-10">
            <div className="space-y-1">
              {leftCol.map((info, i) => (
                <p key={`left-${i}`}>{info}</p>
              ))}
            </div>
            <div className="space-y-1">
              {rightCol.map((info, i) => (
                <p key={`right-${i}`}>{info}</p>
              ))}
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 flex-col md:flex-row gap-8 pb-10 text-sm overflow-hidden">
          {/* Sidebar */}
          <aside className="md:w-1/3 space-y-6">
            {shouldRenderSection(data.skills, ["naam"]) && (
              <section>
                <h2 className="font-semibold border-b pb-1 mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
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
              <section>
                <h2 className="font-semibold border-b pb-1 mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
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
              <section>
                <h2 className="font-semibold border-b pb-1 mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
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
              <section>
                <h2 className="font-semibold border-b pb-1 mb-2" style={{ color: themeColor, fontSize: headerFontSize }}>
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

          {/* Main */}
          <main className="md:w-2/3 space-y-6">
            {predefinedSections.map(([key, items]) => renderSection(key, items))}
            {extraSteps.map((key) => renderSection(key, data[key]))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Caesar;
