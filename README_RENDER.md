# Déploiement Render — V16

Root Directory vide. Build: npm install. Start: npm start. Variables : TURSO_DATABASE_URL et TURSO_AUTH_TOKEN.


## V17 — authentification gestionnaire
- L'espace Participant reste sans connexion.
- L'espace Gestionnaire demande `ADMIN_USER` et `ADMIN_PASSWORD`.
- Les routes de création/consultation/suppression de séances, QR de séance et export sont protégées par session.
- Définir `ADMIN_USER`, `ADMIN_PASSWORD` et `SESSION_SECRET` dans les variables d'environnement Render.
- Ne jamais placer ces valeurs dans GitHub.
