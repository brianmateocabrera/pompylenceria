const tabs = document.querySelectorAll(".tab-link");
const sections = document.querySelectorAll(".content-section");

const PRODUCTOS_URL = "data/productos.json";
const IMAGES_PATH = "images/";
const PLACEHOLDER_IMAGE = "images/no-image.webp";
const WHATSAPP_NUMBER = "543518189444";

let productosCatalogo = [];
let categoriaActual = "";


/* =========================
   UTILIDADES
========================= */

function escapeHTML(valor) {
    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatoPrecio(valor) {
    const numero = Number(
        String(valor ?? "")
            .replace(/\./g, "")
            .replace(",", ".")
    );

    if (!Number.isFinite(numero)) {
        return "";
    }

    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(numero);
}

function esCategoria(producto) {
    return (
        String(producto["Cod."] ?? "").trim() !== "" &&
        String(producto.nombre ?? "").trim() === "" &&
        String(producto.Precio ?? "").trim() === ""
    );
}

function obtenerImagenPrincipal(producto) {
    const imagen = String(producto["imagen1"] ?? "").trim();

    if (!imagen) {
        return PLACEHOLDER_IMAGE;
    }

    return `${IMAGES_PATH}${imagen}`;
}


/* =========================
   NAVEGACIÓN PRINCIPAL
========================= */

function activarTabVisual(targetId) {
    tabs.forEach(tab => {
        const active = tab.dataset.target === targetId;

        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active);
    });
}

function activateTab(targetId, updateUrl = true) {
    const targetSection = document.getElementById(targetId);
    const targetTab = document.querySelector(
        `[data-target="${targetId}"]`
    );

    if (!targetSection || !targetTab) {
        return;
    }

    activarTabVisual(targetId);

    sections.forEach(section => {
        section.classList.toggle(
            "active",
            section === targetSection
        );
    });

    localStorage.setItem("activeTab", targetId);

    if (updateUrl) {
        history.pushState(
            null,
            "",
            `#${targetId}`
        );
    }
}


/* =========================
   DETALLE DE PRODUCTO
========================= */

function mostrarDetalleProducto(producto, updateUrl = true) {
    const detalle = document.getElementById("detalle-producto");
    const contenido = document.getElementById("detalle-contenido");

    if (!detalle || !contenido || !producto) {
        return;
    }

    const codigo = String(producto["Cod."] ?? "").trim();
    const nombre = String(producto.nombre ?? "").trim();
    const descripcion = String(producto.descripcion ?? "").trim();
    const precio = formatoPrecio(producto.Precio);
    const precioTachado = formatoPrecio(producto["precio tachado"]);
    const imagen = obtenerImagenPrincipal(producto);

    contenido.innerHTML = `
        <article class="product-detail">

            <div class="product-detail-image-wrapper">
                <img
                    class="product-detail-image"
                    src="${escapeHTML(imagen)}"
                    alt="${escapeHTML(nombre)}"
                >
            </div>

            <div class="product-detail-info">

                ${
                    categoriaActual
                        ? `<span class="product-detail-category">
                            ${escapeHTML(categoriaActual)}
                        </span>`
                        : ""
                }

                ${
                    codigo
                        ? `<span class="product-detail-code">
                            ${escapeHTML(codigo)}
                        </span>`
                        : ""
                }

                <h2 class="product-detail-title">
                    ${escapeHTML(nombre)}
                </h2>

                <div class="product-detail-prices">
                    ${
                        precio
                            ? `<span class="product-detail-price">
                                ${escapeHTML(precio)}
                            </span>`
                            : ""
                    }

                    ${
                        precioTachado
                            ? `<span class="product-detail-old-price">
                                ${escapeHTML(precioTachado)}
                            </span>`
                            : ""
                    }
                </div>

                ${
                    descripcion
                        ? `<p class="product-detail-description">
                            ${escapeHTML(descripcion)}
                        </p>`
                        : ""
                }

                <a
                    class="product-whatsapp"
                    href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                        `Info de ${nombre} ${codigo}.`
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <i class="fa-brands fa-whatsapp"></i>
                    Consultar
                </a>

            </div>

        </article>
    `;

    const imagenElemento = contenido.querySelector(
        ".product-detail-image"
    );

    imagenElemento.addEventListener("error", () => {
        if (
            imagenElemento.src.endsWith(
                PLACEHOLDER_IMAGE
            )
        ) {
            return;
        }

        imagenElemento.src = PLACEHOLDER_IMAGE;
    });

    sections.forEach(section => {
        section.classList.toggle(
            "active",
            section === detalle
        );
    });

    // El detalle pertenece al flujo del catálogo.
    activarTabVisual("catalogo");

    localStorage.setItem("activeTab", "catalogo");

    if (updateUrl) {
        history.pushState(
            null,
            "",
            `#producto-${encodeURIComponent(codigo)}`
        );
    }
}

function abrirDetallePorCodigo(codigo, updateUrl = false) {
    const producto = productosCatalogo.find(
        item =>
            String(item["Cod."] ?? "").trim() ===
            String(codigo).trim()
    );

    if (!producto) {
        activateTab("catalogo", updateUrl);
        return;
    }

    // Recuperar la categoría correspondiente al producto.
    categoriaActual = "";

    for (const item of productosCatalogo) {
        if (esCategoria(item)) {
            categoriaActual = String(
                item["Cod."] ?? ""
            ).trim();
            continue;
        }

        if (
            String(item["Cod."] ?? "").trim() ===
            String(codigo).trim()
        ) {
            break;
        }
    }

    mostrarDetalleProducto(producto, updateUrl);
}


