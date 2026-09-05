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
