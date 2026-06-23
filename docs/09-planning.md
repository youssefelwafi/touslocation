# 9. Planning & organisation

## 9.1 Méthodologie

Développement **itératif et incrémental** (inspiration Agile / Scrum léger),
organisé en sprints de 1 à 2 semaines, avec un livrable fonctionnel à chaque étape.

---

## 9.2 Découpage en sprints

| Sprint | Objectif | Livrables |
| ------ | -------- | --------- |
| **0 — Cadrage** | Analyse des besoins, conception | Cahier des charges, maquettes, modèle de données |
| **1 — Fondations** | Setup projet + authentification | Squelette Laravel/React, login, rôles |
| **2 — Utilisateurs & matériel** | Modules CRUD de base | Gestion users, catégories, matériel |
| **3 — Locations** | Cœur métier | Réservation, disponibilité, retours, historique |
| **4 — Contrats & notifications** | Automatisation | Génération PDF, emails, rappels |
| **5 — Tableau de bord** | Statistiques | KPI, graphiques, filtres |
| **6 — Finalisation** | Tests & déploiement | Tests, corrections, documentation, déploiement |

---

## 9.3 Diagramme de Gantt (simplifié)

```
Semaine →     S1   S2   S3   S4   S5   S6   S7   S8   S9   S10
Cadrage      ███
Fondations        ███
Users/Matériel         ████
Locations                   █████
Contrats/Notifs                   ████
Dashboard                              ███
Tests/Déploiement                          █████
```

---

## 9.4 Jalons (milestones)

| Jalon | Date cible | Critère de réussite |
| ----- | ---------- | ------------------- |
| M1 — Conception validée | Fin S1 | Modèle de données + maquettes approuvés |
| M2 — Authentification | Fin S2 | Login/rôles fonctionnels |
| M3 — Catalogue opérationnel | Fin S4 | CRUD matériel complet |
| M4 — Locations opérationnelles | Fin S6 | Cycle de location complet |
| M5 — Automatisation | Fin S8 | Contrats PDF + notifications |
| M6 — Version finale | Fin S10 | Application testée et déployée |

---

## 9.5 Risques & mitigations

| Risque | Impact | Mitigation |
| ------ | ------ | ---------- |
| Conflits de disponibilité du matériel | Élevé | Verrou transactionnel + vérification serveur |
| Retard sur la génération PDF | Moyen | Prototyper tôt avec dompdf |
| Complexité des autorisations | Moyen | Policies centralisées + tests |
| Sécurité des données | Élevé | Sanctum, validation, hachage, HTTPS |

---

## 9.6 Critères d'acceptation globaux

- [ ] Tous les modules fonctionnels (users, matériel, locations, contrats, notifs, dashboard).
- [ ] Authentification et autorisation par rôle opérationnelles.
- [ ] Génération de contrats PDF fiable.
- [ ] Notifications automatiques envoyées.
- [ ] Tableau de bord avec statistiques en temps réel.
- [ ] Application responsive et sécurisée.
- [ ] Documentation complète et à jour.

---

⬅️ Précédent : [08 — Installation](08-installation.md) · 🏠 Retour : [README](../README.md)
