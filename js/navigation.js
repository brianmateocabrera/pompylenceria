import { cerrarLightbox } from "./gallery.js";

const tabs = () => document.querySelectorAll(".tab-link");
const sections = () => document.querySelectorAll(".content-section");

export function activarTabVisual(targetId) {
  tabs().forEach((tab) => {
    const activo = tab.dataset.target === targetId;

    tab.classList.toggle("active", activo);
    tab.setAttribute("aria-selected", String(activo));
  });
}

export function activateTab(targetId, updateUrl = true) {
  const section = document.getElementById(targetId);

  if (!section) {
    return false;
  }

  cerrarLightbox();

  sections().forEach((item) => {
    item.classList.toggle("active-section", item.id === targetId);
  });

  activarTabVisual(targetId);

  localStorage.setItem("activeTab", targetId);

  if (updateUrl) {
    history.pushState(null, "", `#${targetId}`);
  }

  return true;
}

export function inicializarNavegacion(onBackToCatalog) {
  tabs().forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab.dataset.target);
    });
  });

  const volver = document.querySelector("#volver-catalogo");

  if (volver && typeof onBackToCatalog === "function") {
    volver.addEventListener("click", onBackToCatalog);
  }
}