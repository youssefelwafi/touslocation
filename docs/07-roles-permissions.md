# 7. Rôles & permissions

L'application définit trois rôles. L'autorisation est gérée côté Laravel via
**Policies / Middleware** et reflétée côté React par des **routes protégées**.

---

## 7.1 Les rôles

| Rôle | Description |
| ---- | ----------- |
| **Administrateur** | Contrôle total de l'application |
| **Employé** | Gestion opérationnelle quotidienne |
| **Client** | Consultation et demandes de location |

---

## 7.2 Matrice des permissions

| Action | Admin | Employé | Client |
| ------ | :---: | :-----: | :----: |
| Gérer les utilisateurs (CRUD) | ✅ | ❌ | ❌ |
| Gérer son propre profil | ✅ | ✅ | ✅ |
| Gérer les catégories | ✅ | ✅ | ❌ |
| Ajouter / modifier du matériel | ✅ | ✅ | ❌ |
| Supprimer du matériel | ✅ | ❌ | ❌ |
| Consulter le catalogue | ✅ | ✅ | ✅ |
| Créer une réservation | ✅ | ✅ | ✅ |
| Confirmer une location | ✅ | ✅ | ❌ |
| Enregistrer un retour | ✅ | ✅ | ❌ |
| Annuler sa propre location | ✅ | ✅ | ✅ |
| Générer / télécharger un contrat | ✅ | ✅ | 🔵 (le sien) |
| Voir le tableau de bord | ✅ | ✅ | ❌ |
| Voir les statistiques financières | ✅ | ❌ | ❌ |

> ✅ Autorisé · ❌ Interdit · 🔵 Limité à ses propres données

---

## 7.3 Mise en œuvre côté Laravel

**Middleware de rôle (route) :**
```php
Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::apiResource('users', UserController::class);
});
```

**Policy (ressource) :**
```php
public function update(User $user, Rental $rental): bool
{
    return $user->isStaff() || $user->id === $rental->user_id;
}
```

**Helper sur le modèle User :**
```php
public function isAdmin(): bool    { return $this->role === 'admin'; }
public function isStaff(): bool    { return in_array($this->role, ['admin', 'employee']); }
public function isClient(): bool   { return $this->role === 'client'; }
```

---

## 7.4 Mise en œuvre côté React

**Route protégée par rôle :**
```jsx
<Route element={<ProtectedRoute roles={['admin', 'employee']} />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/equipments" element={<EquipmentList />} />
</Route>
```

**Affichage conditionnel :**
```jsx
{user.role === 'admin' && <DeleteButton onClick={handleDelete} />}
```

---

## 7.5 Parcours par rôle

- **Administrateur** : tableau de bord complet → gestion utilisateurs, matériel,
  catégories, supervision des locations et statistiques financières.
- **Employé** : tableau de bord opérationnel → catalogue, création/confirmation de
  locations, retours, génération de contrats.
- **Client** : catalogue → demande de réservation → suivi de ses locations et
  téléchargement de ses contrats.

---

⬅️ Précédent : [06 — API REST](06-api-endpoints.md) · ➡️ Suite : [08 — Installation](08-installation.md)
