// src/crs_database.js
window.CRS_DATABASE = [
    { code: 'EPSG:4326', name: 'WGS 84', proj4: '+proj=longlat +datum=WGS84 +no_defs' },
    { code: 'EPSG:3857', name: 'Web Mercator', proj4: '+proj=merc +lon_0=0 +k=1 +datum=WGS84 +units=m +no_defs' },
    { code: 'EPSG:32750', name: 'UTM 50S (Kalimantan)', proj4: '+proj=utm +zone=50 +south +datum=WGS84 +units=m +no_defs' }
];

for (let z = 1; z <= 60; z++) {
    window.CRS_DATABASE.push({
        code: `EPSG:326${String(z).padStart(2, '0')}`,
        name: `UTM ${z}N`,
        proj4: `+proj=utm +zone=${z} +datum=WGS84 +units=m +no_defs`
    });
    window.CRS_DATABASE.push({
        code: `EPSG:327${String(z).padStart(2, '0')}`,
        name: `UTM ${z}S`,
        proj4: `+proj=utm +zone=${z} +south +datum=WGS84 +units=m +no_defs`
    });
}