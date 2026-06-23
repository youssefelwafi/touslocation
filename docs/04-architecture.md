# 4. Architecture

## 4.1 Architecture générale

L'application suit une architecture **client / serveur découplée** :

```
                          ┌─────────────────────────────────────┐
                          │            NAVIGATEUR                │
                          │   ┌─────────────────────────────┐   │
                          │   │     React SPA (Frontend)     │   │
                          │   │  Pages · Composants · Router │   │
                          │   │   Axios · React Query        │   │
                          │   └──────────────┬──────────────┘   │
                          └──────────────────┼──────────────────┘
                                             │ HTTPS · JSON · Bearer Token
                                             ▼
                          ┌─────────────────────────────────────┐
                          │          LARAVEL (Backend)          │
                          │  Routes API → Controllers           │
                          │  Form Requests (validation)         │
                          │  Services (logique métier)          │
                          │  Eloquent Models · Policies         │
                          │  Notifications · PDF · Jobs         │
                          └──────────────────┬──────────────────┘
                                             │ Eloquent ORM
                                             ▼
                          ┌─────────────────────────────────────┐
                          │              MySQL (DB)             │
                          └─────────────────────────────────────┘
```

---

## 4.2 Architecture backend (Laravel)

Organisation en couches :

```
app/
├── Http/
│   ├── Controllers/Api/      # Reçoivent les requêtes, renvoient du JSON
│   ├── Requests/             # Validation des entrées (Form Requests)
│   ├── Resources/            # Transformation des modèles en JSON (API Resources)
│   └── Middleware/           # Auth, rôles, throttling
├── Models/                   # Entités Eloquent (User, Equipment, Rental…)
├── Services/                 # Logique métier réutilisable
├── Policies/                 # Autorisations par ressource
├── Notifications/            # Emails et notifications in-app
└── Jobs/                     # Tâches asynchrones (rappels, PDF)
database/
├── migrations/               # Schéma versionné
└── seeders/                  # Données de démonstration
routes/
└── api.php                   # Définition des endpoints REST
```

**Flux d'une requête :**
`Route → Middleware (auth/role) → Form Request (validation) → Controller → Service → Model → DB`
puis `Model → API Resource → JSON → React`.

---

## 4.3 Architecture frontend (React)

```
src/
├── api/                # Configuration Axios + appels API par ressource
├── components/         # Composants réutilisables (Button, Table, Modal…)
├── features/           # Modules métier
│   ├── auth/
│   ├── users/
│   ├── equipment/
│   ├── rentals/
│   └── dashboard/
├── hooks/              # Hooks personnalisés (useAuth, useToast…)
├── layouts/            # Mises en page (AdminLayout, ClientLayout)
├── pages/              # Pages routées
├── routes/             # Définition des routes + routes protégées
├── store/              # État global (contexte auth)
└── utils/              # Fonctions utilitaires
```

**Patterns clés :**
- **Routes protégées** selon le rôle de l'utilisateur.
- **React Query** pour le cache et la synchronisation des données serveur.
- **Intercepteur Axios** qui injecte le token et gère les erreurs 401.

---

## 4.4 Sécurité

| Aspect | Mise en œuvre |
| ------ | ------------- |
| Authentification | Laravel Sanctum (token Bearer) |
| Autorisation | Rôles + Policies (admin / employé / client) |
| Mots de passe | Hachage Bcrypt |
| Validation | Form Requests côté serveur + validation côté client |
| Protection API | Middleware `auth:sanctum`, throttling (rate limiting) |
| CORS | Configuration des origines autorisées |
| Données sensibles | Variables d'environnement (`.env`) |

---

## 4.5 Cycle de vie d'une location (flux métier)

```
   [Client]                [Système]                 [Employé/Admin]
      │                        │                           │
      │── Demande réservation ─►                           │
      │                        │── Vérifie disponibilité   │
      │                        │── Crée location (en attente)
      │                        │                           │◄── Confirme
      │◄─ Notification + PDF ──│── Génère contrat PDF      │
      │                        │── Statut: en cours        │
      │                        │                           │
      │                        │  (échéance approche)      │
      │◄─ Rappel de retour ────│                           │
      │── Retourne matériel ──►│                           │◄── Enregistre retour
      │                        │── Statut: retournée       │
      │                        │── Met à jour disponibilité│
```

---

⬅️ Précédent : [03 — Stack technique](03-stack-technique.md) · ➡️ Suite : [05 — Modèle de données](05-modele-donnees.md)
