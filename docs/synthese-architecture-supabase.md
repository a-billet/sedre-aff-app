# Synthèse technique — Intégration Supabase & Super-Admin
## Outil de faisabilité foncière (SEDRE)

Contexte : app Next.js existante (v0), actuellement sans backend. Deux chantiers à mener :
1. Intégration Supabase (auth + DB)
2. Écran super-admin pour éditer les critères/poids/seuils de la grille de notation

---

## 1. Principe clé : versionner la grille de notation

Ne jamais modifier une grille "en place". Toute édition de poids/seuils/critères par le super-admin crée une **nouvelle version** de grille, publiée explicitement. Une analyse foncière référence la version utilisée au moment du calcul et stocke son score calculé (pas seulement les réponses brutes).

Objectif : si le super-admin change un poids en mars, une analyse faite en janvier et relue en juin doit toujours afficher le score calculé avec la grille de janvier — jamais recalculé silencieusement avec les nouveaux poids.

## 2. Schéma de données (Supabase / Postgres)

- `criteres` — catégorie, libellé, ordre, type de saisie (qualitatif/quantitatif)
- `grille_versions` — id, date de publication, statut (brouillon / active / archivée)
- `grille_ponderations` — poids par critère + seuils de notation, liés à une `grille_version_id`
- `fonciers` — données du terrain (localisation, surface, etc.)
- `analyses` — foncier_id, grille_version_id, statut, scores calculés, pré-bilan, créé_par, modifié_par, timestamps
- `analyse_reponses` — réponses détaillées critère par critère (reconstitution du détail)
- `analyse_historique` — log des modifications (qui a changé quoi, quand) — alimenté par un trigger Postgres sur UPDATE de `analyses`

## 3. Auth

- Email/password ou magic link (pas besoin de SSO, volume d'utilisateurs modeste, pas de rôles différenciés côté CDC)
- À trancher avec la SEDRE : inscriptions ouvertes ou invite-only par un admin

## 4. Modèle de droits — volontairement minimal

Le CDC est explicite : **pas de notion de rôle/droit différencié** pour les utilisateurs standards (chacun peut tout modifier, mais c'est tracé).

Le super-admin (accès très restreint, 1-2 personnes) ne doit **pas** passer par un système RBAC générique. Approche recommandée :
- Un flag `is_super_admin` sur la table `users`, ou une allowlist d'emails vérifiée côté middleware Next.js
- RLS Postgres dédiée : seules les personnes de cette allowlist peuvent écrire dans `grille_versions` / `grille_ponderations`
- Pas de table `roles`/`permissions` généraliste — sur-ingénierie inutile pour ce périmètre

## 5. Traçabilité (exigence explicite du CDC)

- Trigger Postgres sur `UPDATE` de `analyses` → écriture automatique dans `analyse_historique` (utilisateur, timestamp, diff des champs modifiés)
- Pas de gestion de droits différenciés nécessaire ici, juste de la capture d'événements

## 6. Moteur de calcul — découplé de l'UI

Fonctions pures, testables indépendamment des composants React :
- `calculerScore(reponses, grilleVersion)`
- `calculerPreBilan(hypotheses, mode)` où `mode` ∈ {aménagement, construction}

Objectif : sécuriser contre les régressions lors des ajustements de règles de calcul prévus en phase 3 (retours utilisateurs).

## 7. Fonctionnalités complémentaires du CDC

- **Carto** : simple lien externe (Google Maps / Géoportail) généré à partir des coordonnées du foncier — pas de carte interactive embarquée (hors périmètre chiffré)
- **Export PDF (fiche récapitulative)** : génération côté serveur (route API Next.js), stockage dans Supabase Storage au moment de la finalisation d'une analyse plutôt que régénération à la volée à chaque consultation — cohérent avec l'exigence d'historisation

## 8. Structure du repo

- Client Supabase séparé server/client dans `lib/supabase/` (pattern `@supabase/ssr`, App Router)
- Migrations SQL versionnées dans `supabase/migrations/` — important car le contrat prévoit que la SEDRE puisse récupérer le code et l'héberger en autonomie à terme

## Point de vigilance principal

Le risque le plus coûteux est de sous-dimensionner le modèle de données de la grille de notation en se disant "on corrigera plus tard". Une fois des analyses réelles en production référençant une grille non versionnée, la migration devient bien plus lourde. C'est le seul point du projet qui mérite d'être posé correctement dès la première itération Supabase.
