import { PLACEHOLDER_IMAGE } from "./config.js";

let lightbox;
let lightboxImage;
let lightboxClose;

export function inicializarGallery() {
  lightbox = document.querySelector("#image-lightbox");
  lightboxImage = document.querySelector("#lightbox-image");
  lightboxClose = document.querySelector("#lightbox-close");

  if (!lightbox || !lightboxImage || !lightboxClose) {
    return;
  }

  lightboxClose.addEventListener("click", cerrarLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      cerrarLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      cerrarLightbox();
    }
  });
}

export function abrirLightbox(src, alt = "") {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightboxImage.src = src || PLACEHOLDER_IMAGE;
  lightboxImage.alt = alt;
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("lightbox-open");
}

export function cerrarLightbox() {
  if (!lightbox || !lightboxImage) {
    return;
  }

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.src = "";
  lightboxImage.alt = "";
  document.body.classList.remove("lightbox-open");
}