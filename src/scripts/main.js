"use strict";

// DOM-element
const searchForm = document.getElementById("searchForm");
const locationInput = document.getElementById("locationInput");

// Skapa en Leaflet-karta i en ny <div id="map">
let map = L.map("map").setView([59.3293, 18.0686], 12); // Stockholm

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Lägg till en initial markör i Stockholm
let marker = L.marker([59.3293, 18.0686])
    .addTo(map)
    .bindPopup("Stockholm - Startplats")
    .openPopup();

// Lyssna på sökningen
searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = locationInput.value.trim();
    if (!query) return;

    try {
        console.log(`Söker efter: ${query}`);

        // Hämta koordinater från Nominatim
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
        const data = await response.json();
        console.log("API-data:", data);

        if (data.length === 0) {
            alert("Platsen hittades inte!");
            return;
        }

        const { lat, lon, display_name } = data[0];
        console.log(`Koordinater: ${lat}, ${lon}`);

        // Uppdatera kartan
        marker.setLatLng([lat, lon]).setPopupContent(display_name).openPopup();
        map.setView([lat, lon], 12);

        // Hämta Wikipedia-info
        fetchWikipediaInfo(query);
    } catch (error) {
        console.error("Fel vid hämtning av platsdata:", error);
    }
});

// Hämta Wikipedia-info
async function fetchWikipediaInfo(place) {
    const wikiUrl = `https://sv.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exintro=true&titles=${place}`;

    try {
        const response = await fetch(wikiUrl);
        const data = await response.json();
        console.log("Wikipedia-data:", data);

        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];

        if (pageId === "-1") {
            alert("Ingen Wikipedia-info hittades.");
            return;
        }

        const extract = pages[pageId].extract;
        let wikiDiv = document.getElementById("wikiInfo");

        if (!wikiDiv) {
            wikiDiv = document.createElement("div");
            wikiDiv.id = "wikiInfo";
            document.body.appendChild(wikiDiv);
        }

        wikiDiv.innerHTML = extract;
    } catch (error) {
        console.error("Fel vid hämtning av Wikipedia-data:", error);
    }
}
