// src/map.js
window.map = L.map('map').setView([-2, 117], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

window.marker = L.marker([-6.91, 107.61]).addTo(map);