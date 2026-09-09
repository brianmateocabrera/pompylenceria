import { IMAGES_PATH, PLACEHOLDER_IMAGE } from "./config.js";

export function escapeHTML(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function obtenerNumero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const numero = Number(
    String(valor)
      .trim()
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isFinite(numero) ? numero : null;
}

export function formatoPrecio(valor) {
  const numero = obtenerNumero(valor);

  if (numero === null) {
    return "";
  }

  return numero.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });
}

export function calcularDescuento(precio, precioTachado) {
  const actual = obtenerNumero(precio);
  const anterior = obtenerNumero(precioTachado);

  if (
    actual === null ||
    anterior === null ||
    anterior <= 0 ||
    actual >= anterior
  ) {
    return 0;
  }

  return Math.round((1 - actual / anterior) * 100);
}

export function esCategoria(producto) {
  return Boolean(
    producto &&
    producto["Cod."] &&
    !producto.nombre &&
    !producto.Precio
  );
}

export function obtenerImagenPrincipal(producto) {
  return producto?.imagen1
    ? `${IMAGES_PATH}${producto.imagen1}`
    : PLACEHOLDER_IMAGE;
}

export function obtenerImagenesProducto(producto) {
  if (!producto) {
    return [];
  }

  const nombres = [
    "imagen1",
    "imagen2",
    "imagen3",
    "imagen 4",
    "imagen 5",
    "imagen 6",
    "imagen 7",
    "imagen 8"
  ];

  return nombres
    .map((campo) => producto[campo])
    .filter(Boolean)
    .map((imagen) => `${IMAGES_PATH}${imagen}`);
}

export function obtenerCodigo(producto) {
  return String(producto?.["Cod."] ?? "").trim();
}

export function obtenerNombre(producto) {
  return String(producto?.nombre ?? "").trim();
}