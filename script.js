let map;
let geojsonLayer;
const communes = ['97121', '97129', '97111'];

function initMap() {
    map = L.map('map').setView([16.25, -61.58], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function generateDVFLink(feature) {
    const commune = feature.properties.commune || '';
    const prefixe = feature.properties.prefixe || '000';
    const section = feature.properties.section || '';
    const numero = feature.properties.numero || '';
    
    const code = `${commune}${prefixe.padStart(3, '0')}${section}${numero.padStart(4, '0')}`;
    const lat = feature.geometry.coordinates[0][0][1];
    const lng = feature.geometry.coordinates[0][0][0];
    
    return `https://explore.data.gouv.fr/fr/immobilier?onglet=carte&filtre=tous&level=parcelle&code=${code}&lat=${lat}&lng=${lng}&zoom=17.66`;
}

function generateGeoportailUrbanismeLink(lat, lon) {
    return `https://www.geoportail-urbanisme.gouv.fr/map/#tile=4&lon=${lon}&lat=${lat}&zoom=19&mlon=${lon}&mlat=${lat}`;
}

function generateGeoportailLink(lat, lon) {
    return `https://www.geoportail.gouv.fr/carte?c=${lon},${lat}&z=20&l0=ORTHOIMAGERY.ORTHOPHOTOS::GEOPORTAIL:OGC:WMTS(1)&l1=CADASTRALPARCELS.PARCELLAIRE_EXPRESS::GEOPORTAIL:OGC:WMTS(1)&l2=LANDUSE.AGRICULTURE2016::GEOPORTAIL:OGC:WMTS(0.6)&permalink=yes`;
}

function createPopupContent(feature) {
    const dvfLink = generateDVFLink(feature);
    const lat = feature.geometry.coordinates[0][0][1];
    const lon = feature.geometry.coordinates[0][0][0];
    const geoportailUrbanismeLink = generateGeoportailUrbanismeLink(lat, lon);
    const geoportailLink = generateGeoportailLink(lat, lon);
    return `
        Contenance: ${feature.properties.contenance}<br>
        Prefixe: ${feature.properties.prefixe}<br>
        Section: ${feature.properties.section}<br>
        Numero: ${feature.properties.numero}<br>
        <a href="${dvfLink}" target="_blank">View DVF Data</a><br>
        <a href="${geoportailUrbanismeLink}" target="_blank">View on Géoportail de l'urbanisme</a><br>
        <a href="${geoportailLink}" target="_blank">View on Géoportail</a>
    `;
}

function loadGeoJSON(commune) {
    fetch(`./data/cadastre-${commune}-parcelles.json`)
        .then(response => response.json())
        .then(data => {
            if (geojsonLayer) {
                map.removeLayer(geojsonLayer);
            }
            geojsonLayer = L.geoJSON(data, {
                style: {
                    fillColor: '#3388ff',
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                },
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(createPopupContent(feature));
                }
            }).addTo(map);
            map.fitBounds(geojsonLayer.getBounds());
        });
}


function searchParcelles() {
    const commune = document.getElementById('commune-select').value;
    const contenance = document.getElementById('contenance-input').value;
    const prefixe = document.getElementById('prefixe-input').value;
    const section = document.getElementById('section-input').value;
    const numero = document.getElementById('numero-input').value;

    if (!commune) {
        alert('Please select a commune');
        return;
    }

    fetch(`./data/cadastre-${commune}-parcelles.json`)
    .then(response => response.json())
    .then(data => {
        let filteredFeatures = data.features.filter(feature => {
            return (
                (!prefixe || feature.properties.prefixe === prefixe) &&
                (!section || feature.properties.section === section) &&
                (!numero || feature.properties.numero === numero)
            );
        });

        let inaccurateSearch = false;

        if (contenance) {
            const exactMatches = filteredFeatures.filter(feature =>
            feature.properties.contenance == contenance
            );

            if (exactMatches.length === 0) {
                inaccurateSearch = true;
                const contenanceValue = parseFloat(contenance);
                filteredFeatures = filteredFeatures.filter(feature => {
                    const featureContenance = parseFloat(feature.properties.contenance);
                    return featureContenance >= (contenanceValue - 10) && featureContenance <= (contenanceValue + 10);
                });
            } else {
                filteredFeatures = exactMatches;
            }
        }

        if (geojsonLayer) {
            map.removeLayer(geojsonLayer);
        }

        geojsonLayer = L.geoJSON({
            type: 'FeatureCollection',
            features: filteredFeatures
        }, {
            style: {
                fillColor: '#ff7800',
                weight: 1,
                opacity: 1,
                color: 'white',
                fillOpacity: 0.7
            },
            onEachFeature: (feature, layer) => {
                layer.bindPopup(createPopupContent(feature));
            }
        }).addTo(map);

        if (filteredFeatures.length > 0) {
            map.fitBounds(geojsonLayer.getBounds());
            displayResults(filteredFeatures, inaccurateSearch);
        } else {
            alert('No parcelles found matching the search criteria');
            clearResults();
        }
    });
}

function displayResults(features, inaccurateSearch) {
    const resultsList = document.getElementById('results');
    resultsList.innerHTML = '';

    if (inaccurateSearch) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning';
        warningDiv.textContent = 'Warning: Showing approximate results for contenance (±10 range).';
        resultsList.appendChild(warningDiv);
    }

    features.forEach((feature, index) => {
        const li = document.createElement('li');
        li.textContent = `Parcelle ${index + 1}: ${feature.properties.prefixe} ${feature.properties.section} ${feature.properties.numero} (Contenance: ${feature.properties.contenance})`;
        li.addEventListener('click', () => focusOnParcelle(feature));
        resultsList.appendChild(li);
    });
}

function clearResults() {
    document.getElementById('results').innerHTML = '';
}

function focusOnParcelle(feature) {
    const bounds = L.geoJSON(feature).getBounds();
    map.fitBounds(bounds, { maxZoom: 18 });
    const popup = L.popup()
        .setLatLng(bounds.getCenter())
        .setContent(createPopupContent(feature))
        .openOn(map);
}

document.addEventListener('DOMContentLoaded', () => {
    initMap();

    document.getElementById('commune-select').addEventListener('change', (e) => {
        loadGeoJSON(e.target.value);
    });

    document.getElementById('search-btn').addEventListener('click', searchParcelles);
});