/* =========================
   CATÁLOGO
========================= */

function renderizarCatalogo(productos) {
    const contenedor = document.getElementById(
        "catalogo-productos"
    );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    let categoria = "";

    productos.forEach(producto => {
        if (esCategoria(producto)) {
            categoria = String(
                producto["Cod."] ?? ""
            ).trim();

            return;
        }

        const codigo = String(
            producto["Cod."] ?? ""
        ).trim();

        const nombre = String(
            producto.nombre ?? ""
        ).trim();

        if (!nombre) {
            return;
        }

        const precio = formatoPrecio(
            producto.Precio
        );

        const precioTachado = formatoPrecio(
            producto["precio tachado"]
        );

        const descripcion = String(
            producto.descripcion ?? ""
        ).trim();

        const imagen = obtenerImagenPrincipal(
            producto
        );

        const tarjeta = document.createElement(
            "article"
        );

        tarjeta.className = "product-card";
        tarjeta.dataset.productId = codigo;
        tarjeta.setAttribute("role", "button");
        tarjeta.setAttribute("tabindex", "0");
        tarjeta.setAttribute(
            "aria-label",
            `Ver detalle de ${nombre}`
        );

        tarjeta.innerHTML = `
            <div class="product-image-wrapper">
                <img
                    class="product-image"
                    src="${escapeHTML(imagen)}"
                    alt="${escapeHTML(nombre)}"
                    loading="lazy"
                >
            </div>

            <div class="product-info">

                ${
                    categoria
                        ? `<span class="product-category">
                            ${escapeHTML(categoria)}
                        </span>`
                        : ""
                }

                ${
                    codigo
                        ? `<span class="product-code">
                            ${escapeHTML(codigo)}
                        </span>`
                        : ""
                }

                <h3 class="product-name">
                    ${escapeHTML(nombre)}
                </h3>

                <div class="product-prices">

                    ${
                        precio
                            ? `<span class="product-price">
                                ${escapeHTML(precio)}
                            </span>`
                            : ""
                    }

                    ${
                        precioTachado
                            ? `<span class="product-old-price">
                                ${escapeHTML(precioTachado)}
                            </span>`
                            : ""
                    }

                </div>

                ${
                    descripcion
                        ? `<p class="product-description">
                            ${escapeHTML(descripcion)}
                        </p>`
                        : ""
                }

                <a
                    class="product-whatsapp"
                    href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                        `Info de ${nombre} ${codigo}.`
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Consultar ${escapeHTML(nombre)} por WhatsApp"
                >
                    <i class="fa-brands fa-whatsapp"></i>
                    Consultar
                </a>

            </div>
        `;

        const imagenElemento =
            tarjeta.querySelector(
                ".product-image"
            );

        imagenElemento.addEventListener(
            "error",
            () => {
                if (
                    imagenElemento.src.endsWith(
                        PLACEHOLDER_IMAGE
                    )
                ) {
                    return;
                }

                imagenElemento.src =
                    PLACEHOLDER_IMAGE;
            }
        );

        tarjeta.addEventListener("click", () => {
            categoriaActual = categoria;
            mostrarDetalleProducto(producto);
        });

        tarjeta.addEventListener(
            "keydown",
            event => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    categoriaActual = categoria;
                    mostrarDetalleProducto(producto);
                }
            }
        );

        // Evita que el clic en WhatsApp abra también el detalle.
        const whatsapp =
            tarjeta.querySelector(
                ".product-whatsapp"
            );

        whatsapp.addEventListener(
            "click",
            event => {
                event.stopPropagation();
            }
        );

        contenedor.appendChild(tarjeta);
    });
}

async function cargarCatalogo() {
    const contenedor = document.getElementById(
        "catalogo-productos"
    );

    if (!contenedor) {
        return;
    }

    try {
        const respuesta = await fetch(
            PRODUCTOS_URL
        );

        if (!respuesta.ok) {
            throw new Error(
                `HTTP ${respuesta.status}`
            );
        }

        productosCatalogo =
            await respuesta.json();

        renderizarCatalogo(
            productosCatalogo
        );

        // Si la URL ya apunta a un producto,
        // abrirlo una vez cargado el JSON.
        manejarHash();

    } catch (error) {
        console.error(
            "Error al cargar el catálogo:",
            error
        );

        contenedor.innerHTML = `
            <p class="catalogo-estado">
                No se pudo cargar el catálogo.
            </p>
        `;
    }
}


/* =========================
   VOLVER AL CATÁLOGO
========================= */

document
    .getElementById("volver-catalogo")
    ?.addEventListener("click", () => {
        activateTab("catalogo");
    });


/* =========================
   TABS
========================= */

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        activateTab(
            tab.dataset.target
        );
    });
});


/* =========================
   HASH / HISTORIAL
========================= */

function manejarHash() {
    const hash = decodeURIComponent(
        window.location.hash.slice(1)
    );

    if (hash.startsWith("producto-")) {
        const codigo = hash.slice(
            "producto-".length
        );

        if (productosCatalogo.length) {
            abrirDetallePorCodigo(
                codigo,
                false
            );
        }

        return;
    }

    const target =
        hash ||
        localStorage.getItem("activeTab") ||
        "portada";

    activateTab(target, false);
}

window.addEventListener(
    "hashchange",
    manejarHash
);

window.addEventListener(
    "popstate",
    manejarHash
);


/* =========================
   INICIO
========================= */

manejarHash();
cargarCatalogo();