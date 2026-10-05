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

## V29.2 — correction accès gestionnaire
- Accès gestionnaire rendu plus robuste après déploiement et changement de cache PWA.
- Cache service worker passé en V29.2 pour éviter de conserver l’ancienne interface.
- Le panneau de connexion gestionnaire est explicitement réaffiché lorsqu’aucun jeton valide n’est présent.


## V30.2
Base stable V29.4. Ajouts : télémétrie batterie/GPS, détection d'immobilité, état GPS, dernière position conservée via les positions GPS, import CSV des participants attendus et suivi de leur statut/nombre de parcours. Les fonctions IGN, géofence, alertes temps, GPS live et anti-double-clic sont conservées.

## V30.3 — télémétrie réellement active
- Le code participant complet est désormais celui de la version sécurité, directement intégré à index.html.
- Envoi de télémétrie batterie/GPS pendant chaque parcours et affichage gestionnaire via les champs races.
- Version/cache PWA V30.3.


## V31 — arrêt d'un coureur par le gestionnaire
- Le gestionnaire peut arrêter manuellement un parcours encore en cours depuis le suivi en direct.
- Une confirmation est demandée avant l'arrêt.
- Le serveur enregistre l'heure réelle d'arrêt et `finish_reason=manager`.
- Le participant est informé automatiquement dès que son téléphone retrouve le réseau.
- Le parcours est alors clôturé côté participant, son GPS/télémétrie s'arrête et il peut ensuite lancer un nouveau parcours.
- Le serveur refuse les nouvelles positions GPS et télémétries après clôture.
- Les arrêts gestionnaire sont distingués des arrivées normales.


## V32.1
Correctif : l'historique des séances est chargé automatiquement après connexion gestionnaire. Cache PWA V32.1.
