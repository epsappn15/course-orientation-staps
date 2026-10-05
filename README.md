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

## V27 — suivi GPS live
- Suivi GPS activé pendant chaque parcours participant, après autorisation du navigateur.
- Position envoyée environ toutes les 5 secondes selon les mises à jour du GPS du téléphone.
- Les positions sont conservées localement si le réseau est indisponible puis synchronisées au retour du réseau.
- Le gestionnaire dispose d'une carte OpenStreetMap avec dernière position et tracé de chaque parcours ayant transmis des positions.
- Le GPS n'empêche jamais le chronomètre : si l'autorisation est refusée ou le GPS indisponible, le parcours continue normalement.
- L'effacement des résultats d'une séance supprime également les positions GPS associées.


### Correction zone de sécurité
Le dessin de la zone de course est désormais interactif : cliquer sur « Dessiner la zone », placer au moins 3 points sur la carte, puis cliquer sur « Terminer la zone » (ou double-cliquer). La zone doit ensuite être enregistrée avec « Enregistrer les paramètres ».
