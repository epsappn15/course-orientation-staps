# Course d'orientation STAPS / SUAPS — V34.1 corrigée

Version complète basée sur les fichiers du projet V34 fournis dans la conversation.

## Correction V34.1
- En mode **Pointage QR uniquement**, le bouton principal ouvre directement le scanner caméra.
- En mode **GPS + chronomètre manuel**, le démarrage classique est conservé.
- Messages d'erreur caméra plus explicites.
- Cache du service worker renouvelé pour éviter de conserver l'ancienne interface.

## Déploiement
Configuration Render inchangée : `npm install`, puis `npm start`.
Le dossier `public/` doit rester à la racine, au même niveau que `server.js`.
Conserver les variables Turso et les secrets Render déjà configurés.
Voir `LISEZ-MOI.txt` pour les étapes de déploiement.
