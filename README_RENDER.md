# Course d'orientation – V4 Render

Version corrigée pour Render + Turso.

## Correction principale
La date et le nom de séance sont désormais réellement associés à chaque résultat et affichés dans le gestionnaire. Les colonnes `session_date` et `session_title` sont ajoutées automatiquement à la base existante.

Le gestionnaire affiche clairement la séance active et la date. Les résultats synchronisés conservent aussi ces informations.

## Déploiement Render
- Root Directory : laisser vide si les fichiers sont à la racine du dépôt
- Build Command : `npm install`
- Start Command : `npm start`
- Variables : `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`

## Important
Ne pas mettre les secrets Turso dans GitHub.
