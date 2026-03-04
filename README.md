#  LearnHub — Plateforme d'E-Learning (Backend API & MongoDB)

!
**LearnHub** est une solution backend complète pour une plateforme d'apprentissage en ligne. Ce projet démontre une architecture **RESTful** robuste, une modélisation de données **NoSQL** avancée et une logique métier transactionnelle pour connecter étudiants et formateurs.

---

##  Fonctionnalités Clés

### 🔹 Gestion des Utilisateurs
- Inscription et authentification (simulation).
- Profils riches : Compétences, liens sociaux, biographie.
- Rôles distincts : `student` vs `instructor`.

### 🔹 Catalogue de Cours Intelligent
- **Recherche Full-Text** : Recherche par mots-clés (Regex).
- **Filtres Avancés** : Par catégorie, prix (`min/max`), difficulté.
- **Tri & Pagination** : Optimisation des performances pour les grands catalogues.

### 🔹 Logique Métier (Transactionnelle)
- **Système d'Inscription Sécurisé** : 
    - Vérification de l'existence de l'utilisateur et du cours.
    - Prévention des doublons (Check-Before-Write).
    - Mise à jour atomique des compteurs (`$inc`).
- **Suivi de Progression** : Calcul automatique du pourcentage d'avancement.
- **Suppression en Cascade** : Nettoyage automatique des leçons, avis et inscriptions lors de la suppression d'un cours.

---

##  Stack Technique

| Technologie | Usage |
| :--- | :--- |
| **Node.js** | Environnement d'exécution JavaScript serveur. |
| **Express.js** | Framework web pour créer l'API REST. |
| **MongoDB** | Base de données NoSQL orientée documents. |
| **MongoDB Driver** | Connecteur natif pour Node.js. |
| **HTML5 / CSS3** | Interface Frontend pour la démonstration. |

---

##  Architecture de la Base de Données

Le projet repose sur 5 collections interconnectées :

1.  **Users** : Stocke les profils, rôles et compétences.
2.  **Courses**  : Contient les métadonnées des cours (titre, prix, tags).
3.  **Lessons**  : Chapitres associés à un cours (Relation 1-N).
4.  **Enrollments**  : **Table de liaison riche** (User <-> Course) avec statut, dates et progression.
5.  **Reviews** ⭐: Avis et notes laissés par les étudiants inscrits.

---

##  Installation & Démarrage

### 1. Prérequis
- [Node.js](https://nodejs.org/) installé.
- [MongoDB](https://www.mongodb.com/) lancé localement sur le port `27017`.

### 2. Cloner et Installer
```bash
# Installer les dépendances
npm install
```

### 3. Initialiser la Base de Données (Seed)
Remplissez la base avec des données de test réalistes via le script dédié :
```powershell
# Avec mongosh natif
mongosh scripts/seed.mongosh.js

# OU si vous utilisez l'exécutable local inclus
.\mongosh scripts/seed.mongosh.js
```

### 4. Lancer le Serveur
```bash
node server.js
```
> Le serveur sera accessible sur : `http://localhost:3000`

---

## 🔌 Documentation API (Principaux Endpoints)

| Méthode | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/courses` | Liste des cours (supporte `?sort=-price&category=Web`). |
| `GET` | `/api/courses/:id` | Détails complets d'un cours. |
| `POST` | `/api/enrollments` | Inscription d'un étudiant (avec vérifications). |
| `GET` | `/api/users/:id/dashboard` | Dashboard complet (User + Inscriptions + Avis). |
| `GET` | `/api/stats` | Statistiques globales de la plateforme (Bonus). |
| `GET` | `/api/export` | Export des données en JSON (Bonus). |

---

##  Tests & Démonstration

### Via le Site Web (Frontend)
Ouvrez simplement le fichier `index.html` dans votre navigateur (ou via Live Server) pour tester l'API visuellement.

### Via Postman
Une collection Postman complète (`learnhub_collection.json`) est incluse dans le projet pour tester toutes les routes.

### Script de Requêtes Complexes
Pour démontrer la maîtrise du langage de requête MongoDB (MQL) :
```powershell
.\mongosh scripts/queries.mongosh.js
```

---

##  Auteur
**Wafae Errai**  

