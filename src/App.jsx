import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CVBuilder from "./pages/CVBuilder";
import MetaTags from "./utils/metatags";

export default function App() {
  return (
    <main className="w-full h-full bg-gray-50 text-gray-800 antialiased">
      <Routes>
        <Route path="/" element={<CVBuilder />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<CVBuilder />} />
      </Routes>
    </main>
  );
}
