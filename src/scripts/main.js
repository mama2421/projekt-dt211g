"use strict";

/**
 * Växlar mellan ljus och mörkt tema.
 */
document.body.classList.toggle("dark-theme");

/** @type {HTMLFormElement | null} */
const searchForm = document.getElementById("searchForm");
/** @type {HTMLInputElement | null} */
const locationInput = document.getElementById("locationInput");

/**
 * Skapar en Leaflet-karta och sätter startpositionen till Stockholm.
 * @type {L.Map}
 */
let map = L.map("map").setView([59.3293, 18.0686], 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

/**
 * Marker på kartan som representerar en plats.
 * @type {L.Marker}
 */
let marker = L.marker([59.3293, 18.0686])
    .addTo(map)
    .bindPopup("Stockholm - Startplats")
    .openPopup();

if (searchForm && locationInput) {
    /**
     * Lyssnar på formulärets submit-händelse för att söka efter en plats.
     * @param {Event} e - Submit-händelsen
     */
    searchForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const query = locationInput.value.trim();
        if (!query) return;

        try {
            console.log(`Söker efter: ${query}`);
            
            /** @type {Response} */
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
            /** @type {Array} */
            const data = await response.json();
            console.log("API-data:", data);

            if (data.length === 0) {
                alert("Platsen hittades inte!");
                return;
            }

            const { lat, lon, display_name } = data[0];
            console.log(`Koordinater: ${lat}, ${lon}`);

            marker.setLatLng([lat, lon]).setPopupContent(display_name).openPopup();
            map.setView([lat, lon], 12);

            fetchWikipediaInfo(display_name);
        } catch (error) {
            console.error("Fel vid hämtning av platsdata:", error);
        }
    });
}

/**
 * Lyssnar på klick på kartan och hämtar platsinformation.
 * @param {L.LeafletMouseEvent} e - Klickhändelsen
 */
map.on("click", async function (e) {
    const { lat, lng } = e.latlng;
    console.log(`Klickade på: ${lat}, ${lng}`);

    try {
        /** @type {Response} */
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        /** @type {Object} */
        const data = await response.json();
        console.log("Klick-data:", data);

        const display_name = data.display_name || "Okänd plats";

        marker.setLatLng([lat, lng]).setPopupContent(display_name).openPopup();
        map.setView([lat, lng], 12);

        fetchWikipediaInfo(display_name);
    } catch (error) {
        console.error("Fel vid hämtning av platsinfo:", error);
    }
});

/**
 * Hämtar information och bild om en plats från Wikipedia.
 * @param {string} place - Platsens namn
 * @returns {Promise<void>}
 */
async function fetchWikipediaInfo(place) {
    let cleanPlace = place.split(",")[0].trim();
    const wikiUrl = `https://sv.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts|pageimages&exintro=true&pithumbsize=300&titles=${cleanPlace}`;

    try {
        /** @type {Response} */
        const response = await fetch(wikiUrl);
        /** @type {Object} */
        const data = await response.json();
        console.log("Wikipedia-data:", data);

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        let wikiDiv = document.getElementById("wikiInfo");
        if (!wikiDiv) {
            wikiDiv = document.createElement("div");
            wikiDiv.id = "wikiInfo";
            wikiDiv.classList.add('wiki-info');
            document.body.appendChild(wikiDiv);
        }

        if (pageId === "-1") {
            wikiDiv.innerHTML = `<p>Ingen Wikipedia-info hittades för <strong>${cleanPlace}</strong>.</p>`;
            return;
        }

        const page = pages[pageId];
        const extract = page.extract || "Ingen ytterligare information tillgänglig.";
        const wikiLink = `https://sv.wikipedia.org/wiki/${cleanPlace.replace(" ", "_")}`;
        const imageUrl = page.thumbnail ? page.thumbnail.source : null;

        wikiDiv.innerHTML = `
            <h3>${cleanPlace}</h3>
            ${imageUrl ? `<img src="${imageUrl}" alt="Bild på ${cleanPlace}" style="max-width: 100%; height: auto;">` : ""}
            ${extract}
            <p><a href="${wikiLink}" target="_blank">Läs mer på Wikipedia</a></p>
        `;
    } catch (error) {
        console.error("Fel vid hämtning av Wikipedia-data:", error);
    }
}
