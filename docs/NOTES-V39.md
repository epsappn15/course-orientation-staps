# V39 — Évaluation pédagogique

La V39 ajoute une grille formative enseignant reliée au carnet individuel, sans roster. Les évaluations sont distinctes des temps sportifs et des auto-évaluations MSA-APN.

## Compétences évaluées
- Orientation générale
- Lecture de carte
- Choix d’itinéraire
- Prise de décision
- Autonomie
- Gestion de la sécurité

Échelle descriptive : 1 à construire ; 2 en développement ; 3 maîtrisé dans la situation ; 4 mobilisé avec autonomie. Commentaires libres limités à 2 000 caractères.

## Données et compatibilité
La table `teacher_evaluations` est créée automatiquement au démarrage avec `CREATE TABLE IF NOT EXISTS`. Les tables V38.3 ne sont ni supprimées ni modifiées. Les évaluations sont visibles par l’étudiant dans son carnet personnel authentifié par son code, et par le gestionnaire authentifié.

## Limites
La grille est formative et descriptive ; elle ne calcule pas de note globale et ne constitue pas une certification de sécurité. Les tests de déploiement doivent être réalisés sur l’instance Render/Turso de l’établissement avant usage réel.
