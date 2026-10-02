# Course d'orientation — V2

## Architecture
- Aucun QR de séance.
- La date de séance est l'identifiant visible.
- Le participant saisit directement la date/séance.
- Départ et arrivée sont toujours enregistrés localement.
- Si Internet/réseau est disponible : synchronisation automatique vers le gestionnaire toutes les quelques secondes.
- Si le réseau disparaît : les données restent sur le téléphone et sont synchronisées dès le retour du réseau.
- Après l'arrivée, un QR de récupération manuel peut être présenté au gestionnaire.
- Le gestionnaire peut exporter la séance en CSV.

## Important
Le serveur doit être disponible pour la synchronisation. L'application PWA doit être installée/ouverte au moins une fois en ligne pour charger ses ressources hors ligne. Tester le mode avion sur les appareils réels.

## Installation serveur
Node.js 20+ :
npm install
npm start

Variables : voir `.env.example`.

## Sécurité / production
Le QR de récupération actuel encode les données de manière obfusquée (Base64), pas chiffrée. Avant un usage institutionnel, ajouter chiffrement/signature et une authentification adaptée.

## Correctif V2.1
- Les deux logos SUAPS et STAPS sont affichés sur l'écran principal.
- Le bouton sélectionné change réellement de couleur : rouge pour Participant, bleu pour Gestionnaire.
- Le cache PWA a été versionné pour forcer la prise en compte de cette correction.


## V5
Cache PWA renouvelé, suppression des anciens caches, date du jour préremplie et lien de séance partageable avec date + nom préremplis.
