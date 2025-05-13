import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import CVBuilder from "./pages/CVBuilder";
import DownloadModal from "./components/DownloadModal";
import MetaTags from "./utils/MetaTags";

export default function App() {
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get("fromStripe") === "true") {
      setIsDownloadModalOpen(true);
      urlParams.delete("fromStripe");
      navigate({ search: urlParams.toString() }, { replace: true });
    }
  }, [location, navigate]);

  return (
    <main className="w-full h-full bg-gray-50 text-gray-800 antialiased">
      <Routes>
        <Route path="/" element={<CVBuilder openDownloadModal={() => setIsDownloadModalOpen(true)} />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<CVBuilder openDownloadModal={() => setIsDownloadModalOpen(true)} />} />
      </Routes>

      {/* Download Modal (Visible globally) */}
      <DownloadModal 
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />
    </main>
  );
}
