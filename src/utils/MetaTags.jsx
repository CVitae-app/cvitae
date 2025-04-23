import { Helmet } from "react-helmet";
import { useLocation } from "react-router-dom";
import { useTranslation } from "../contexts/LanguageContext";

export default function MetaTags({ cvName }) {
  const { language, t } = useTranslation();
  const location = useLocation();

  const meta = {
    en: {
      defaultTitle: "Professional CV Builder - CVitae",
      dashboard: "Dashboard - CVitae",
      description:
        "Create a standout CV in minutes with CVitae. Choose from elegant templates, customize easily, and download your CV hassle-free.",
    },
    nl: {
      defaultTitle: "Professionele CV Bouwer - CVitae",
      dashboard: "Dashboard - CVitae",
      description:
        "Maak binnen enkele minuten een indrukwekkend CV met CVitae. Kies uit elegante sjablonen, pas eenvoudig aan en download je CV zonder gedoe.",
    },
  };

  const content = meta[language] || meta.en;
  const isDashboard = location.pathname === "/dashboard";

  const isUnnamedCV =
    !cvName || cvName === t("cvWithoutName") || cvName.trim() === "";

  const title = isDashboard
    ? content.dashboard
    : isUnnamedCV
    ? content.defaultTitle
    : `${cvName} - CVitae`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={content.description} />
    </Helmet>
  );
}
