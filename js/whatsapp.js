import { WHATSAPP_NUMBER } from "./config.js";
import { obtenerCodigo, obtenerNombre } from "./utils.js";

export function crearWhatsAppUrl(producto) {
  const nombre = obtenerNombre(producto);
  const codigo = obtenerCodigo(producto);

  const texto = [
    "Hola, quiero consultar por este producto:",
    nombre ? `Producto: ${nombre}` : "",
    codigo ? `Código: ${codigo}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
}
