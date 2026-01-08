# 📍 CadastreMap

**CadastreMap** est une application web progressive (PWA) moderne et intuitive qui permet de rechercher et visualiser facilement les parcelles cadastrales en France. Elle offre une interface interactive avec une carte Leaflet, des filtres avancés et des liens directs vers les données foncières officielles.

![CadastreMap](https://img.shields.io/badge/version-1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![PWA](https://img.shields.io/badge/PWA-enabled-brightgreen.svg)

## 🌟 Fonctionnalités

### 🔍 Recherche Avancée
- **Recherche par commune** : Autocomplétion intelligente par nom de commune ou code postal
- **Filtrage multi-critères** : Recherchez par contenance (surface), préfixe, section et numéro de parcelle
- **Normalisation automatique** : Gère les abréviations courantes (Saint/St, Sainte/Ste)

### 🗺️ Visualisation Interactive
- **Carte Leaflet** : Affichage dynamique des parcelles avec OpenStreetMap
- **Effets visuels** : Survol des parcelles avec mise en évidence
- **Zoom automatique** : Centrage automatique sur les résultats de recherche
- **Popups détaillées** : Informations complètes sur chaque parcelle

### 🔗 Intégrations Externes
- **DVF (Demandes de Valeurs Foncières)** : Accès direct aux transactions immobilières
- **Géoportail** : Visualisation cadastrale et orthophotos
- **Géoportail de l'Urbanisme** : Consultation des documents d'urbanisme

### 🧩 Détection de Parcelles Mitoyennes
- Recherche automatique de parcelles adjacentes
- Combinaison de terrains pour atteindre une contenance cible
- Visualisation groupée des parcelles mitoyennes

### 📱 Application Progressive (PWA)
- **Installation locale** : Installez l'application sur votre appareil
- **Mode hors ligne** : Fonctionne sans connexion internet (données en cache)
- **Responsive design** : S'adapte à tous les écrans (mobile, tablette, desktop)
- **Service Worker** : Mise en cache intelligente des ressources

### 🎨 Interface Moderne
- Design avec effets de glassmorphisme
- Animations fluides et transitions élégantes
- Dégradés de couleurs personnalisés
- État de chargement avec indicateurs visuels

## 🚀 Installation

### Prérequis
Aucun prérequis nécessaire ! L'application fonctionne directement dans un navigateur web moderne.

### Utilisation en ligne
Accédez à l'application directement via GitHub Pages :
```
https://yoransys.github.io/CadastreMap/
```

### Installation locale
1. Clonez le dépôt :
```bash
git clone https://github.com/YoranSys/CadastreMap.git
cd CadastreMap
```

2. Ouvrez le fichier `index.html` dans votre navigateur, ou lancez un serveur local :
```bash
# Avec Python 3
python -m http.server 8000

# Avec Node.js (http-server)
npx http-server -p 8000

# Avec PHP
php -S localhost:8000
```

3. Accédez à `http://localhost:8000` dans votre navigateur

### Installation comme PWA
1. Visitez l'application dans Chrome, Edge ou Safari
2. Cliquez sur l'icône d'installation dans la barre d'adresse
3. Suivez les instructions pour installer l'application sur votre appareil

## 📖 Guide d'utilisation

### Recherche de base
1. **Sélectionnez une commune** : Tapez le nom ou le code postal dans le champ de recherche
2. **Ajoutez des filtres** (optionnel) :
   - **Contenance** : Surface de la parcelle en m²
   - **Préfixe** : Code préfixe de la parcelle
   - **Section** : Section cadastrale
   - **Numéro** : Numéro de la parcelle
3. **Activez la recherche de mitoyens** (optionnel) : Cochez la case pour trouver des parcelles adjacentes
4. **Lancez la recherche** : Cliquez sur le bouton "🔍 Rechercher"

### Exploration des résultats
- **Liste des résultats** : Affichée à gauche (ou en haut sur mobile)
- **Clic sur une parcelle** : Zoom et affichage des détails
- **Survol de la carte** : Mise en évidence visuelle des parcelles
- **Liens externes** : Accès direct à DVF, Géoportail et Géoportail Urbanisme

### Recherche avec parcelles mitoyennes
Activez l'option "Inclure terrains mitoyens" pour :
- Trouver deux parcelles adjacentes dont la somme des contenances correspond à votre recherche
- Visualiser les terrains qui pourraient être réunis
- Identifier des opportunités foncières

## 🛠️ Technologies utilisées

- **Frontend** :
  - HTML5, CSS3, JavaScript (Vanilla)
  - [Leaflet.js](https://leafletjs.com/) - Bibliothèque de cartographie interactive
  - [OpenStreetMap](https://www.openstreetmap.org/) - Fonds de carte
  - [Font Awesome](https://fontawesome.com/) - Icônes

- **Données** :
  - [Cadastre Etalab](https://cadastre.data.gouv.fr/) - Données cadastrales officielles (format GeoJSON compressé)
  - Fichier INSEE des communes françaises
  - API DVF (Demandes de Valeurs Foncières)

- **Optimisation** :
  - [Pako](https://github.com/nodeca/pako) - Décompression GZIP des données cadastrales
  - Service Worker - Mise en cache et mode hors ligne
  - Responsive Design - Mobile-first

## 📂 Structure du projet

```
CadastreMap/
├── index.html          # Page principale de l'application
├── script.js           # Logique JavaScript (recherche, carte, filtres)
├── styles.css          # Styles CSS (design, animations, responsive)
├── sw.js              # Service Worker (PWA, cache)
├── manifest.json      # Manifeste PWA
├── icon-192.png       # Icône PWA 192x192
├── icon-512.png       # Icône PWA 512x512
├── icon.svg           # Icône vectorielle
├── data/
│   └── insee.csv      # Base de données des communes françaises
└── README.md          # Documentation
```

## 🌐 Sources de données

- **Cadastre** : [cadastre.data.gouv.fr](https://cadastre.data.gouv.fr/)
  - Données cadastrales sous licence Ouverte/Open Licence
  - Mise à jour régulière (version 2024-07-01 actuellement)

- **Communes** : Base INSEE des codes postaux et codes INSEE

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Forker le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Commiter vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pousser vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Fonctionnalités futures possibles

- [ ] Export des résultats en CSV/GeoJSON
- [ ] Sauvegarde des recherches favorites
- [ ] Comparaison de parcelles
- [ ] Calcul de distances et surfaces
- [ ] Historique des recherches
- [ ] Mode sombre
- [ ] Support multilingue
- [ ] Intégration des données du PLU

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

**YoranSys** - [GitHub](https://github.com/YoranSys)

## 🙏 Remerciements

- [Etalab](https://www.etalab.gouv.fr/) pour les données cadastrales ouvertes
- [OpenStreetMap](https://www.openstreetmap.org/) contributors
- [Leaflet](https://leafletjs.com/) pour la bibliothèque de cartographie
- Communauté open source

---

⭐ Si ce projet vous est utile, n'hésitez pas à lui donner une étoile sur GitHub !

🐛 Vous avez trouvé un bug ? [Ouvrez une issue](https://github.com/YoranSys/CadastreMap/issues)