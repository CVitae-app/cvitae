import React from "react";

const Athena = ({
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
  const personal = data.personal || {};

  const primaryInfo = [
    personal.email,
    personal.phone,
    personal.website,
    personal.linkedin,
    [personal.address, personal.postalCode, personal.city].filter(Boolean).join(" "),
    personal.country,
  ].filter(Boolean);

  const extendedInfo = [
    personal.birthplace && `${t("birthplace")}: ${personal.birthplace}`,
    personal.nationality && `${t("nationality")}: ${t(personal.nationality) || personal.nationality}`,
    personal.gender && `${t("gender")}: ${t(personal.gender) || personal.gender}`,
    personal.license && `${t("license")}: ${t(personal.license) || personal.license}`,
    personal.maritalStatus && `${t("maritalStatus")}: ${t(personal.maritalStatus) || personal.maritalStatus}`,
  ].filter(Boolean);

  const allInfo = [...primaryInfo, ...extendedInfo];
  const midpoint = Math.ceil(allInfo.length / 2);
  const leftColumn = allInfo.slice(0, midpoint);
  const rightColumn = allInfo.slice(midpoint);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontFamily: settings.font,
        fontSize,
        lineHeight: settings.lineSpacing,
        color: "#1f2937",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
        padding: "0",
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
        <header className="avoid-break-inside flex items-center gap-6 border-b border-gray-300 pb-6 mb-6">
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover border border-gray-300"
            />
          )}
          <div className="space-y-1 w-full">
            <h1 className="text-3xl font-bold">
              {capitalize(personal.firstName)} {capitalize(personal.lastName)}
            </h1>
            {personal.jobTitle && (
              <p className="text-base text-gray-600">{personal.jobTitle}</p>
            )}

            <div
              className="grid grid-cols-2 gap-x-6 mt-3 text-sm text-gray-700"
              style={{ fontSize }}
            >
              <div className="space-y-1">
                {leftColumn.map((info, i) => (
                  <p key={`left-${i}`}>{info}</p>
                ))}
              </div>
              <div className="space-y-1">
                {rightColumn.map((info, i) => (
                  <p key={`right-${i}`}>{info}</p>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex gap-8 overflow-hidden">
          {/* Sidebar */}
          <aside
            className="avoid-break-inside space-y-6 text-white p-6 rounded-lg"
            style={{
              backgroundColor: settings.themeColor,
              width: "260px",
              minWidth: "260px",
              boxSizing: "border-box",
              overflow: "hidden",
              fontSize,
            }}
          >
            {shouldRenderSection(data.skills, ["naam"]) && (
              <section className="avoid-break-inside">
                <h2 className="font-semibold border-b border-white pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                  {t("skills")}
                </h2>
                <ul className="space-y-1">
                  {data.skills.map((skill, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      {translateIfPossible(skill.naam)}
                      {renderDotLevel(skill.niveau)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {shouldRenderSection(data.languages, ["naam"]) && (
              <section className="avoid-break-inside">
                <h2 className="font-semibold border-b border-white pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                  {t("languages")}
                </h2>
                <ul className="space-y-1">
                  {data.languages.map((lang, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      {translateIfPossible(lang.naam)}
                      {renderDotLevel(lang.niveau)}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.hobbies?.length > 0 && (
              <section className="avoid-break-inside">
                <h2 className="font-semibold border-b border-white pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                  {t("hobbies")}
                </h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.hobbies.map((hobby, i) => (
                    <li key={i}>{translateIfPossible(hobby)}</li>
                  ))}
                </ul>
              </section>
            )}

            {data.traits?.length > 0 && (
              <section className="avoid-break-inside">
                <h2 className="font-semibold border-b border-white pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                  {t("traits")}
                </h2>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {data.traits.map((trait, i) => (
                    <li key={i}>
                      {translateIfPossible(typeof trait === "string" ? trait : trait.naam)}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>

          {/* Main Content */}
          <main
            className="space-y-6 text-gray-900 overflow-hidden"
            style={{ flex: 1, fontSize }}
          >
            {renderMainSection("workExperience", data.workExperience)}
            {renderMainSection("education", data.education)}
            {dynamicSteps.map((step) => renderMainSection(step, data[step]))}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Athena;
