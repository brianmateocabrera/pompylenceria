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

function obtenerNumero(valor) {
    const numero = Number(
        String(valor ?? "")
            .replace(/\./g, "")
            .replace(",", ".")
    );

    return Number.isFinite(numero)
        ? numero
        : null;
}

function calcularDescuento(precio, precioTachado) {
    const actual = obtenerNumero(precio);
    const anterior = obtenerNumero(precioTachado);

    if (
        actual === null ||
        anterior === null ||
        anterior <= 0 ||
        actual >= anterior
    ) {
        return null;
    }

    return Math.round(
        ((anterior - actual) / anterior) * 100
    );
}

function esCategoria(producto) {
    return (
        String(producto["Cod."] ?? "").trim() !== "" &&
        String(producto.nombre ?? "").trim() === "" &&
        String(producto.Precio ?? "").trim() === ""
    );
}

function obtenerImagenPrincipal(producto) {
    const imagen = String(
        producto["imagen1"] ?? ""
    ).trim();

    if (!imagen) {
        return PLACEHOLDER_IMAGE;
    }

    return `${IMAGES_PATH}${imagen}`;
}

function obtenerImagenesProducto(producto) {
    const claves = [
        "imagen1",
        "imagen2",
        "imagen3",
        "imagen 4",
        "imagen 5",
        "imagen 6",
        "imagen 7",
        "imagen 8"
    ];

    return claves
        .map(clave =>
            String(producto[clave] ?? "").trim()
        )
        .filter(Boolean)
        .map(nombre =>
            `${IMAGES_PATH}${nombre}`
        );
}


/* =========================
   LIGHTBOX
========================= */

const lightbox =
    document.getElementById("image-lightbox");

const lightboxImage =
    document.getElementById("lightbox-image");

const lightboxClose =
    document.getElementById("lightbox-close");

function abrirLightbox(src, alt = "") {
    if (
        !lightbox ||
        !lightboxImage
    ) {
        return;
    }

    lightboxImage.src = src;
    lightboxImage.alt = alt;

    lightbox.classList.add("active");
    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.classList.add(
        "lightbox-open"
    );
}

function cerrarLightbox() {
    if (!lightbox) {
        return;
    }

    lightbox.classList.remove("active");
    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.classList.remove(
        "lightbox-open"
    );
}

lightboxClose?.addEventListener(
    "click",
    cerrarLightbox
);

lightbox?.addEventListener(
    "click",
    event => {
        if (
            event.target === lightbox
        ) {
            cerrarLightbox();
        }
    }
);

document.addEventListener(
    "keydown",
    event => {
        if (
            event.key === "Escape"
        ) {
            cerrarLightbox();
        }
    }
);


/* =========================
   NAVEGACIÓN PRINCIPAL
========================= */

function activarTabVisual(targetId) {
    tabs.forEach(tab => {
        const active =
            tab.dataset.target === targetId;

        tab.classList.toggle(
            "active",
            active
        );

        tab.setAttribute(
            "aria-selected",
            active
        );
    });
}

function activateTab(
    targetId,
    updateUrl = true
) {
    const targetSection =
        document.getElementById(targetId);

    const targetTab =
        document.querySelector(
            `[data-target="${targetId}"]`
        );

    if (
        !targetSection ||
        !targetTab
    ) {
        return;
    }

    cerrarLightbox();

    activarTabVisual(targetId);

    sections.forEach(section => {
        section.classList.toggle(
            "active",
            section === targetSection
        );
    });

    localStorage.setItem(
        "activeTab",
        targetId
    );

    if (updateUrl) {
        history.pushState(
            null,
            "",
            `#${targetId}`
        );
    }
}


/* =========================
   PRODUCTOS RELACIONADOS
========================= */

function obtenerProductosRelacionados(
    producto,
    limite = 4
) {
    const codigoActual =
        String(
            producto["Cod."] ?? ""
        ).trim();

    const categoria =
        String(
            producto.categoria ?? ""
        ).trim();

    if (!categoria) {
        return [];
    }

    return productosCatalogo
        .filter(item => {
            if (esCategoria(item)) {
                return false;
            }

            const codigo =
                String(
                    item["Cod."] ?? ""
                ).trim();

            const nombre =
                String(
                    item.nombre ?? ""
                ).trim();

            const categoriaItem =
                String(
                    item.categoria ?? ""
                ).trim();

            return (
                codigo &&
                codigo !== codigoActual &&
                nombre &&
                categoriaItem === categoria
            );
        })
        .slice(0, limite);
}


