const tabs = document.querySelectorAll(".tab-link");
const sections = document.querySelectorAll(".content-section");

function activateTab(targetId, updateUrl = true) {
    const targetSection = document.getElementById(targetId);
    const targetTab = document.querySelector(`[data-target="${targetId}"]`);

    if (!targetSection || !targetTab) return;

    tabs.forEach(tab => {
        const active = tab === targetTab;

        tab.classList.toggle("active", active);
        tab.setAttribute("aria-selected", active);
    });

    sections.forEach(section => {
        section.classList.toggle("active", section === targetSection);
    });

    localStorage.setItem("activeTab", targetId);

    if (updateUrl) {
        history.replaceState(null, "", `#${targetId}`);
    }
}

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        activateTab(tab.dataset.target);
    });
});

const initialTab =
    window.location.hash.replace("#", "") ||
    localStorage.getItem("activeTab") ||
    "portada";

activateTab(initialTab, false);

window.addEventListener("hashchange", () => {
    const target = window.location.hash.replace("#", "");
    activateTab(target, false);
});


/* =========================
   CATÁLOGO
========================= */

const catalogo = document.getElementById("catalogo-productos");

const PRODUCTOS_URL = "data/productos.json";
const IMAGES_PATH = "images/";
const PLACEHOLDER_IMAGE = "images/no-image.webp";


/* Escapa texto para evitar insertar HTML proveniente del JSON */
function escapeHTML(texto) {
    const elemento = document.createElement("div");
    elemento.textContent = texto ?? "";
    return elemento.innerHTML;
}


/* Formatea los precios como pesos argentinos */
function formatoPrecio(precio) {
    if (precio === "" || precio === null || precio === undefined) {
        return "";
    }

    const numero = Number(
        String(precio)
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


/*
 * Determina si una fila del JSON es una categoría.
 *
 * Ejemplo:
 * {
 *   "Cod.": "LENCERIA",
 *   "nombre": "",
 *   "Precio": "",
 *   ...
 * }
 */
function esCategoria(producto) {
    const codigo = String(producto["Cod."] ?? "").trim();
    const nombre = String(producto["nombre"] ?? "").trim();
    const precio = String(producto["Precio"] ?? "").trim();

    return (
        codigo !== "" &&
        nombre === "" &&
        precio === ""
    );
}


/*
 * Devuelve el nombre del archivo de la primera imagen.
 *
 * El JSON debe contener:
 *
 * "imágenes": [
 *     "foto1.webp",
 *     "foto2.webp"
 * ]
 *
 * La primera imagen es la principal.
 */
function obtenerImagenPrincipal(producto) {
    const imagenes = Array.isArray(producto["imágenes"])
        ? producto["imágenes"]
        : [];

    const primeraImagen = String(imagenes[0] ?? "").trim();

    if (!primeraImagen) {
        return PLACEHOLDER_IMAGE;
    }

    return `${IMAGES_PATH}${primeraImagen}`;
}


/* Crea una tarjeta de producto */
function crearTarjeta(producto, categoria) {
    const tarjeta = document.createElement("article");

    tarjeta.className = "product-card";

    const codigo = String(producto["Cod."] ?? "").trim();
    const nombre = String(producto["nombre"] ?? "").trim();
    const descripcion = String(producto["descripcion"] ?? "").trim();

    const precio = formatoPrecio(producto["Precio"]);
    const precioTachado = formatoPrecio(producto["precio tachado"]);

    const imagen = obtenerImagenPrincipal(producto);

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

            ${categoria
                ? `<span class="product-category">
                    ${escapeHTML(categoria)}
                   </span>`
                : ""
            }

            ${codigo
                ? `<span class="product-code">
                    ${escapeHTML(codigo)}
                   </span>`
                : ""
            }

            <h3 class="product-name">
                ${escapeHTML(nombre)}
            </h3>

            <div class="product-prices">

                ${precio
                    ? `<span class="product-price">
                        ${escapeHTML(precio)}
                       </span>`
                    : ""
                }

                ${precioTachado
                    ? `<span class="product-old-price">
                        ${escapeHTML(precioTachado)}
                       </span>`
                    : ""
                }

            </div>

            ${descripcion
                ? `<p class="product-description">
                    ${escapeHTML(descripcion)}
                   </p>`
                : ""
            }

        </div>
    `;


    /*
     * Si la imagen indicada en el JSON no existe,
     * se reemplaza automáticamente por no-image.webp.
     */
    const imagenElemento = tarjeta.querySelector(".product-image");

    imagenElemento.addEventListener("error", () => {
        if (imagenElemento.src.endsWith(PLACEHOLDER_IMAGE)) {
            return;
        }

        imagenElemento.src = PLACEHOLDER_IMAGE;
    });


    return tarjeta;
}


/* Carga productos.json y genera el catálogo */
async function cargarCatalogo() {
    if (!catalogo) return;

    try {
        const respuesta = await fetch(PRODUCTOS_URL, {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const productos = await respuesta.json();

        if (!Array.isArray(productos)) {
            throw new Error("productos.json no contiene un array válido.");
        }

        catalogo.innerHTML = "";

        let categoriaActual = "";

        productos.forEach(producto => {

            /*
             * Si encontramos una fila de categoría,
             * actualizamos la categoría actual y no
             * generamos ninguna tarjeta.
             */
            if (esCategoria(producto)) {
                categoriaActual = String(
                    producto["Cod."]
                ).trim();

                return;
            }


            /*
             * Ignoramos filas que no tengan nombre.
             */
            const nombre = String(
                producto["nombre"] ?? ""
            ).trim();

            if (!nombre) {
                return;
            }


            /*
             * Generamos la tarjeta usando la categoría
             * que corresponde a ese producto.
             */
            const tarjeta = crearTarjeta(
                producto,
                categoriaActual
            );

            catalogo.appendChild(tarjeta);
        });


        if (catalogo.children.length === 0) {
            catalogo.innerHTML = `
                <p class="catalogo-estado">
                    No hay productos para mostrar.
                </p>
            `;
        }

    } catch (error) {

        console.error(
            "No se pudo cargar el catálogo:",
            error
        );

        catalogo.innerHTML = `
            <p class="catalogo-estado">
                No se pudo cargar el catálogo.
            </p>
        `;
    }
}


cargarCatalogo();
