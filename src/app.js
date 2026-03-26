// src/app.js
const sourceSelect = document.getElementById("source-crs");
const targetSelect = document.getElementById("target-crs");
const errorMsg = document.getElementById("error-msg");

const labelInX = document.getElementById('label-in-x');
const labelInY = document.getElementById('label-in-y');
const labelOutX = document.getElementById('label-out-x');
const labelOutY = document.getElementById('label-out-y');

const formatToggle = document.getElementById('format-toggle');
const inputDdGroup = document.getElementById('input-dd-group');
const inputDmsGroup = document.getElementById('input-dms-group');

function isGeographic(code) {
    const def = proj4.defs(code);
    if (!def) return false;
    return def.projName === 'longlat' || def.units === 'degrees' || def.units === 'm' === false;
}

function updateLabels() {
    const from = window.tsSource ? window.tsSource.getValue() : "EPSG:4326";
    const to = window.tsTarget ? window.tsTarget.getValue() : "EPSG:32750";

    const isFromGeo = isGeographic(from);
    const isToGeo = isGeographic(to);

    labelInX.innerText = isFromGeo ? "Longitude (deg):" : "Easting (X, meter):";
    labelInY.innerText = isFromGeo ? "Latitude (deg):" : "Northing (Y, meter):";

    labelOutX.innerText = isToGeo ? "Longitude (deg):" : "Easting (X, meter):";
    labelOutY.innerText = isToGeo ? "Latitude (deg):" : "Northing (Y, meter):";

    // UX Input: Matikan opsi DMS jika Source CRS adalah UTM/Meter
    if (!isFromGeo) {
        formatToggle.value = "dd";
        formatToggle.disabled = true;
        inputDdGroup.classList.remove('hidden');
        inputDmsGroup.classList.add('hidden');
    } else {
        formatToggle.disabled = false;
    }
}

formatToggle.addEventListener('change', (e) => {
    if (e.target.value === 'dms') {
        inputDdGroup.classList.add('hidden');
        inputDmsGroup.classList.remove('hidden');
    } else {
        inputDdGroup.classList.remove('hidden');
        inputDmsGroup.classList.add('hidden');
    }
});

function parseDMS() {
    let lonD = parseFloat(document.getElementById('lon-d').value) || 0;
    let lonM = parseFloat(document.getElementById('lon-m').value) || 0;
    let lonS = parseFloat(document.getElementById('lon-s').value) || 0;
    let lonDir = document.getElementById('lon-dir').value;

    let latD = parseFloat(document.getElementById('lat-d').value) || 0;
    let latM = parseFloat(document.getElementById('lat-m').value) || 0;
    let latS = parseFloat(document.getElementById('lat-s').value) || 0;
    let latDir = document.getElementById('lat-dir').value;

    let x = Math.abs(lonD) + (lonM / 60) + (lonS / 3600);
    if (lonDir === 'W') x = -x;

    let y = Math.abs(latD) + (latM / 60) + (latS / 3600);
    if (latDir === 'S') y = -y;

    return [x, y];
}

function toDMS(dd, isLat) {
    const dir = dd < 0 ? (isLat ? 'S' : 'W') : (isLat ? 'N' : 'E');
    const absDd = Math.abs(dd);
    const d = Math.floor(absDd);
    const m = Math.floor((absDd - d) * 60);
    const s = ((absDd - d - m / 60) * 3600).toFixed(2);
    return `${d}° ${m}' ${s}" ${dir}`;
}

function initCRS() {
    const initialOptions = window.CRS_DATABASE.map(crs => {
        proj4.defs(crs.code, crs.proj4);
        return { value: crs.code, text: `${crs.code} - ${crs.name}` };
    });

    const tomSelectConfig = {
        valueField: 'value',
        labelField: 'text',
        searchField: ['text', 'value'],
        options: initialOptions,
        loadThrottle: 400,

        load: async function (query, callback) {
            if (query.length < 2) return callback();
            try {
                const res = await fetch(`https://epsg.io/?format=json&q=${encodeURIComponent(query)}`);
                const json = await res.json();
                const results = json.results.map(item => {
                    const code = `EPSG:${item.code}`;
                    if (item.proj4) proj4.defs(code, item.proj4);
                    return { value: code, text: `${code} - ${item.name}` };
                });
                callback(results);
            } catch (e) {
                callback();
            }
        },
        onChange: function () {
            updateLabels();
        }
    };

    window.tsSource = new TomSelect("#source-crs", tomSelectConfig);
    window.tsTarget = new TomSelect("#target-crs", tomSelectConfig);

    window.tsSource.setValue("EPSG:4326");
    window.tsTarget.setValue("EPSG:32750");

    updateLabels();
}

async function convert() {
    try {
        errorMsg.classList.add("hidden");

        const from = window.tsSource.getValue();
        const to = window.tsTarget.getValue();
        let x, y;

        if (formatToggle.value === 'dms' && isGeographic(from)) {
            [x, y] = parseDMS();
        } else {
            x = parseFloat(document.getElementById('input-x').value);
            y = parseFloat(document.getElementById('input-y').value);
        }

        if (isNaN(x) || isNaN(y)) throw "Input koordinat tidak valid.";
        if (!from || !to) throw "Sistem koordinat Source dan Target harus diisi.";

        if (!proj4.defs[from]) {
            const crs = await window.loadCRS(from.split(":")[1]);
            if (!crs) throw `CRS ${from} tidak ditemukan.`;
        }
        if (!proj4.defs[to]) {
            const crs = await window.loadCRS(to.split(":")[1]);
            if (!crs) throw `CRS ${to} tidak ditemukan.`;
        }

        const result = proj4(from, to, [x, y]);
        const isToGeo = isGeographic(to);

        // LOGIKA OUTPUT BARU: Otomatis tampilkan DMS + Desimal jika target Geografis
        if (isToGeo) {
            document.getElementById('output-x').value = `${toDMS(result[0], false)}\nDD: ${result[0].toFixed(8)}`;
            document.getElementById('output-y').value = `${toDMS(result[1], true)}\nDD: ${result[1].toFixed(8)}`;
        } else {
            document.getElementById('output-x').value = result[0].toFixed(3);
            document.getElementById('output-y').value = result[1].toFixed(3);
        }

        const mapCoords = proj4(from, "EPSG:4326", [x, y]);
        const lat = mapCoords[1];
        const lon = mapCoords[0];

        window.marker.setLatLng([lat, lon]);
        window.map.flyTo([lat, lon], 12, { duration: 1.5 });
        window.marker.bindPopup(`<b>Titik Terkonversi</b><br>Lat: ${lat.toFixed(5)}<br>Lon: ${lon.toFixed(5)}`).openPopup();

    } catch (err) {
        errorMsg.textContent = err;
        errorMsg.classList.remove("hidden");
    }
}

document.getElementById("btn-convert").addEventListener("click", convert);
initCRS();