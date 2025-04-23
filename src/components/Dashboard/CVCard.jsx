import {
  PencilIcon,
  EyeIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline";
import { useTranslation } from "../../contexts/LanguageContext";
import { useState } from "react";
import CVPreview from "../CVPreview";
import DownloadModal from "../DownloadModal";
import useDebouncedCallback from "../../hooks/useDebouncedCallback";

function formatRelativeDate(dateString, t) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  if (diff < 1) return t("today");
  if (diff === 1) return t("yesterday");
  if (diff < 7) return t("daysAgo", { count: diff });
  if (diff < 14) return t("aWeekAgo");
  return date.toLocaleDateString();
}

function CVCard({
  data,
  isNew,
  onCreate,
  onDelete,
  onRename,
  onDuplicate,
  onSelect,
  viewMode = "grid",
}) {
  const { t } = useTranslation();
  const isGrid = viewMode === "grid";
  const isSubscribed = true;

  const [cvName, setCvName] = useState(data?.name || "");
  const [isRenaming, setIsRenaming] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const debouncedRename = useDebouncedCallback((value) => {
    setCvName(value);
    if (onRename) onRename(value);
  }, 400);

  const handleDownload = () => setShowModal(true);

  if (isNew) {
    return (
      <button
        onClick={onCreate}
        className={`${
          isGrid ? "w-full sm:w-[260px] aspect-[210/297]" : "w-full h-[60px]"
        } flex items-center justify-center bg-white border-2 border-dashed border-gray-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition text-gray-500`}
      >
        <PlusIcon className="w-5 h-5" />
        <span className="ml-2 text-sm font-medium">{t("createNewCV")}</span>
      </button>
    );
  }

  return (
    <>
      <div
        className={`relative group overflow-hidden border border-gray-200 shadow-sm bg-white transition rounded-2xl ${
          isGrid
            ? "w-full sm:w-[260px] aspect-[210/297]"
            : "w-full h-[60px] flex items-center gap-4 px-4"
        }`}
      >
        {isGrid ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
  <div className="w-[210px] h-[297px] scale-[1.7] sm:scale-[1] md:scale-[1] lg:scale-[1] xl:scale-[1.1] origin-center">
    <CVPreview
      data={data.data || {}}
      dynamicSteps={data.dynamic_steps || []}
      settings={data.settings || { template: "luna" }}
      currentCVId={data.id}
      isCompact
    />
  </div>
</div>


            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10">
              <div className="backdrop-blur-md bg-white/60 rounded-2xl p-4 w-full h-full flex flex-col items-center justify-center text-black/80">
                <div className="text-center mb-4 px-4">
                  {isRenaming ? (
                    <input
                      value={cvName}
                      onChange={(e) => debouncedRename(e.target.value)}
                      onBlur={() => setIsRenaming(false)}
                      onKeyDown={(e) => e.key === "Enter" && setIsRenaming(false)}
                      autoFocus
                      className="text-sm font-semibold text-center border rounded-md px-2 py-1 text-black bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div
                      onClick={() => setIsRenaming(true)}
                      className="font-semibold text-sm truncate cursor-pointer"
                    >
                      {cvName}
                    </div>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {t("lastEdited")}: {formatRelativeDate(data.updated_at, t)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onSelect}
                    title={t("edit")}
                    className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition"
                  >
                    <PencilIcon className="w-4 h-4 text-black/70" />
                  </button>
                  <button
                    onClick={onSelect}
                    title={t("view")}
                    className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition"
                  >
                    <EyeIcon className="w-4 h-4 text-black/70" />
                  </button>
                  <button
                    onClick={onDuplicate}
                    title={t("duplicate")}
                    className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition"
                  >
                    <DocumentDuplicateIcon className="w-4 h-4 text-black/70" />
                  </button>
                  <button
                    onClick={onDelete}
                    title={t("delete")}
                    className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition"
                  >
                    <TrashIcon className="w-4 h-4 text-red-500" />
                  </button>
                  <button
                    onClick={handleDownload}
                    title={t("download")}
                    className="p-2 rounded-lg bg-white/40 hover:bg-white/60 transition"
                  >
                    <ArrowDownTrayIcon
                      className={`w-4 h-4 ${isSubscribed ? "text-black/70" : "text-gray-400"}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-between overflow-hidden">
            <div className="truncate">
              {isRenaming ? (
                <input
                  value={cvName}
                  onChange={(e) => debouncedRename(e.target.value)}
                  onBlur={() => setIsRenaming(false)}
                  onKeyDown={(e) => e.key === "Enter" && setIsRenaming(false)}
                  autoFocus
                  className="text-sm font-medium border rounded-md px-2 py-0.5 w-full max-w-[160px] focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              ) : (
                <span
                  onClick={() => setIsRenaming(true)}
                  className="text-sm font-medium text-gray-800 cursor-pointer truncate"
                >
                  {cvName}
                </span>
              )}
            </div>

            <span className="text-xs text-gray-500 mx-auto text-center w-32">
              {formatRelativeDate(data.updated_at, t)}
            </span>

            <div className="flex gap-2 shrink-0">
              <button onClick={onSelect} title={t("edit")}>
                <PencilIcon className="w-4 h-4 text-gray-600 hover:text-black" />
              </button>
              <button onClick={onDuplicate} title={t("duplicate")}>
                <DocumentDuplicateIcon className="w-4 h-4 text-gray-600 hover:text-black" />
              </button>
              <button onClick={onDelete} title={t("delete")}>
                <TrashIcon className="w-4 h-4 text-red-600 hover:text-red-700" />
              </button>
              <button onClick={handleDownload} title={t("download")}>
                <ArrowDownTrayIcon
                  className={`w-4 h-4 ${
                    isSubscribed ? "text-gray-600 hover:text-black" : "text-gray-400"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      <DownloadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        cvData={data}
        settings={data.settings}
      />
    </>
  );
}

export default CVCard;
