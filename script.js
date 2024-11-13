let map;
let geojsonLayer;
let communeData = [];

function initMap() {
    map = L.map('map').setView([46.603354, 1.888334], 6); // Center of France
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

async function loadCommuneData() {
    try {
        const response = await fetch('./data/insee.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        const rows = data.split('\n').slice(1); // Skip header row
        communeData = rows
            .map(row => {
                const [codeInsee, nom, codePostal] = row.split(';');
                return { codeInsee, nom, codePostal };
            })
            .filter(commune => commune.codeInsee && commune.nom && commune.codePostal); // Filter out incomplete entries
        
        console.log(`Loaded ${communeData.length} communes`);
    } catch (error) {
        console.error('Error loading commune data:', error);
        alert('Erreur lors du chargement des données des communes. Veuillez réessayer plus tard.');
    }
}

function setupCommuneSearch() {
    const communeSearch = document.getElementById('commune-search');
    const communeSuggestions = document.getElementById('commune-suggestions');

    communeSearch.addEventListener('input', () => {
        const searchTerm = communeSearch.value.toLowerCase().replace(/[^a-z0-9]/g, '');
        const suggestions = communeData
            .filter(commune => 
                commune.nom && commune.nom.toLowerCase().replace(/[^a-z0-9]/g, '').includes(searchTerm)
            )
            .slice(0, 5);

        communeSuggestions.innerHTML = '';
        suggestions.forEach(commune => {
            const div = document.createElement('div');
            div.textContent = `${commune.nom} (${commune.codePostal})`;
            div.addEventListener('click', () => {
                communeSearch.value = commune.nom;
                communeSuggestions.innerHTML = '';
                // Store the selected commune's INSEE code
                communeSearch.dataset.codeInsee = commune.codeInsee;
            });
            communeSuggestions.appendChild(div);
        });
    });
}

async function fetchCadastreData(codeInsee) {
    let department, commune;
    if (codeInsee.startsWith('97')) {
        department = codeInsee.slice(0, 3);
        commune = codeInsee;
    } else {
        department = codeInsee.slice(0, 2);
        commune = codeInsee;
    }

    const baseUrl = 'https://cadastre.data.gouv.fr/data/etalab-cadastre/2024-07-01/geojson/communes';
    const url = `${baseUrl}/${department}/${commune}/cadastre-${commune}-parcelles.json.gz`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const compressedData = await response.arrayBuffer();
        const decompressedData = pako.ungzip(new Uint8Array(compressedData), { to: 'string' });
        return JSON.parse(decompressedData);
    } catch (error) {
        console.error('Error fetching cadastre data:', error);
        throw new Error(`Impossible de récupérer les données cadastrales pour la commune ${commune}. Veuillez vérifier le code INSEE et réessayer.`);
    }
}

async function searchParcelles() {
    const codeInsee = document.getElementById('commune-search').dataset.codeInsee;
    const contenance = document.getElementById('contenance-input').value;
    const prefixe = document.getElementById('prefixe-input').value;
    const section = document.getElementById('section-input').value;
    const numero = document.getElementById('numero-input').value;
    const includeAdjacent = document.getElementById('include-adjacent').checked;

    if (!codeInsee) {
        alert('Veuillez sélectionner une commune valide');
        return;
    }

    try {
        const data = await fetchCadastreData(codeInsee);
        if (!data || !data.features || data.features.length === 0) {
            alert('Aucune donnée trouvée pour cette commune');
            return;
        }

        let filteredFeatures = data.features.filter(feature => {
            return (
                (!prefixe || feature.properties.prefixe === prefixe) &&
                (!section || feature.properties.section === section) &&
                (!numero || feature.properties.numero === numero)
            );
        });

        let inaccurateSearch = false;
        let adjacentPairs = [];

        if (contenance) {
            const contenanceValue = parseFloat(contenance);
            const exactMatches = filteredFeatures.filter(feature => 
                parseFloat(feature.properties.contenance) === contenanceValue
            );

            if (exactMatches.length === 0 && includeAdjacent) {
                adjacentPairs = findAdjacentPairs(filteredFeatures, contenanceValue);
                if (adjacentPairs.length > 0) {
                    filteredFeatures = adjacentPairs.flat();
                } else {
                    inaccurateSearch = true;
                    filteredFeatures = filteredFeatures.filter(feature => {
                        const featureContenance = parseFloat(feature.properties.contenance);
                        return featureContenance >= (contenanceValue - 10) && featureContenance <= (contenanceValue + 10);
                    });
                }
            } else if (exactMatches.length === 0) {
                inaccurateSearch = true;
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
                layer.bindPopup(createPopupContent(feature, codeInsee));
            }
        }).addTo(map);

        if (filteredFeatures.length > 0) {
            map.fitBounds(geojsonLayer.getBounds());
            displayResults(filteredFeatures, inaccurateSearch, adjacentPairs, codeInsee);
        } else {
            alert('Aucune parcelle trouvée correspondant aux critères de recherche');
            clearResults();
        }
    } catch (error) {
        alert(error.message);
    }
}

