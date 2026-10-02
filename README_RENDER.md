# Mise en ligne gratuite – Render + Turso

Cette version est préparée pour un test en ligne avec Render (hébergement) et Turso (base SQLite cloud).

## 1. Créer la base Turso
- Créer un compte sur Turso.
- Créer une base.
- Récupérer `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN`.

## 2. Mettre le projet sur GitHub
Créer un dépôt GitHub et y envoyer tous les fichiers de ce dossier.

## 3. Créer le service Render
- Render > New > Web Service
- Connecter le dépôt GitHub
- Build Command : `npm install`
- Start Command : `npm start`
- Plan : Free

Variables d'environnement :
- TURSO_DATABASE_URL
- TURSO_AUTH_TOKEN
- ADMIN_USER (ex. enseignant)
- ADMIN_PASSWORD (mot de passe fort)
- SESSION_SECRET (chaîne aléatoire longue)
- PUBLIC_URL (laisser vide au début ou mettre l'URL Render après création)

## 4. Tester
Ouvrir l'URL `https://nom-du-service.onrender.com`.
Le serveur expose `/health` pour vérifier que l'application fonctionne.

## Attention au forfait gratuit Render
Le service gratuit peut se mettre en veille après 15 minutes sans trafic et redémarre ensuite en environ une minute. Turso conserve les données de la base selon son forfait gratuit. Vérifier les limites actuelles avant une utilisation institutionnelle.


## Correction v3
La date et le nom de séance saisis par le participant servent désormais à créer/résoudre automatiquement la séance côté serveur lorsqu'une connexion est disponible. En mode hors ligne, la séance est créée localement avec la date comme identifiant et sera synchronisée dès le retour du réseau.
