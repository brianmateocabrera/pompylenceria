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

let productosBase = [];
let categoriaSeleccionada = "Todos";
let terminoBusqueda = "";
let ordenSeleccionado = "relevancia";

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

function obtenerProductosReales(productos) {
  const resultado = [];
  let categoriaActual = "";

  productos.forEach((producto) => {
    if (!producto || typeof producto !== "object") {
      return;
    }

    if (esCategoria(producto)) {
      categoriaActual = String(
        producto["Cod."] ?? ""
      ).trim();

      return;
    }

    const nombre = obtenerNombre(producto);

    if (!nombre) {
      return;
    }

    producto.categoria = categoriaActual;
    resultado.push(producto);
  });

  return resultado;
}

function obtenerCategorias(productos) {
  const categorias = new Set();

  productos.forEach((producto) => {
    const categoria = String(
      producto.categoria ?? ""
    ).trim();

    if (categoria) {
      categorias.add(categoria);
    }
  });

  return [...categorias];
}

function obtenerPrecioNumerico(valor) {
  const numero = Number(
    String(valor ?? "")
      .replace(/\./g, "")
      .replace(",", ".")
  );

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function aplicarFiltros() {
  let resultado = [...productosBase];

  if (categoriaSeleccionada !== "Todos") {
    resultado = resultado.filter(
      (producto) =>
        String(
          producto.categoria ?? ""
        ).trim() === categoriaSeleccionada
    );
  }

  const termino = terminoBusqueda
    .trim()
    .toLocaleLowerCase("es-AR");

  if (termino) {
    resultado = resultado.filter((producto) => {
      const nombre = String(
        obtenerNombre(producto)
      ).toLocaleLowerCase("es-AR");

      const codigo = String(
        obtenerCodigo(producto)
      ).toLocaleLowerCase("es-AR");

      const categoria = String(
        producto.categoria ?? ""
      ).toLocaleLowerCase("es-AR");

      const descripcion = String(
        producto.descripcion ?? ""
      ).toLocaleLowerCase("es-AR");

      return (
        nombre.includes(termino) ||
        codigo.includes(termino) ||
        categoria.includes(termino) ||
        descripcion.includes(termino)
      );
    });
  }

  switch (ordenSeleccionado) {
    case "nombre-asc":
      resultado.sort((a, b) =>
        obtenerNombre(a).localeCompare(
          obtenerNombre(b),
          "es-AR",
          { sensitivity: "base" }
        )
      );
      break;

    case "precio-asc":
      resultado.sort(
        (a, b) =>
          obtenerPrecioNumerico(a.Precio) -
          obtenerPrecioNumerico(b.Precio)
      );
      break;

    case "precio-desc":
      resultado.sort(
        (a, b) =>
          obtenerPrecioNumerico(b.Precio) -
          obtenerPrecioNumerico(a.Precio)
      );
      break;

    case "descuento-desc":
      resultado.sort(
        (a, b) =>
          (calcularDescuento(
            b.Precio,
            b["precio tachado"]
          ) ?? 0) -
          (calcularDescuento(
            a.Precio,
            a["precio tachado"]
          ) ?? 0)
      );
      break;

    case "relevancia":
    default:
      break;
  }

  return resultado;
}

function actualizarContador(cantidad) {
  const contador = document.querySelector(
    "#catalogo-resultados"
  );

  if (!contador) {
    return;
  }

  contador.textContent =
    cantidad === 1
      ? "1 producto"
      : `${cantidad} productos`;
}

function actualizarCategorias() {
  const contenedor = document.querySelector(
    "#catalogo-categorias"
  );

  if (!contenedor) {
    return;
  }

  const categorias = obtenerCategorias(
    productosBase
  );

  contenedor.innerHTML = [
    "Todos",
    ...categorias
  ]
    .map(
      (categoria) => `
        <button
          class="catalog-category ${
            categoria === categoriaSeleccionada
              ? "active"
              : ""
          }"
          type="button"
          data-category="${escapeHTML(categoria)}"
          aria-pressed="${
            categoria === categoriaSeleccionada
          }"
        >
          ${escapeHTML(categoria)}
        </button>
      `
    )
    .join("");
}

function crearToolbar() {
  const section = document.querySelector(
    "#catalogo"
  );

  const grid = document.querySelector(
    "#catalogo-productos"
  );

  if (!section || !grid) {
    return;
  }

  const existente = section.querySelector(
    ".catalog-toolbar"
  );

  if (existente) {
    return;
  }

  const toolbar =
    document.createElement("div");

  toolbar.className = "catalog-toolbar";

  toolbar.innerHTML = `
    <div class="catalog-toolbar-main">

      <label
        class="catalog-search"
        for="catalogo-busqueda"
      >
        <input
          id="catalogo-busqueda"
          type="search"
          placeholder="Buscar productos..."
          autocomplete="off"
          spellcheck="false"
        >

        <i
          class="fa-solid fa-magnifying-glass catalog-search-icon"
          aria-hidden="true"
        ></i>
      </label>

      <span
        id="catalogo-resultados"
        class="catalog-results-count"
        aria-live="polite"
      >
        0 productos
      </span>

      <select
        id="catalogo-orden"
        class="catalog-control"
        aria-label="Ordenar productos"
      >
        <option value="relevancia">
          Ordenar
        </option>
        <option value="nombre-asc">
          Nombre: A-Z
        </option>
        <option value="precio-asc">
          Precio: menor a mayor
        </option>
        <option value="precio-desc">
          Precio: mayor a menor
        </option>
        <option value="descuento-desc">
          Mayor descuento
        </option>
      </select>
    </div>

    <div
      id="catalogo-categorias"
      class="catalog-categories"
      aria-label="Categorías"
    ></div>
  `;

  section.insertBefore(toolbar, grid);

  const busqueda = toolbar.querySelector(
    "#catalogo-busqueda"
  );

  const orden = toolbar.querySelector(
    "#catalogo-orden"
  );

  busqueda?.addEventListener(
    "input",
    (event) => {
      terminoBusqueda = event.target.value;
      renderizarResultados();
    }
  );

  orden?.addEventListener(
    "change",
    (event) => {
      ordenSeleccionado =
        event.target.value;

      renderizarResultados();
    }
  );

  toolbar.addEventListener(
    "click",
    (event) => {
      const boton =
        event.target.closest(
          ".catalog-category"
        );

      if (!boton) {
        return;
      }

      categoriaSeleccionada =
        boton.dataset.category || "Todos";

      actualizarCategorias();
      renderizarResultados();
    }
  );

  actualizarCategorias();
}

function crearCardProducto(producto) {
  const codigo = obtenerCodigo(producto);
  const nombre = obtenerNombre(producto);
  const imagen = obtenerImagenPrincipal(producto);
  const categoria = String(
    producto.categoria ?? ""
  ).trim();

  const precio = formatoPrecio(
    producto.Precio
  );

  const precioAnterior = formatoPrecio(
    producto["precio tachado"]
  );

  const descuento = calcularDescuento(
    producto.Precio,
    producto["precio tachado"]
  );

  const descripcion = String(
    producto.descripcion ?? ""
  ).trim();

  const whatsappUrl =
    crearWhatsAppUrl(producto);

  const article =
    document.createElement("article");

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
          ? `
            <span
              class="discount-badge"
              aria-label="Descuento del ${descuento}%"
            >
              -${descuento}%
            </span>
          `
          : ""
      }

      <img
        src="${escapeHTML(imagen)}"
        alt="${escapeHTML(
          nombre || "Producto"
        )}"
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
                      ${escapeHTML(precio)}
                    </span>
                  `
                  : ""
              }

              ${
                precioAnterior
                  ? `
                    <span class="product-old-price">
                      ${escapeHTML(
                        precioAnterior
                      )}
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
        href="${escapeHTML(
          whatsappUrl
        )}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Consultar ${escapeHTML(
          nombre
        )} por WhatsApp"
      >
        <i
          class="fa-brands fa-whatsapp"
          aria-hidden="true"
        ></i>

        <span>Consultar</span>
      </a>

    </div>
  `;

  const image =
    article.querySelector("img");

  image?.addEventListener(
    "error",
    () => {
      if (
        image.dataset.fallbackApplied ===
        "true"
      ) {
        return;
      }

      image.dataset.fallbackApplied =
        "true";

      image.src = PLACEHOLDER_IMAGE;
    }
  );

  article.addEventListener(
    "click",
    (event) => {
      if (
        event.target.closest(
          ".product-whatsapp"
        )
      ) {
        return;
      }

      mostrarDetalleProducto(producto);
    }
  );

  article.addEventListener(
    "keydown",
    (event) => {
      if (
        event.target.closest(
          ".product-whatsapp"
        )
      ) {
        return;
      }

      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      event.preventDefault();

      mostrarDetalleProducto(producto);
    }
  );

  return article;
}

function renderizarResultados() {
  const productos =
    aplicarFiltros();

  renderizarCatalogo(productos);

  actualizarContador(
    productos.length
  );
}

export function renderizarCatalogo(
  productos
) {
  const contenedor = document.querySelector(
    "#catalogo-productos"
  );

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = "";

  if (
    !Array.isArray(productos) ||
    productos.length === 0
  ) {
    mostrarEstado(
      terminoBusqueda ||
      categoriaSeleccionada !== "Todos"
        ? "No encontramos productos con esos criterios."
        : "No hay productos disponibles."
    );

    return;
  }

  const fragment =
    document.createDocumentFragment();

  productos.forEach((producto) => {
    fragment.appendChild(
      crearCardProducto(producto)
    );
  });

  contenedor.appendChild(fragment);
}

export async function cargarCatalogo() {
  mostrarEstado(
    "Cargando catálogo..."
  );

  try {
    const response = await fetch(
      PRODUCTOS_URL,
      {
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const productos =
      await response.json();

    if (!Array.isArray(productos)) {
      throw new Error(
        "El catálogo no contiene un array válido."
      );
    }

    state.productosCatalogo =
      productos;

    productosBase =
      obtenerProductosReales(
        productos
      );

    crearToolbar();

    renderizarResultados();

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