function findAdjacentPairs(features, targetContenance) {
    const pairs = [];
    for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
            const contenance1 = parseFloat(features[i].properties.contenance);
            const contenance2 = parseFloat(features[j].properties.contenance);
            if (contenance1 + contenance2 === targetContenance && areAdjacent(features[i], features[j])) {
                pairs.push([features[i], features[j]]);
            }
        }
    }
    return pairs;
}

function areAdjacent(feature1, feature2) {
    const coords1 = feature1.geometry.coordinates[0];
    const coords2 = feature2.geometry.coordinates[0];
    
    for (let i = 0; i < coords1.length; i++) {
        for (let j = 0; j < coords2.length; j++) {
            if (arePointsClose(coords1[i], coords2[j])) {
                return true;
            }
        }
    }
    return false;
}

function arePointsClose(point1, point2) {
    const threshold = 0.0001;
    return Math.abs(point1[0] - point2[0]) < threshold && Math.abs(point1[1] - point2[1]) < threshold;
}

function generateDVFLink(feature, codeInsee) {
    const prefixe = feature.properties.prefixe || '000';
    const section = feature.properties.section || '';
    const numero = feature.properties.numero || '';
    
    const code = `${codeInsee}${prefixe.padStart(3, '0')}${section}${numero.padStart(4, '0')}`;
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

function createPopupContent(feature, codeInsee) {
    const dvfLink = generateDVFLink(feature, codeInsee);
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

function displayResults(features, inaccurateSearch, adjacentPairs, codeInsee) {
    const resultsList = document.getElementById('results');
    resultsList.innerHTML = '';

    if (inaccurateSearch) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'warning';
        warningDiv.textContent = 'Attention : Affichage des résultats approximatifs pour la contenance (plage de ±10).';
        resultsList.appendChild(warningDiv);
    }

    if (adjacentPairs.length > 0) {
        const adjacentDiv = document.createElement('div');
        adjacentDiv.className = 'info';
        adjacentDiv.textContent = 'Terrains mitoyens trouvés correspondant à la contenance totale demandée.';
        resultsList.appendChild(adjacentDiv);
    }

    features.forEach((feature, index) => {
        const li = document.createElement('li');
        li.textContent = `Parcelle ${index + 1}: ${feature.properties.prefixe} ${feature.properties.section} ${feature.properties.numero} (Contenance: ${feature.properties.contenance})`;
        li.addEventListener('click', () => focusOnParcelle(feature, codeInsee));
        resultsList.appendChild(li);
    });
}

function clearResults() {
    document.getElementById('results').innerHTML = '';
}

function focusOnParcelle(feature,codeInsee) {
    const bounds = L.geoJSON(feature).getBounds();
    map.fitBounds(bounds, { maxZoom: 18 });
    const popup = L.popup()
        .setLatLng(bounds.getCenter())
        .setContent(createPopupContent(feature, codeInsee))
        .openOn(map);
}

function clearInputFields() {
    document.getElementById('commune-search').value = '';
    document.getElementById('commune-search').dataset.codeInsee = '';
    document.getElementById('contenance-input').value = '';
    document.getElementById('prefixe-input').value = '';
    document.getElementById('section-input').value = '';
    document.getElementById('numero-input').value = '';
    document.getElementById('include-adjacent').checked = false;
}

document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    clearInputFields();
    try {
        await loadCommuneData();
        setupCommuneSearch();
        document.getElementById('search-btn').addEventListener('click', () => {
            searchParcelles();
        });
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});