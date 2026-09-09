import { state } from "./state.js";
import { PLACEHOLDER_IMAGE } from "./config.js";
import {
  calcularDescuento,
  escapeHTML,
  formatoPrecio,
  obtenerCodigo,
  obtenerImagenesProducto,
  obtenerImagenPrincipal,
  obtenerNombre
} from "./utils.js";
import { abrirLightbox } from "./gallery.js";
import { crearWhatsAppUrl } from "./whatsapp.js";
import { activateTab } from "./navigation.js";

export function obtenerProductosRelacionados(producto, limite = 4) {
  const codigoActual = obtenerCodigo(producto);
  const categoria = String(producto?.categoria ?? "").trim();

  return state.productosCatalogo
    .filter((item) => {
      if (!item || item === producto) {
        return false;
      }

      if (item.nombre === "" || item.nombre === undefined) {
        return false;
      }

      const codigo = obtenerCodigo(item);

      return (
        codigo &&
        codigo !== codigoActual &&
        String(item.categoria ?? "").trim() === categoria
      );
    })
    .slice(0, limite);
}

function crearBotonWhatsApp(producto) {
  const url = crearWhatsAppUrl(producto);

  return `
    <a
      class="product-whatsapp"
      href="${url}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Consultar ${escapeHTML(obtenerNombre(producto))} por WhatsApp"
    >
      <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>
      Consultar por WhatsApp
    </a>
  `;
}

function crearImagenErrorHandler() {
  return (event) => {
    if (!event.currentTarget.src.endsWith(PLACEHOLDER_IMAGE)) {
      event.currentTarget.src = PLACEHOLDER_IMAGE;
    }
  };
}

function crearHTMLRelacionado(productos) {
  if (!productos.length) {
    return "";
  }

  const cards = productos
    .map((producto) => {
      const nombre = escapeHTML(obtenerNombre(producto));
      const codigo = escapeHTML(obtenerCodigo(producto));
      const imagen = escapeHTML(obtenerImagenPrincipal(producto));
      const precio = formatoPrecio(producto.Precio);
      const precioAnterior = formatoPrecio(producto["precio tachado"]);
      const descuento = calcularDescuento(
        producto.Precio,
        producto["precio tachado"]
      );

      return `
        <article
          class="related-card"
          data-product-code="${codigo}"
          role="button"
          tabindex="0"
          aria-label="Ver ${nombre}"
        >
          <div class="related-card-image">
            <img src="${imagen}" alt="${nombre}" loading="lazy">
          </div>

          <div class="related-card-info">
            <h4 class="related-card-name">${nombre}</h4>

            <div class="related-card-prices">
              ${
                precio
                  ? `<span class="related-card-price">${precio}</span>`
                  : ""
              }

              ${
                precioAnterior
                  ? `<span class="related-card-old-price">${precioAnterior}</span>`
                  : ""
              }
            </div>

            ${
              descuento
                ? `<span class="discount-badge">-${descuento}%</span>`
                : ""
            }
          </div>
        </article>
      `;
    })
    .join("");

  return `
    <div class="related-products">
      <h3>También te puede interesar</h3>
      <div class="related-grid">
        ${cards}
      </div>
    </div>
  `;
}

function configurarGaleriaDetalle(producto, imagenes) {
  const mainImage = document.querySelector("#detail-main-image");
  const mainImageElement = document.querySelector("#detail-main-image img");
  const thumbnails = document.querySelectorAll(".detail-thumbnail");

  if (!mainImage || !mainImageElement) {
    return;
  }

  const actualizarImagen = (src, alt, thumbnail) => {
    mainImageElement.src = src || PLACEHOLDER_IMAGE;
    mainImageElement.alt = alt;

    thumbnails.forEach((item) => {
      const activo = item === thumbnail;
      item.classList.toggle("active", activo);
      item.setAttribute("aria-pressed", String(activo));
    });
  };

  mainImage.addEventListener("click", () => {
    abrirLightbox(mainImageElement.src, mainImageElement.alt);
  });

  mainImageElement.addEventListener("error", crearImagenErrorHandler());

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => {
      const src = imagenes[index] || PLACEHOLDER_IMAGE;
      actualizarImagen(src, obtenerNombre(producto), thumbnail);
    });

    thumbnail.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        thumbnail.click();
      }
    });
  });
}

