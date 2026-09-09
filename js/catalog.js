import { PRODUCTOS_URL, PLACEHOLDER_IMAGE } from "./config.js";
import { state } from "./state.js";
import {
  calcularDescuento,
  escapeHTML,
  esCategoria,
  formatoPrecio,
  obtenerCodigo,
  obtenerImagenPrincipal,
  obtenerNombre
} from "./utils.js";
import { crearWhatsAppUrl } from "./whatsapp.js";
import { abrirDetallePorCodigo, mostrarDetalleProducto } from "./products.js";

function mostrarEstado(mensaje) {
  const contenedor = document.querySelector("#catalogo-productos");

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = `
    <div class="catalogo-estado">
      ${escapeHTML(mensaje)}
    </div>
  `;
}

function crearCardProducto(producto) {
  const codigo = obtenerCodigo(producto);
  const nombre = obtenerNombre(producto);
  const imagen = obtenerImagenPrincipal(producto);
  const categoria = String(producto.categoria ?? "").trim();

  const precio = formatoPrecio(producto.Precio);
  const precioAnterior = formatoPrecio(producto["precio tachado"]);
  const descuento = calcularDescuento(
    producto.Precio,
    producto["precio tachado"]
  );

  const descripcion = String(producto.descripcion ?? "").trim();
  const whatsappUrl = crearWhatsAppUrl(producto);

  const article = document.createElement("article");

  article.className = "product-card";
  article.dataset.productId = codigo;
  article.setAttribute("role", "button");
  article.setAttribute("tabindex", "0");
  article.setAttribute(
    "aria-label",
    `Ver ${nombre || "producto"}`
  );

  article.innerHTML = `
    <div class="product-image-wrapper">
      ${
        descuento
          ? `<span class="discount-badge">-${descuento}%</span>`
          : ""
      }

      <img
        src="${escapeHTML(imagen)}"
        alt="${escapeHTML(nombre)}"
        loading="lazy"
      >
    </div>

    <div class="product-info">
      ${
        categoria
          ? `<div class="product-category">${escapeHTML(categoria)}</div>`
          : ""
      }

      ${
        codigo
          ? `<div class="product-code">Código: ${escapeHTML(codigo)}</div>`
          : ""
      }

      <h3 class="product-name">${escapeHTML(nombre)}</h3>

      <div class="product-prices">
        ${
          precio
            ? `<span class="product-price">${precio}</span>`
            : ""
        }

        ${
          precioAnterior
            ? `<span class="product-old-price">${precioAnterior}</span>`
            : ""
        }
      </div>

      ${
        descripcion
          ? `<p class="product-description">${escapeHTML(descripcion)}</p>`
          : ""
      }

      <a
        class="product-whatsapp"
        href="${whatsappUrl}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar ${escapeHTML(nombre)} por WhatsApp"
      >
        <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
        WhatsApp
      </a>
    </div>
  `;

  const image = article.querySelector("img");

  if (image) {
    image.addEventListener("error", (event) => {
      if (!event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) {
        event.currentTarget.src = PLACEHOLDER_IMAGE;
      }
    });
  }

  article.addEventListener("click", (event) => {
    if (event.target.closest(".product-whatsapp")) {
      return;
    }

    mostrarDetalleProducto(producto);
  });

  article.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    if (event.target.closest(".product-whatsapp")) {
      return;
    }

    event.preventDefault();
    mostrarDetalleProducto(producto);
  });

  return article;
}

export function renderizarCatalogo(productos) {
  const contenedor = document.querySelector("#catalogo-productos");

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = "";

  let categoria = "";

  productos.forEach((producto) => {
    if (esCategoria(producto)) {
      categoria = String(producto["Cod."] ?? "").trim();
      return;
    }

    if (!obtenerNombre(producto)) {
      return;
    }

    producto.categoria = categoria;

    contenedor.appendChild(crearCardProducto(producto));
  });

  if (!contenedor.children.length) {
    mostrarEstado("No hay productos disponibles.");
  }
}

export async function cargarCatalogo() {
  mostrarEstado("Cargando catálogo...");

  try {
    const response = await fetch(PRODUCTOS_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const productos = await response.json();

    if (!Array.isArray(productos)) {
      throw new Error("El catálogo no contiene un array válido.");
    }

    state.productosCatalogo = productos;

    renderizarCatalogo(productos);

    return productos;
  } catch (error) {
    console.error("Error al cargar el catálogo:", error);
    mostrarEstado("No se pudo cargar el catálogo.");
    return [];
  }
}