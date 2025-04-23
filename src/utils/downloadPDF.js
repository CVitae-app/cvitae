import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const applyStylesRecursively = (source, clone) => {
  const computed = window.getComputedStyle(source);
  for (let prop of computed) {
    try {
      clone.style.setProperty(prop, computed.getPropertyValue(prop));
    } catch {}
  }

  [...source.children].forEach((child, i) => {
    applyStylesRecursively(child, clone.children[i]);
  });
};

const prepareClone = (element) => {
  const clone = element.cloneNode(true);
  applyStylesRecursively(element, clone);

  Object.assign(clone.style, {
    height: `${element.scrollHeight}px`,
    width: `${element.offsetWidth}px`,
    background: "#fff",
    backgroundColor: "#fff",
    color: "#000",
    boxSizing: "border-box",
    boxShadow: "none",
    filter: "none",
    padding: window.getComputedStyle(element).padding,
    position: "absolute",
    left: "-9999px",
    top: "0",
    zIndex: "-1",
  });

  clone.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.loading = "eager";
  });

  const sidebar = clone.querySelector(".sidebar");
  if (sidebar) {
    Object.assign(sidebar.style, {
      overflow: "visible",
      height: "auto",
      maxHeight: "none",
      backgroundColor: sidebar.style.backgroundColor || "transparent",
    });

    sidebar.querySelectorAll("li > div").forEach((dot) => {
      dot.style.marginTop = "2px";
    });

    const sidebarInner = sidebar.querySelector(".sidebar-inner");
    if (sidebarInner) {
      Object.assign(sidebarInner.style, {
        overflow: "visible",
        height: "auto",
        maxHeight: "none",
        backgroundColor: sidebarInner.style.backgroundColor || "transparent",
      });
    }
  }

  clone.querySelectorAll("*").forEach((node) => {
    node.style.boxShadow = "none";
    node.style.filter = "none";
    node.style.backgroundImage = "none";
  });

  return clone;
};

const captureCanvas = async (element) => {
  const clone = prepareClone(element);
  document.body.appendChild(clone);

  const canvas = await html2canvas(clone, {
    scale: 2.5,
    useCORS: true,
    backgroundColor: "#fff",
    scrollY: -window.scrollY,
    logging: false,
    imageTimeout: 1500,
    allowTaint: false,
  });

  document.body.removeChild(clone);
  return canvas;
};

const sanitizeFilename = (name) =>
  name ? name.replace(/\s+/g, "-").replace(/[^\w-]/g, "").trim() : "";

const generateFileName = ({ cvName = "", firstName = "", lastName = "" } = {}) => {
  const base = sanitizeFilename(cvName) ||
    sanitizeFilename(`${firstName}-${lastName}`) ||
    "cvitae";
  const date = new Date().toISOString().split("T")[0];
  return `${base}-${date}`;
};

export const downloadCV = async (target, personalData = {}) => {
  const element =
    typeof target === "string"
      ? document.querySelector(target)
      : target instanceof HTMLElement
      ? target
      : null;

  if (!element) {
    console.error("No valid target element found for PDF export.");
    return;
  }

  try {
    const canvas = await captureCanvas(element);
    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const A4_WIDTH = 595.28;
    const A4_HEIGHT = 841.89;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: [A4_WIDTH, A4_HEIGHT],
    });

    const imgWidth = A4_WIDTH;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
    pdf.save(`${generateFileName(personalData)}.pdf`);
  } catch (error) {
    console.error("Failed to export PDF:", error);
  }
};
