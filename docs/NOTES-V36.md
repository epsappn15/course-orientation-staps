# V36 — Correctif affichage MSA-APN côté élève

Cette version reprend l'intégration MSA-APN V35 et corrige la résolution de la séance côté participant.

- Le paramètre `date` du QR code est prioritaire sur une ancienne séance conservée dans le stockage local.
- Le statut MSA-APN est relu lors du chargement, du retour sur la page (`pageshow`) et du retour du réseau (`online`).
- Le cache du service worker est renouvelé en V36 pour éviter de conserver les anciens fichiers statiques.

Le module reste facultatif et n'apparaît que si l'enseignant l'a activé pour la séance concernée.
