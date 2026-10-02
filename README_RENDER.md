# Déploiement Render

Root Directory : vide (les fichiers sont à la racine).
Build Command : npm install
Start Command : npm start

Variables : TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_USER, ADMIN_PASSWORD, SESSION_SECRET.

Après mise à jour, faire Manual Deploy -> Deploy latest commit si le redéploiement automatique n'a pas lieu.


V9: authentification gestionnaire utilise directement ADMIN_USER et ADMIN_PASSWORD de Render; la valeur en base Turso ne bloque plus le changement de mot de passe.
