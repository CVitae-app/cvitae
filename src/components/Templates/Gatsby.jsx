import React from "react";

const Gatsby = ({
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

  const extendedInfoItems = [
    personal.birthplace ? `${t("birthplace")}: ${personal.birthplace}` : null,
    personal.nationality ? `${t("nationality")}: ${t(personal.nationality) || personal.nationality}` : null,
    personal.gender ? `${t("gender")}: ${t(personal.gender) || personal.gender}` : null,
    personal.license ? `${t("license")}: ${t(personal.license) || personal.license}` : null,
    personal.maritalStatus ? `${t("maritalStatus")}: ${t(personal.maritalStatus) || personal.maritalStatus}` : null,
  ].filter(Boolean);

  const extendedInfoText = extendedInfoItems.join(" · ");
  const hasExtendedInfo = extendedInfoItems.length > 0;

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
          className="avoid-break-inside text-center border-b border-gray-300 m-4"
          style={{
            padding: hasExtendedInfo ? "24px 40px 16px" : "24px 40px 12px",
          }}
        >
          <h1
            className="font-bold uppercase tracking-wide"
            style={{ fontSize: headerFontSize, lineHeight: 1.4, marginBottom: 4 }}
          >
            {capitalize(personal.firstName)} {capitalize(personal.lastName)}
          </h1>

          {/* Primary Contact Info */}
          <p style={{ fontSize }}>
            {[personal.email, personal.phone].filter(Boolean).join(" · ")}
          </p>
          <p style={{ fontSize }}>
            {[personal.address, personal.postalCode, personal.city].filter(Boolean).join(" ")}
          </p>
          {personal.website && <p style={{ fontSize }}>{personal.website}</p>}
          {personal.linkedin && <p style={{ fontSize }}>{personal.linkedin}</p>}

          {/* Extended Info as single centered paragraph */}
          {hasExtendedInfo && (
            <p
              style={{
                fontSize,
                marginTop: 6,
                maxWidth: "80%",
                marginLeft: "auto",
                marginRight: "auto",
                color: "#374151", // subtle gray
              }}
            >
              {extendedInfoText}
            </p>
          )}
        </header>

        {/* Skills, Languages, Traits, Hobbies */}
        <section
          className="avoid-break-inside grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 px-10"
          style={{ fontSize }}
        >
          {shouldRenderSection(data.skills, ["naam"]) && (
            <div>
              <h2 className="font-semibold border-b pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                {t("skills")}
              </h2>
              <ul className="list-disc list-inside space-y-1">
                {data.skills.map((skill, i) => (
                  <li key={i}>{translateIfPossible(skill.naam)}</li>
                ))}
              </ul>
            </div>
          )}

          {shouldRenderSection(data.languages, ["naam"]) && (
            <div>
              <h2 className="font-semibold border-b pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                {t("languages")}
              </h2>
              <ul className="list-disc list-inside space-y-1">
                {data.languages.map((lang, i) => (
                  <li key={i}>
                    {translateIfPossible(lang.naam)} – {t(lang.niveau)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.traits?.length > 0 && (
            <div>
              <h2 className="font-semibold border-b pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                {t("traits")}
              </h2>
              <ul className="list-disc list-inside space-y-1">
                {data.traits.map((trait, i) => (
                  <li key={i}>{translateIfPossible(trait.naam || trait)}</li>
                ))}
              </ul>
            </div>
          )}

          {data.hobbies?.length > 0 && (
            <div>
              <h2 className="font-semibold border-b pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                {t("hobbies")}
              </h2>
              <ul className="list-disc list-inside space-y-1">
                {data.hobbies.map((hobby, i) => (
                  <li key={i}>{translateIfPossible(hobby)}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Main Sections */}
        <div className="space-y-6 px-10 pb-10 overflow-hidden" style={{ fontSize }}>
          {renderMainSection("workExperience", data.workExperience)}
          {renderMainSection("education", data.education)}
          {dynamicSteps.map((step) => renderMainSection(step, data[step]))}

          {(shouldRenderSection(data.courses, ["titel", "beschrijving"]) ||
            shouldRenderSection(data.internships, ["functie", "bedrijf", "beschrijving"])) && (
            <section className="avoid-break-inside grid grid-cols-1 sm:grid-cols-2 gap-6">
              {shouldRenderSection(data.courses, ["titel", "beschrijving"]) && (
                <div>
                  <h2 className="font-semibold border-b pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                    {t("courses")}
                  </h2>
                  <ul className="list-disc list-inside space-y-1">
                    {data.courses.map((course, i) => (
                      <li key={i}>
                        {capitalize(course.titel)}{" "}
                        {course.platform ? `– ${course.platform}` : ""}{" "}
                        {course.jaar ? `(${course.jaar})` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {shouldRenderSection(data.internships, ["functie", "bedrijf", "beschrijving"]) && (
                <div>
                  <h2 className="font-semibold border-b pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                    {t("internships")}
                  </h2>
                  {data.internships.map((intern, i) => (
                    <div key={i} className="mb-4">
                      <p className="font-medium">
                        {capitalize(intern.functie)} – {capitalize(intern.bedrijf)}
                      </p>
                      <p className="italic text-gray-600">
                        {renderDate(intern, "start")} –{" "}
                        {intern.heden || intern.werktHier
                          ? t("current")
                          : renderDate(intern, "eind")}{" "}
                        · {intern.stad}
                      </p>
                      <p className="mt-1">{intern.beschrijving}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {data.certifications?.length > 0 && (
            <section className="avoid-break-inside">
              <h2 className="font-semibold border-b pb-1 mb-2" style={{ fontSize: headerFontSize }}>
                {t("certifications")}
              </h2>
              <ul className="list-disc list-inside space-y-1">
                {data.certifications.map((cert, i) => (
                  <li key={i}>{capitalize(cert.titel)}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gatsby;
