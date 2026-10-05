# Déploiement Render — V26

Root Directory vide. Build: npm install. Start: npm start. Variables : TURSO_DATABASE_URL et TURSO_AUTH_TOKEN.


## V17 — authentification gestionnaire
- L'espace Participant reste sans connexion.
- L'espace Gestionnaire demande `ADMIN_USER` et `ADMIN_PASSWORD`.
- Les routes de création/consultation/suppression de séances, QR de séance et export sont protégées par session.
- Définir `ADMIN_USER`, `ADMIN_PASSWORD` et `SESSION_SECRET` dans les variables d'environnement Render.
- Ne jamais placer ces valeurs dans GitHub.


## V26 — protection anti-double-clic
- Plusieurs parcours restent autorisés pour un même participant pendant une séance.
- Le bouton de départ est verrouillé immédiatement pendant la création du parcours.
- Le bouton d'arrivée est verrouillé dès le premier clic.
- Chaque nouveau parcours reçoit un identifiant unique et une nouvelle heure de départ.
- La synchronisation serveur reste idempotente grâce à l'identifiant unique du parcours.
