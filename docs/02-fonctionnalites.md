# 2. Fonctionnalités principales

## 2.1 Vue d'ensemble

| N° | Fonctionnalité | Description courte |
| -- | -------------- | ------------------ |
| 1 | Gestion des utilisateurs | Création, modification et suppression des comptes (admin, employé, client) |
| 2 | Gestion du matériel | Ajout, modification, suppression et suivi de disponibilité |
| 3 | Gestion des locations | Enregistrement des locations, retours et historique |
| 4 | Génération de contrats | Création automatique de contrats en PDF |
| 5 | Notifications automatiques | Envoi de rappels pour retour ou confirmation |
| 6 | Tableau de bord | Affichage des statistiques (revenus, locations, matériel) |

---

## 2.2 Détail des modules

### Module 1 — Gestion des utilisateurs

- Authentification sécurisée (login / logout, tokens).
- Création / modification / suppression de comptes.
- Attribution des rôles : **administrateur**, **employé**, **client**.
- Gestion du profil (informations personnelles, mot de passe).
- Activation / désactivation d'un compte.

**Acteurs :** Administrateur (CRUD complet), Client (auto-inscription + profil).

---

### Module 2 — Gestion du matériel

- Ajout d'un nouveau matériel (nom, catégorie, description, photo, prix/jour).
- Modification et suppression du matériel.
- Suivi de la **disponibilité** en temps réel (disponible / loué / en maintenance).
- Organisation par **catégories** (informatique, chantier, événementiel…).
- Gestion du stock (quantité disponible par article).
- Recherche et filtrage du catalogue.

**Acteurs :** Administrateur, Employé.

---

### Module 3 — Gestion des locations

- Création d'une réservation (sélection matériel, dates, client).
- Vérification automatique de la disponibilité sur la période.
- Calcul automatique du montant (durée × prix/jour × quantité).
- Suivi du cycle de vie : `en attente → confirmée → en cours → retournée → annulée`.
- Enregistrement des **retours** (état du matériel, retard éventuel).
- Consultation de l'**historique** des locations.

**Acteurs :** Employé, Client (demande), Administrateur.

---

### Module 4 — Génération de contrats

- Génération automatique d'un **contrat PDF** à la confirmation d'une location.
- Contenu : parties, matériel loué, dates, montant, conditions générales.
- Téléchargement et archivage des contrats.
- Numérotation unique des contrats.

**Technologie :** `barryvdh/laravel-dompdf` (génération PDF côté Laravel).

---

### Module 5 — Notifications automatiques

- Confirmation de réservation envoyée au client.
- Rappel de retour avant l'échéance.
- Alerte de retard.
- Notification interne (in-app) + email.

**Technologie :** Laravel Notifications + Mail + (option) Queue/Scheduler.

---

### Module 6 — Tableau de bord & statistiques

- KPI : revenus totaux, nombre de locations, taux d'occupation du matériel.
- Graphiques : revenus par mois, matériel le plus loué, locations par statut.
- Vue synthétique adaptée au rôle (admin vs employé).

**Technologie :** Recharts / Chart.js côté React, agrégations SQL côté Laravel.

---

## 2.3 Exigences non fonctionnelles

| Catégorie | Exigence |
| --------- | -------- |
| Sécurité | Authentification par token, hachage des mots de passe, autorisation par rôle |
| Performance | Temps de réponse API < 500 ms sur les écrans courants |
| Ergonomie | Interface responsive, claire, accessible |
| Fiabilité | Sauvegarde de la base, validation des données |
| Maintenabilité | Code structuré, API RESTful documentée |

---

⬅️ Précédent : [01 — Présentation](01-presentation.md) · ➡️ Suite : [03 — Stack technique](03-stack-technique.md)
