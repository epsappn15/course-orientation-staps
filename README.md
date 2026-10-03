# Course d’orientation — V16

Version V16 complète : chrono, historique participant, lien de séance, QR de séance, suivi en direct des participants encore en course, synchronisation Render/Turso et fonctionnement hors connexion.


## V17 — authentification gestionnaire
- L'espace Participant reste sans connexion.
- L'espace Gestionnaire demande `ADMIN_USER` et `ADMIN_PASSWORD`.
- Les routes de création/consultation/suppression de séances, QR de séance et export sont protégées par session.
- Définir `ADMIN_USER`, `ADMIN_PASSWORD` et `SESSION_SECRET` dans les variables d'environnement Render.
- Ne jamais placer ces valeurs dans GitHub.


## V18
Correction de l'effacement des résultats gestionnaire : endpoint POST dédié, retour du nombre supprimé et gestion de session explicite.
