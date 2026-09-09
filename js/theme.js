const THEME_KEY = "theme";

function obtenerTemaInicial() {
  const guardado = localStorage.getItem(THEME_KEY);

  if (guardado === "light" || guardado === "dark") {
    return guardado;
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

function actualizarBotonTema(tema) {
  const boton = document.querySelector("#theme-toggle");

  if (!boton) {
    return;
  }

  const icono = boton.querySelector("i");
  const esClaro = tema === "light";

  if (icono) {
    icono.className = esClaro
      ? "fa-solid fa-sun"
      : "fa-solid fa-moon";
  }

  boton.setAttribute(
    "aria-label",
    esClaro
      ? "Cambiar a modo oscuro"
      : "Cambiar a modo claro"
  );
}

export function inicializarTema() {
  const tema = obtenerTemaInicial();

  document.documentElement.dataset.theme = tema;
  actualizarBotonTema(tema);

  const boton = document.querySelector("#theme-toggle");

  boton?.addEventListener("click", () => {
    const nuevoTema =
      document.documentElement.dataset.theme === "dark"
        ? "light"
        : "dark";

    document.documentElement.dataset.theme = nuevoTema;
    localStorage.setItem(THEME_KEY, nuevoTema);

    actualizarBotonTema(nuevoTema);
  });
}