/* =========================
   DETALLE DE PRODUCTO
========================= */

function mostrarDetalleProducto(
    producto,
    updateUrl = true
) {
    const detalle =
        document.getElementById(
            "detalle-producto"
        );

    const contenido =
        document.getElementById(
            "detalle-contenido"
        );

    if (
        !detalle ||
        !contenido ||
        !producto
    ) {
        return;
    }

    const codigo =
        String(
            producto["Cod."] ?? ""
        ).trim();

    const nombre =
        String(
            producto.nombre ?? ""
        ).trim();

    const descripcion =
        String(
            producto.descripcion ?? ""
        ).trim();

    const categoria =
        String(
            producto.categoria ?? ""
        ).trim();

    const precio =
        formatoPrecio(
            producto.Precio
        );

    const precioTachado =
        formatoPrecio(
            producto["precio tachado"]
        );

    const descuento =
        calcularDescuento(
            producto.Precio,
            producto["precio tachado"]
        );

    const imagenes =
        obtenerImagenesProducto(
            producto
        );

    const relacionados =
        obtenerProductosRelacionados(
            producto
        );

    const imagenPrincipal =
        imagenes[0] ||
        PLACEHOLDER_IMAGE;

    contenido.innerHTML = `
        <article class="product-detail">

            <div class="product-detail-gallery">

                <div class="product-detail-image-wrapper">

                    ${
                        descuento
                            ? `
                                <span class="product-discount-badge">
                                    -${descuento}%
                                </span>
                            `
                            : ""
                    }

                    <img
                        class="product-detail-image"
                        src="${escapeHTML(
                            imagenPrincipal
                        )}"
                        alt="${escapeHTML(
                            nombre
                        )}"
                    >

                </div>

                ${
                    imagenes.length > 1
                        ? `
                            <div
                                class="product-detail-thumbnails"
                                aria-label="Imágenes del producto"
                            >
                                ${imagenes
                                    .map(
                                        (
                                            imagen,
                                            indice
                                        ) => `
                                            <button
                                                class="product-detail-thumbnail ${
                                                    indice === 0
                                                        ? "active"
                                                        : ""
                                                }"
                                                type="button"
                                                data-image="${escapeHTML(
                                                    imagen
                                                )}"
                                                aria-label="Ver imagen ${
                                                    indice + 1
                                                }"
                                                aria-pressed="${
                                                    indice === 0
                                                }"
                                            >
                                                <img
                                                    src="${escapeHTML(
                                                        imagen
                                                    )}"
                                                    alt=""
                                                    loading="lazy"
                                                >
                                            </button>
                                        `
                                    )
                                    .join("")}
                            </div>
                        `
                        : ""
                }

            </div>

            <div class="product-detail-info">

                ${
                    categoria
                        ? `
                            <span class="product-detail-category">
                                ${escapeHTML(
                                    categoria
                                )}
                            </span>
                        `
                        : ""
                }

                ${
                    codigo
                        ? `
                            <span class="product-detail-code">
                                ${escapeHTML(
                                    codigo
                                )}
                            </span>
                        `
                        : ""
                }

                <h2 class="product-detail-title">
                    ${escapeHTML(nombre)}
                </h2>

                <div class="product-detail-prices">

                    ${
                        precio
                            ? `
                                <span class="product-detail-price">
                                    ${escapeHTML(
                                        precio
                                    )}
                                </span>
                            `
                            : ""
                    }

                    ${
                        precioTachado
                            ? `
                                <span class="product-detail-old-price">
                                    ${escapeHTML(
                                        precioTachado
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                ${
                    descuento
                        ? `
                            <span class="product-detail-saving">
                                Ahorrás un ${descuento}%
                            </span>
                        `
                        : ""
                }

                ${
                    descripcion
                        ? `
                            <p class="product-detail-description">
                                ${escapeHTML(
                                    descripcion
                                )}
                            </p>
                        `
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

        ${
            relacionados.length
                ? `
                    <section
                        class="related-products"
                        aria-labelledby="related-products-title"
                    >

                        <h3 id="related-products-title">
                            También te puede interesar
                        </h3>

                        <div class="related-products-grid">

                            ${relacionados
                                .map(
                                    relacionado => {
                                        const codigoRelacionado =
                                            String(
                                                relacionado["Cod."] ?? ""
                                            ).trim();

                                        const nombreRelacionado =
                                            String(
                                                relacionado.nombre ?? ""
                                            ).trim();

                                        const precioRelacionado =
                                            formatoPrecio(
                                                relacionado.Precio
                                            );

                                        const precioTachadoRelacionado =
                                            formatoPrecio(
                                                relacionado[
                                                    "precio tachado"
                                                ]
                                            );

                                        const descuentoRelacionado =
                                            calcularDescuento(
                                                relacionado.Precio,
                                                relacionado[
                                                    "precio tachado"
                                                ]
                                            );

                                        const imagenRelacionada =
                                            obtenerImagenPrincipal(
                                                relacionado
                                            );

                                        return `
                                            <article
                                                class="related-product-card"
                                                data-related-product="${escapeHTML(
                                                    codigoRelacionado
                                                )}"
                                                tabindex="0"
                                                role="button"
                                                aria-label="Ver ${escapeHTML(
                                                    nombreRelacionado
                                                )}"
                                            >

                                                <div class="related-product-image-wrapper">

                                                    ${
                                                        descuentoRelacionado
                                                            ? `
                                                                <span class="product-discount-badge">
                                                                    -${descuentoRelacionado}%
                                                                </span>
                                                            `
                                                            : ""
                                                    }

                                                    <img
                                                        class="related-product-image"
                                                        src="${escapeHTML(
                                                            imagenRelacionada
                                                        )}"
                                                        alt="${escapeHTML(
                                                            nombreRelacionado
                                                        )}"
                                                        loading="lazy"
                                                    >

                                                </div>

                                                <div class="related-product-info">

                                                    <span class="related-product-code">
                                                        ${escapeHTML(
                                                            codigoRelacionado
                                                        )}
                                                    </span>

                                                    <h4 class="related-product-name">
                                                        ${escapeHTML(
                                                            nombreRelacionado
                                                        )}
                                                    </h4>

                                                    <div class="related-product-prices">

                                                        ${
                                                            precioRelacionado
                                                                ? `
                                                                    <span class="related-product-price">
                                                                        ${escapeHTML(
                                                                            precioRelacionado
                                                                        )}
                                                                    </span>
                                                                `
                                                                : ""
                                                        }

                                                        ${
                                                            precioTachadoRelacionado
                                                                ? `
                                                                    <span class="related-product-old-price">
                                                                        ${escapeHTML(
                                                                            precioTachadoRelacionado
                                                                        )}
                                                                    </span>
                                                                `
                                                                : ""
                                                        }

                                                    </div>

                                                </div>

                                            </article>
                                        `;
                                    }
                                )
                                .join("")}

                        </div>

                    </section>
                `
                : ""
        }
    `;


    /* =========================
       IMAGEN PRINCIPAL
    ========================= */

    const imagenElemento =
        contenido.querySelector(
            ".product-detail-image"
        );

    if (imagenElemento) {
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

        imagenElemento.addEventListener(
            "click",
            () => {
                abrirLightbox(
                    imagenElemento.src,
                    imagenElemento.alt
                );
            }
        );
    }


    /* =========================
       MINIATURAS
    ========================= */

    const miniaturas =
        contenido.querySelectorAll(
            ".product-detail-thumbnail"
        );

    miniaturas.forEach(
        miniatura => {
            const imagenMiniatura =
                miniatura.querySelector(
                    "img"
                );

            imagenMiniatura?.addEventListener(
                "error",
                () => {
                    imagenMiniatura.src =
                        PLACEHOLDER_IMAGE;
                }
            );

            miniatura.addEventListener(
                "click",
                () => {
                    if (
                        !imagenElemento
                    ) {
                        return;
                    }

                    const nuevaImagen =
                        miniatura.dataset.image;

                    imagenElemento.src =
                        nuevaImagen;

                    miniaturas.forEach(
                        item => {
                            const activa =
                                item === miniatura;

                            item.classList.toggle(
                                "active",
                                activa
                            );

                            item.setAttribute(
                                "aria-pressed",
                                activa
                            );
                        }
                    );
                }
            );
        }
    );


    /* =========================
       PRODUCTOS RELACIONADOS
    ========================= */

    const tarjetasRelacionadas =
        contenido.querySelectorAll(
            ".related-product-card"
        );

    tarjetasRelacionadas.forEach(
        tarjeta => {
            const codigoRelacionado =
                tarjeta.dataset
                    .relatedProduct;

            const imagen =
                tarjeta.querySelector(
                    ".related-product-image"
                );

            imagen?.addEventListener(
                "error",
                () => {
                    if (
                        imagen.src.endsWith(
                            PLACEHOLDER_IMAGE
                        )
                    ) {
                        return;
                    }

                    imagen.src =
                        PLACEHOLDER_IMAGE;
                }
            );

            const abrirRelacionado =
                () => {
                    abrirDetallePorCodigo(
                        codigoRelacionado,
                        true
                    );
                };

            tarjeta.addEventListener(
                "click",
                abrirRelacionado
            );

            tarjeta.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        abrirRelacionado();
                    }
                }
            );
        }
    );


    /* =========================
       MOSTRAR DETALLE
    ========================= */

    sections.forEach(
        section => {
            section.classList.toggle(
                "active",
                section === detalle
            );
        }
    );

    activarTabVisual(
        "catalogo"
    );

    localStorage.setItem(
        "activeTab",
        "catalogo"
    );

    if (updateUrl) {
        history.pushState(
            null,
            "",
            `#producto-${encodeURIComponent(
                codigo
            )}`
        );
    }
}


/* =========================
   ABRIR PRODUCTO POR CÓDIGO
========================= */

function abrirDetallePorCodigo(
    codigo,
    updateUrl = false
) {
    const codigoBuscado =
        String(codigo).trim();

    const producto =
        productosCatalogo.find(
            item =>
                !esCategoria(item) &&
                String(
                    item["Cod."] ?? ""
                ).trim() ===
                    codigoBuscado
        );

    if (!producto) {
        activateTab(
            "catalogo",
            updateUrl
        );

        return;
    }

    categoriaActual =
        String(
            producto.categoria ?? ""
        ).trim();

    mostrarDetalleProducto(
        producto,
        updateUrl
    );
}


/* =========================
   CATÁLOGO
========================= */

function renderizarCatalogo(
    productos
) {
    const contenedor =
        document.getElementById(
            "catalogo-productos"
        );

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = "";

    let categoria = "";

    productos.forEach(
        producto => {
            if (
                esCategoria(
                    producto
                )
            ) {
                categoria =
                    String(
                        producto["Cod."] ?? ""
                    ).trim();

                return;
            }

            const codigo =
                String(
                    producto["Cod."] ?? ""
                ).trim();

            const nombre =
                String(
                    producto.nombre ?? ""
                ).trim();

            if (!nombre) {
                return;
            }

            /*
             * Guardamos la categoría
             * directamente en el producto.
             */
            producto.categoria =
                categoria;

            const precio =
                formatoPrecio(
                    producto.Precio
                );

            const precioTachado =
                formatoPrecio(
                    producto[
                        "precio tachado"
                    ]
                );

            const descuento =
                calcularDescuento(
                    producto.Precio,
                    producto[
                        "precio tachado"
                    ]
                );

            const descripcion =
                String(
                    producto.descripcion ?? ""
                ).trim();

            const imagen =
                obtenerImagenPrincipal(
                    producto
                );

            const tarjeta =
                document.createElement(
                    "article"
                );

            tarjeta.className =
                "product-card";

            tarjeta.dataset.productId =
                codigo;

            tarjeta.setAttribute(
                "role",
                "button"
            );

            tarjeta.setAttribute(
                "tabindex",
                "0"
            );

            tarjeta.setAttribute(
                "aria-label",
                `Ver detalle de ${nombre}`
            );

            tarjeta.innerHTML = `
                <div class="product-image-wrapper">

                    ${
                        descuento
                            ? `
                                <span class="product-discount-badge">
                                    -${descuento}%
                                </span>
                            `
                            : ""
                    }

                    <img
                        class="product-image"
                        src="${escapeHTML(
                            imagen
                        )}"
                        alt="${escapeHTML(
                            nombre
                        )}"
                        loading="lazy"
                    >

                </div>

                <div class="product-info">

                    ${
                        categoria
                            ? `
                                <span class="product-category">
                                    ${escapeHTML(
                                        categoria
                                    )}
                                </span>
                            `
                            : ""
                    }

                    ${
                        codigo
                            ? `
                                <span class="product-code">
                                    ${escapeHTML(
                                        codigo
                                    )}
                                </span>
                            `
                            : ""
                    }

                    <h3 class="product-name">
                        ${escapeHTML(
                            nombre
                        )}
                    </h3>

                    <div class="product-prices">

                        ${
                            precio
                                ? `
                                    <span class="product-price">
                                        ${escapeHTML(
                                            precio
                                        )}
                                    </span>
                                `
                                : ""
                        }

                        ${
                            precioTachado
                                ? `
                                    <span class="product-old-price">
                                        ${escapeHTML(
                                            precioTachado
                                        )}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                    ${
                        descuento
                            ? `
                                <span class="product-saving">
                                    Ahorrás un ${descuento}%
                                </span>
                            `
                            : ""
                    }

                    ${
                        descripcion
                            ? `
                                <p class="product-description">
                                    ${escapeHTML(
                                        descripcion
                                    )}
                                </p>
                            `
                            : ""
                    }

                    <a
                        class="product-whatsapp"
                        href="https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                            `Info de ${nombre} ${codigo}.`
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Consultar ${escapeHTML(
                            nombre
                        )} por WhatsApp"
                    >
                        <i class="fa-brands fa-whatsapp"></i>
                        Consultar
                    </a>

                </div>
            `;


            /* =========================
               IMAGEN DE TARJETA
            ========================= */

            const imagenElemento =
                tarjeta.querySelector(
                    ".product-image"
                );

            imagenElemento?.addEventListener(
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


            /* =========================
               ABRIR DETALLE
            ========================= */

            const abrirDetalle =
                () => {
                    categoriaActual =
                        categoria;

                    mostrarDetalleProducto(
                        producto,
                        true
                    );
                };

            tarjeta.addEventListener(
                "click",
                event => {
                    if (
                        event.target.closest(
                            ".product-whatsapp"
                        )
                    ) {
                        return;
                    }

                    abrirDetalle();
                }
            );

            tarjeta.addEventListener(
                "keydown",
                event => {
                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {
                        event.preventDefault();

                        abrirDetalle();
                    }
                }
            );


            /* =========================
               WHATSAPP
            ========================= */

            const whatsapp =
                tarjeta.querySelector(
                    ".product-whatsapp"
                );

            whatsapp?.addEventListener(
                "click",
                event => {
                    event.stopPropagation();
                }
            );

            contenedor.appendChild(
                tarjeta
            );
        }
    );
}


/* =========================
   CARGAR CATÁLOGO
========================= */

async function cargarCatalogo() {
    const contenedor =
        document.getElementById(
            "catalogo-productos"
        );

    if (!contenedor) {
        return;
    }

    try {
        const respuesta =
            await fetch(
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
    .getElementById(
        "volver-catalogo"
    )
    ?.addEventListener(
        "click",
        () => {
            activateTab(
                "catalogo"
            );
        }
    );


/* =========================
   TABS
========================= */

tabs.forEach(tab => {
    tab.addEventListener(
        "click",
        () => {
            activateTab(
                tab.dataset.target
            );
        }
    );
});


/* =========================
   HASH / HISTORIAL
========================= */

function manejarHash() {
    const hash =
        decodeURIComponent(
            window.location.hash.slice(
                1
            )
        );

    if (
        hash.startsWith(
            "producto-"
        )
    ) {
        const codigo =
            hash.slice(
                "producto-".length
            );

        if (
            productosCatalogo.length
        ) {
            abrirDetallePorCodigo(
                codigo,
                false
            );
        }

        return;
    }

    const target =
        hash ||
        localStorage.getItem(
            "activeTab"
        ) ||
        "portada";

    activateTab(
        target,
        false
    );
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