function configurarRelacionados() {
  document.querySelectorAll(".related-card").forEach((card) => {
    const abrir = () => {
      abrirDetallePorCodigo(card.dataset.productCode);
    };

    card.addEventListener("click", abrir);

    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        abrir();
      }
    });

    const image = card.querySelector("img");

    if (image) {
      image.addEventListener("error", crearImagenErrorHandler());
    }
  });
}

export function mostrarDetalleProducto(producto, updateUrl = true) {
  const detalle = document.querySelector("#detalle-producto");
  const contenido = document.querySelector("#detalle-contenido");

  if (!detalle || !contenido || !producto) {
    return;
  }

  const codigo = obtenerCodigo(producto);
  const nombre = obtenerNombre(producto);
  const categoria = String(producto.categoria ?? "").trim();
  const descripcion = String(producto.descripcion ?? "").trim();
  const precio = formatoPrecio(producto.Precio);
  const precioAnterior = formatoPrecio(producto["precio tachado"]);
  const descuento = calcularDescuento(
    producto.Precio,
    producto["precio tachado"]
  );
  const imagenes = obtenerImagenesProducto(producto);
  const imagenPrincipal = imagenes[0] || obtenerImagenPrincipal(producto);
  const relacionados = obtenerProductosRelacionados(producto);

  const thumbnails = imagenes
    .map((imagen, index) => {
      const activo = index === 0;

      return `
        <button
          class="detail-thumbnail${activo ? " active" : ""}"
          type="button"
          aria-label="Ver imagen ${index + 1}"
          aria-pressed="${activo}"
        >
          <img
            src="${escapeHTML(imagen)}"
            alt="${escapeHTML(nombre)}"
            loading="lazy"
          >
        </button>
      `;
    })
    .join("");

  contenido.innerHTML = `
    <div class="product-detail">
      <div class="detail-gallery">
        <div
          id="detail-main-image"
          class="detail-main-image"
          role="button"
          tabindex="0"
          aria-label="Ampliar imagen de ${escapeHTML(nombre)}"
        >
          ${
            descuento
              ? `<span class="discount-badge">-${descuento}%</span>`
              : ""
          }

          <img
            src="${escapeHTML(imagenPrincipal)}"
            alt="${escapeHTML(nombre)}"
          >
        </div>

        ${
          thumbnails
            ? `<div class="detail-thumbnails">${thumbnails}</div>`
            : ""
        }
      </div>

      <div class="detail-info">
        ${
          categoria
            ? `<div class="detail-category">${escapeHTML(categoria)}</div>`
            : ""
        }

        ${
          codigo
            ? `<div class="detail-code">Código: ${escapeHTML(codigo)}</div>`
            : ""
        }

        <h1 class="detail-title">${escapeHTML(nombre)}</h1>

        <div class="detail-prices">
          ${
            precio
              ? `<span class="detail-price">${precio}</span>`
              : ""
          }

          ${
            precioAnterior
              ? `<span class="detail-old-price">${precioAnterior}</span>`
              : ""
          }
        </div>

        ${
          descripcion
            ? `<p class="detail-description">${escapeHTML(descripcion)}</p>`
            : ""
        }

        ${crearBotonWhatsApp(producto)}
      </div>
    </div>

    ${crearHTMLRelacionado(relacionados)}
  `;

  configurarGaleriaDetalle(producto, imagenes);
  configurarRelacionados();

  detalle.classList.add("active-section");

  document.querySelectorAll(".content-section").forEach((section) => {
    if (section.id !== "detalle-producto") {
      section.classList.remove("active-section");
    }
  });

  document.querySelectorAll(".tab-link").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.target === "catalogo");
    tab.setAttribute(
      "aria-selected",
      String(tab.dataset.target === "catalogo")
    );
  });

  localStorage.setItem("activeTab", "catalogo");

  if (updateUrl && codigo) {
    history.pushState(
      null,
      "",
      `#producto-${encodeURIComponent(codigo)}`
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

export function abrirDetallePorCodigo(codigo, updateUrl = false) {
  const codigoBuscado = String(codigo ?? "").trim();

  if (!codigoBuscado) {
    activateTab("catalogo", false);
    return;
  }

  const producto = state.productosCatalogo.find((item) => {
    return (
      item &&
      item.nombre &&
      obtenerCodigo(item) === codigoBuscado
    );
  });

  if (!producto) {
    activateTab("catalogo", false);
    return;
  }

  state.categoriaActual = String(producto.categoria ?? "").trim();

  mostrarDetalleProducto(producto, updateUrl);
}