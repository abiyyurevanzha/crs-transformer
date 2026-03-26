// src/converter.js
window.loadCRS = async function (epsg) {
    try {
        const res = await fetch(`https://epsg.io/${epsg}.proj4`);
        const text = await res.text();

        proj4.defs(`EPSG:${epsg}`, text);

        return {
            code: `EPSG:${epsg}`,
            name: `EPSG:${epsg}`,
            proj4: text
        };
    } catch {
        return null;
    }
};