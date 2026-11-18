const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "public", "index.html");
if (!fs.existsSync(file)) {
  console.error("Fichier public/index.html introuvable. Lance ce script depuis le dossier racine de la V34.");
  process.exit(1);
}

let html = fs.readFileSync(file, "utf8");

const oldButton = '<button id="startBtn" class="r wide" onclick="start()">▶ JE PARS — NOUVEAU PARCOURS</button>';
const newButton = '<button id="startBtn" class="r wide" onclick="handleStartButtonClick()">▶ JE PARS — NOUVEAU PARCOURS</button>';

if (html.includes(newButton) && html.includes("function handleStartButtonClick()")) {
  console.log("Le correctif est déjà présent. Aucun changement effectué.");
  process.exit(0);
}

if (!html.includes(oldButton)) {
  console.error("Bouton de départ attendu introuvable. Version du fichier différente : aucun changement effectué.");
  process.exit(1);
}
if (!html.includes("async function startCheckpointScanner(){")) {
  console.error("Fonction startCheckpointScanner introuvable : aucun changement effectué.");
  process.exit(1);
}

html = html.replace(oldButton, newButton);
const handler = `function handleStartButtonClick(){
  if (($('chronometerMode')?.value || 'gps') === 'qr') {
    return startCheckpointScanner();
  }
  return start();
}

`;
html = html.replace("async function startCheckpointScanner(){", handler + "async function startCheckpointScanner(){");

fs.writeFileSync(file, html, "utf8");
console.log("Correctif appliqué : en mode QR, le bouton principal ouvre maintenant le scanner.");
console.log("En mode GPS, le comportement initial est conservé.");
