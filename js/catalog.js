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
import { mostrarDetalleProducto } from "./products.js";

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
          ? `<span class="discount-badge" aria-label="Descuento del ${descuento}%">
              -${descuento}%
            </span>`
          : ""
      }

      <img
        src="${escapeHTML(imagen)}"
        alt="${escapeHTML(nombre || "Producto")}"
        loading="lazy"
        decoding="async"
      >
    </div>

    <div class="product-info">

      ${
        categoria
          ? `
            <div class="product-category">
              ${escapeHTML(categoria)}
            </div>
          `
          : ""
      }

      ${
        codigo
          ? `
            <div class="product-code">
              Código: ${escapeHTML(codigo)}
            </div>
          `
          : ""
      }

      <h3 class="product-name">
        ${escapeHTML(nombre)}
      </h3>

      ${
        precio || precioAnterior
          ? `
            <div class="product-prices">

              ${
                precio
                  ? `
                    <span class="product-price">
                      ${precio}
                    </span>
                  `
                  : ""
              }

              ${
                precioAnterior
                  ? `
                    <span class="product-old-price">
                      ${precioAnterior}
                    </span>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }

      ${
        descuento
          ? `
            <div class="product-saving">
              Ahorrás ${descuento}%
            </div>
          `
          : ""
      }

      ${
        descripcion
          ? `
            <p class="product-description">
              ${escapeHTML(descripcion)}
            </p>
          `
          : ""
      }

      <a
        class="product-whatsapp"
        href="${escapeHTML(whatsappUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar ${escapeHTML(nombre)} por WhatsApp"
      >
        <i
          class="fa-brands fa-whatsapp"
          aria-hidden="true"
        ></i>

        <span>Consultar</span>
      </a>

    </div>
  `;

  configurarImagen(article);
  configurarInteraccion(article, producto);

  return article;
}

function configurarImagen(article) {
  const image = article.querySelector("img");

  if (!image) {
    return;
  }

  image.addEventListener("error", () => {
    if (image.dataset.fallbackApplied === "true") {
      return;
    }

    image.dataset.fallbackApplied = "true";
    image.src = PLACEHOLDER_IMAGE;
  });
}

function configurarInteraccion(article, producto) {
  article.addEventListener("click", (event) => {
    const enlace = event.target.closest(".product-whatsapp");

    if (enlace) {
      return;
    }

    mostrarDetalleProducto(producto);
  });

  article.addEventListener("keydown", (event) => {
    if (event.target.closest(".product-whatsapp")) {
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();

    mostrarDetalleProducto(producto);
  });
}

export function renderizarCatalogo(productos) {
  const contenedor = document.querySelector("#catalogo-productos");

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = "";

  if (!Array.isArray(productos) || productos.length === 0) {
    mostrarEstado("No hay productos disponibles.");
    return;
  }

  let categoria = "";
  let cantidadRenderizada = 0;

  productos.forEach((producto) => {
    if (!producto || typeof producto !== "object") {
      return;
    }

    if (esCategoria(producto)) {
      categoria = String(producto["Cod."] ?? "").trim();
      return;
    }

    const nombre = obtenerNombre(producto);

    if (!nombre) {
      return;
    }

    /*
     * Se conserva la categoría calculada a partir
     * de las filas de categoría del JSON.
     */
    producto.categoria = categoria;

    contenedor.appendChild(
      crearCardProducto(producto)
    );

    cantidadRenderizada += 1;
  });

  if (cantidadRenderizada === 0) {
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
      throw new Error(
        "El catálogo no contiene un array válido."
      );
    }

    state.productosCatalogo = productos;

    renderizarCatalogo(productos);

    return productos;
  } catch (error) {
    console.error(
      "Error al cargar el catálogo:",
      error
    );

    mostrarEstado(
      "No se pudo cargar el catálogo."
    );

    return [];
  }
}