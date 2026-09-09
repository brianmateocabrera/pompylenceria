import { state } from "./state.js";
import { inicializarGallery } from "./gallery.js";
import {
  activateTab,
  inicializarNavegacion
} from "./navigation.js";
import {
  abrirDetallePorCodigo
} from "./products.js";
import { cargarCatalogo } from "./catalog.js";
import { inicializarTema } from "./theme.js";

function manejarHash() {
  const hash = decodeURIComponent(
    window.location.hash.replace(/^#/, "")
  );

  if (hash.startsWith("producto-")) {
    const codigo = hash.slice("producto-".length);

    if (state.productosCatalogo.length) {
      abrirDetallePorCodigo(codigo, false);
    }

    return;
  }

  const target =
    hash ||
    localStorage.getItem("activeTab") ||
    "portada";

  activateTab(target, false);
}

function inicializar() {
  inicializarTema();
  inicializarGallery();

  inicializarNavegacion(() => {
    activateTab("catalogo");
  });

  window.addEventListener("hashchange", manejarHash);
  window.addEventListener("popstate", manejarHash);

  manejarHash();

  cargarCatalogo().then(() => {
    manejarHash();
  });
}

inicializar();