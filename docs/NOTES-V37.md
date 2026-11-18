# V37 — Carnet de progression et MSA-APN

## Choix retenus
- Aucun roster.
- Identification par prénom, nom et classe facultative.
- Création d’un carnet personnel et code privé de rattachement.
- Accès au carnet depuis le même espace web, avec code personnel ; le QR de séance reste le point d’entrée terrain.
- Historique des courses terminées et des bilans MSA-APN.

## Données et confidentialité
La table `student_profiles` stocke les identités et le hash SHA-256 du code personnel ; le code en clair n’est retourné qu’à la création et conservé localement par le navigateur. Le carnet agrège les courses et bilans à partir du prénom, du nom et de la classe. Les homonymes doivent être distingués par la classe. Le code est une clé d’accès privée : ne pas le diffuser.

## Limites de cette première livraison
Le carnet affiche l’historique disponible et les bilans MSA-APN, mais ne calcule pas encore de score de compétence ni de tendance automatique. Les courses antérieures peuvent être rapprochées par identité ; vérifier les homonymes avant usage pédagogique. Le lien permanent est l’adresse de l’application accompagnée du code personnel, pas une URL nominative exposant le code.

## Vérifications
Syntaxe Node et JavaScript inline, intégrité ZIP. Non testé contre la base Turso/Render réelle.
