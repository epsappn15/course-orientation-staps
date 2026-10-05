
const K="co-v16-session",R="co-v16-race",S="co-v16-results",H="co-v16-history",GQ="co-v27-gps-queue";
function apiFetch(url,init={}){const h=new Headers(init.headers||{});const token=localStorage.getItem("co_admin_token");if(token)h.set("Authorization","Bearer "+token);return fetch(url,{...init,headers:h,cache:init.cache||"no-store"});}
let session=JSON.parse(localStorage.getItem(K)||"null"),race=JSON.parse(localStorage.getItem(R)||"null"),results=JSON.parse(localStorage.getItem(S)||"[]"),history=JSON.parse(localStorage.getItem(H)||"[]"),gpsQueue=JSON.parse(localStorage.getItem(GQ)||"[]"),timer=null,gpsWatch=null,map=null,mapLayers={},mapBases={},sessionConfig=null,zoneDrawing=false,zoneDraft=[],zoneLayer=null,alertState={warning:false,limit:false,out:false},batteryManager=null,lastGpsAt=0,lastMovementAt=0,lastLat=null,lastLon=null,telemetryTimer=null,roster=[];
const $=x=>document.getElementById(x),esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
function todayISO(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function dur(ms){ms=Math.max(0,Number(ms)||0);const s=Math.floor(ms/1000),h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return [h,m,sec].map(v=>String(v).padStart(2,"0")).join(":")}
function clock(ms){return ms?new Date(Number(ms)).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit",second:"2-digit"}):""}
function msg(id,html,kind="status"){const e=$(id);if(!e)return;e.className="status "+kind;e.innerHTML=html}
function net(){const e=$("network");if(!e)return;const update=()=>{e.textContent=navigator.onLine?"🟢 Connexion disponible — synchronisation automatique active.":"🟠 Hors connexion — les données sont conservées sur ce téléphone."};window.addEventListener("online",update);window.addEventListener("offline",update);update()}
function fillParticipantSession(){const params=new URLSearchParams(location.search);const d=params.get("date")||session?.date||todayISO();const t=params.get("title")||session?.title||"";if($("pdate")&&!$("pdate").value)$("pdate").value=d;if($("ptitle")&&!$("ptitle").value&&t)$("ptitle").value=t}
async function showServerVersion(){try{const r=await fetch("/api/version",{cache:"no-store"});if(r.ok){const x=await r.json();const e=document.querySelector(".card p.small b");if(e)e.textContent="Version "+x.version}}catch(e){}}

async function checkAdmin(){try{const r=await apiFetch('/api/me');const d=await r.json();if(!d.admin)localStorage.removeItem('co_admin_token');setAdminUI(!!d.admin);return !!d.admin}catch(e){setAdminUI(false);return false}}
function setAdminUI(ok){$('managerLogin').classList.toggle('hidden',ok);$('managerContent').classList.toggle('hidden',!ok);if(ok){loadSession();loadRoster();initGpsMap();setTimeout(()=>map?.invalidateSize(),100)}}
async function loginAdmin(){const user=$('adminUser').value.trim(),password=$('adminPassword').value; if(!user||!password)return msg('loginMsg','Identifiant et mot de passe obligatoires.','err'); try{const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({user,password})});const d=await r.json();if(!r.ok)return msg('loginMsg',d.error||'Identifiants incorrects','err');if(!d.token)return msg('loginMsg','Jeton de connexion absent.','err');localStorage.setItem('co_admin_token',d.token);$('adminPassword').value='';msg('loginMsg','Connexion réussie.','ok');setAdminUI(true)}catch(e){msg('loginMsg','Connexion impossible.','err')}}
async function logoutAdmin(){try{await fetch('/api/logout',{method:'POST'})}catch(e){};localStorage.removeItem('co_admin_token');setAdminUI(false);msg('loginMsg','Déconnecté.','ok')}
function show(x){const p=$("participant"),m=$("manager");if(p)p.classList.toggle("hidden",x!=="participant");if(m)m.classList.toggle("hidden",x!=="manager");$("participantBtn").className="mode "+(x==="participant"?"active-participant":"inactive");$("managerBtn").className="mode "+(x==="manager"?"active-manager":"inactive");if(x==="manager"){const hasToken=!!localStorage.getItem("co_admin_token");if(!hasToken){$("managerLogin").classList.remove("hidden");$("managerContent").classList.add("hidden");}checkAdmin();}}
async function logout(){show("participant")}

function clearParticipantHistory(){
  if(!history.length)return msg("pmsg","Votre historique est déjà vide.","status");
  if(!confirm("Effacer définitivement l’historique de ce téléphone ? Cette action ne supprime pas les résultats du gestionnaire."))return;
  history=[];localStorage.removeItem(H);renderHistory();msg("pmsg","Historique personnel effacé sur ce téléphone.","ok");
}
async function clearManagerHistory(){
  if(!session)return msg("gmsg","Aucune séance active.","err");
  if(!confirm("Effacer définitivement tous les résultats de la séance « "+session.title+" » du "+session.date+" ? Cette action est irréversible."))return;
  try{const r=await apiFetch("/api/sessions/"+encodeURIComponent(session.id)+"/clear-results",{method:"POST",headers:{"Content-Type":"application/json"}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"Erreur serveur");results=[];localStorage.setItem(S,"[]");render();msg("gmsg",`Résultats effacés (${Number(d.count||0)}).`,"ok");}catch(e){msg("gmsg","Impossible d'effacer les résultats : "+esc(e.message),"err");}
}
function renderHistory(){
  const e=$("history"); if(!e)return;
  const a=history.slice().sort((x,y)=>(Number(y.finish_at)||0)-(Number(x.finish_at)||0));
  if(!a.length){e.innerHTML='<p class="small">Aucune course terminée sur ce téléphone.</p>';return}
  e.innerHTML='<div class="table"><table><tr><th>Date</th><th>Séance</th><th>Circuit</th><th>Durée</th></tr>'+a.map(x=>`<tr><td>${esc(x.session_date||'')}</td><td>${esc(x.session_title||'')}</td><td>${esc(x.course||'')}</td><td><b>${dur(Number(x.finish_at)-Number(x.start_at))}</b></td></tr>`).join('')+'</table></div>';
}
async function renderSessionQR(){
  const e=$("sessionQr"); if(!e||!session)return;
  e.innerHTML='<p class="small">Génération du QR…</p>';
  try{
    const r=await apiFetch('/api/sessions/'+encodeURIComponent(session.id)+'/qr');
    if(r.ok){const d=await r.json();e.innerHTML=`<img src="${d.data}" alt="QR code séance"><br><button class="g" onclick="downloadSessionQR()">⬇ Télécharger le QR</button>`;return;}
  }catch(err){}
  // Secours local si le serveur est momentanément inaccessible.
  const u=location.origin+location.pathname+'?date='+encodeURIComponent(session.date)+'&title='+encodeURIComponent(session.title);
  if(typeof QRCode!=='undefined'){QRCode.toDataURL(u,{width:300,margin:1},(err,data)=>{if(err){e.innerHTML='<p class="small">QR indisponible hors connexion.</p>';return;}e.innerHTML=`<img src="${data}" alt="QR code séance"><br><button class="g" onclick="downloadSessionQR()">⬇ Télécharger le QR</button>`;});}
  else e.innerHTML='<p class="small">QR indisponible : reconnecte le gestionnaire à Internet pour le générer.</p>';
}
function downloadSessionQR(){const img=$("sessionQr")?.querySelector('img');if(!img)return;const a=document.createElement('a');a.href=img.src;a.download='QR-seance-'+(session?.date||'orientation')+'.png';a.click();}

function showSessionLink(){
  const el=$("sessionLink");
  if(!el||!session)return;
  const u=location.origin+location.pathname+"?date="+encodeURIComponent(session.date)+"&title="+encodeURIComponent(session.title);
  el.innerHTML=`<label>Lien à transmettre aux étudiants</label><div class="grid"><input id="shareLink" value="${esc(u)}" readonly><button class="b" onclick="copySessionLink()">Copier le lien</button></div><p class="small">La date et le nom de la séance seront préremplis sur leur téléphone.</p>`;
  renderSessionQR();
}
async function copySessionLink(){const v=$("shareLink")?.value||"";try{await navigator.clipboard.writeText(v);msg("gmsg","Lien copié dans le presse-papiers.","ok")}catch(e){$("shareLink").select();msg("gmsg","Sélectionne le lien puis copie-le.","status")}}
function fillManagerSession(){
  if(session){$("gdate").value=session.date;$("gtitle").value=session.title;$("active").innerHTML=`<b>Séance active</b><br><strong>${esc(session.title)}</strong><br>${session.date}<br><span class=small>Identifiant : ${esc(session.id)}</span>`}
}
function loadSession(){
  if(!$("gdate").value) $("gdate").value=session?.date||todayISO();
  if(!session){$("active").innerHTML="<p class=small>Aucune séance active. Crée-en une.</p>";return}
  fillManagerSession(); showSessionLink(); loadSessionConfig(); refresh(); render();
}

async function resolveSession(date,title){
  date=String(date||""); title=String(title||"").trim();
  if(!date||!title)return null;
  if(navigator.onLine){
    try{
      let r=await apiFetch("/api/sessions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date,title})});
      let x=await r.json(); if(r.ok) return x;
    }catch(e){}
  }
  return {id:date,date,title};
}

async function create(){
  let d=$("gdate").value,t=$("gtitle").value.trim();
  if(!d||!t)return msg("gmsg","Date et nom obligatoires","err");
  let x=await resolveSession(d,t);
  if(!x)return msg("gmsg","Impossible de créer la séance.","err");
  session=x;localStorage.setItem(K,JSON.stringify(session));loadSession();loadRoster();showSessionLink();msg("gmsg","Séance prête.","ok");
}

let startLocked=false,finishLocked=false;
function setRaceButtons(running){
  const sb=$("startBtn"),fb=$("finishBtn");
  if(sb){sb.disabled=!!running||startLocked;sb.style.opacity=sb.disabled?".6":"1";sb.textContent=running?"⏱️ PARCOURS EN COURS":"▶ JE PARS — NOUVEAU PARCOURS";}
  if(fb){fb.disabled=!running||finishLocked;fb.style.opacity=fb.disabled?".6":"1";}
}
function setGpsStatus(html,kind="status"){const e=$("gpsStatus");if(e)msg("gpsStatus",html,kind)}
function saveGpsQueue(){localStorage.setItem(GQ,JSON.stringify(gpsQueue.slice(-5000)))}
async function sendGpsPoint(pt){try{const r=await fetch("/api/gps",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(pt)});return r.ok}catch(e){return false}}
async function flushGpsQueue(){if(!navigator.onLine||!gpsQueue.length)return;const q=gpsQueue.slice();gpsQueue=[];saveGpsQueue();for(const pt of q){if(!(await sendGpsPoint(pt))){gpsQueue.push(pt);break}}saveGpsQueue()}
function haversine(a,b,c,d){const R=6371000,rad=Math.PI/180,da=(c-a)*rad,db=(d-b)*rad,x=Math.sin(da/2)**2+Math.cos(a*rad)*Math.cos(c*rad)*Math.sin(db/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
async function readBattery(){try{if(!navigator.getBattery)return null;if(!batteryManager)batteryManager=await navigator.getBattery();return {level:Math.round(Number(batteryManager.level)*100)/100,charging:!!batteryManager.charging}}catch(e){return null}}
async function sendTelemetry(){if(!race||race.finish_at)return;const b=await readBattery();const gpsAge=lastGpsAt?Date.now()-lastGpsAt:Infinity;let gpsStatus=lastGpsAt?(gpsAge>45000?'lost':(race.gps_last?.accuracy>50?'imprecise':'active')):'lost';race.battery_level=b?.level??null;race.battery_charging=b?.charging??null;race.gps_status=gpsStatus;race.gps_last_at=lastGpsAt||null;localStorage.setItem(R,JSON.stringify(race));const payload={race_id:race.id,session_id:race.session_id,battery_level:b?.level??null,battery_charging:b?.charging??null,gps_status:gpsStatus,recorded_at:Date.now()};if(navigator.onLine){try{await fetch('/api/telemetry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})}catch(e){}}}
function startTelemetry(){clearInterval(telemetryTimer);sendTelemetry();telemetryTimer=setInterval(sendTelemetry,15000)}
function stopTelemetry(){clearInterval(telemetryTimer);telemetryTimer=null}
function recordGpsPosition(pos){if(!race||race.finish_at)return;const c=pos.coords,lat=Number(c.latitude),lon=Number(c.longitude),now=Date.now();const pt={race_id:race.id,session_id:race.session_id,lat,lon,accuracy:Number(c.accuracy)||null,recorded_at:now};if(lastLat!=null&&lastLon!=null){const moved=haversine(lastLat,lastLon,lat,lon);if(moved>=15)lastMovementAt=now}else lastMovementAt=now;lastLat=lat;lastLon=lon;lastGpsAt=now;race.gps_last=pt;race.gps_status=(pt.accuracy&&pt.accuracy>50)?'imprecise':'active';race.gps_last_at=now;localStorage.setItem(R,JSON.stringify(race));evaluateAlerts();setGpsStatus(`📍 GPS actif — précision annoncée : <b>${Math.round(pt.accuracy||0)} m</b>${lastMovementAt&&now-lastMovementAt>300000?' — ⚠️ position presque immobile':''}`,"ok");if(navigator.onLine)sendGpsPoint(pt).then(ok=>{if(!ok){gpsQueue.push(pt);saveGpsQueue()}});else{gpsQueue.push(pt);saveGpsQueue()}sendTelemetry()}
function gpsError(err){lastGpsAt=0;if(race){race.gps_status='lost';race.gps_last_at=null;localStorage.setItem(R,JSON.stringify(race));sendTelemetry()}const texts={1:"Autorisation GPS refusée. Le temps continue normalement, mais aucune position ne sera transmise.",2:"Position GPS indisponible. Le chronomètre continue.",3:"Recherche GPS trop longue. Le chronomètre continue."};setGpsStatus("📍 "+(texts[err?.code]||"GPS indisponible.")+" Vous pouvez poursuivre le parcours.","err")}
function startGps(){stopGps();lastGpsAt=0;lastMovementAt=Date.now();lastLat=null;lastLon=null;startTelemetry();if(!navigator.geolocation){setGpsStatus("📍 GPS non disponible sur cet appareil. Le chronomètre continue.","err");return}setGpsStatus("📍 Demande d’autorisation de localisation…","status");gpsWatch=navigator.geolocation.watchPosition(recordGpsPosition,gpsError,{enableHighAccuracy:true,maximumAge:5000,timeout:15000});flushGpsQueue()}
function stopGps(){stopTelemetry();if(gpsWatch!==null&&navigator.geolocation){navigator.geolocation.clearWatch(gpsWatch);gpsWatch=null}flushGpsQueue()}
function initGpsMap(){if(map||!window.L||!$("gpsMap"))return;map=L.map("gpsMap").setView([46.58,0.34],13);mapBases.ign=L.tileLayer("https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM_0_19&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",{maxZoom:19,attribution:"&copy; IGN / Géoplateforme"});mapBases.osm=L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:"&copy; OpenStreetMap contributors"});mapBases.ign.addTo(map);map._base="ign";mapBases.ign.on("tileerror",()=>{if(map&&map._base==="ign"&&!map._ignError){map._ignError=true;setTimeout(()=>{if(map&&map._base==="ign"){map.removeLayer(mapBases.ign);mapBases.osm.addTo(map);map._base="osm";const e=$("gpsMapStatus");if(e)e.textContent="Le fond IGN n’est pas disponible pour le moment : OpenStreetMap est utilisé en secours."}},500)}});setZoneButtons(false)}
function setMapBase(kind){if(!map||!mapBases[kind]||map._base===kind)return;Object.values(mapBases).forEach(l=>{if(map.hasLayer(l))map.removeLayer(l)});mapBases[kind].addTo(map);map._base=kind;map._ignError=false;const e=$("gpsMapStatus");if(e)e.textContent=kind==="ign"?"Fond cartographique : Plan IGN.":"Fond cartographique : OpenStreetMap."}
async function refreshGpsMap(){if(!session||!navigator.onLine||!map)return;try{const r=await apiFetch("/api/sessions/"+encodeURIComponent(session.id)+"/gps");if(!r.ok)return;const d=await r.json(),tracks=d.tracks||{};Object.values(mapLayers).forEach(v=>{if(v.line)map.removeLayer(v.line);if(v.marker)map.removeLayer(v.marker)});mapLayers={};let bounds=[];for(const [rid,pts] of Object.entries(tracks)){if(!pts.length)continue;const latlngs=pts.map(p=>[Number(p.lat),Number(p.lon)]);const last=pts[pts.length-1],done=!!last.finish_at;const line=L.polyline(latlngs,{weight:4,opacity:.75}).addTo(map);const marker=L.circleMarker([Number(last.lat),Number(last.lon)],{radius:8,weight:3,color:"#fff",fillColor:done?"#075d8d":"#a90818",fillOpacity:1}).addTo(map);marker.bindPopup(`<b>${esc(last.first_name+" "+last.last_name)}</b><br>${esc(last.class_name||"")}<br>${esc(last.course||"")}<br>${done?"🏁 Arrivé":"🏃 En course"}<br>Dernière position : ${clock(last.recorded_at)}`);mapLayers[rid]={line,marker};bounds.push(...latlngs)}if(bounds.length&&!map._hasGpsBounds){map.fitBounds(bounds,{padding:[25,25],maxZoom:17});map._hasGpsBounds=true}const status=$("gpsMapStatus");if(status)status.textContent=Object.keys(tracks).length?`${Object.keys(tracks).length} parcours avec au moins une position GPS.`:"Aucune position GPS reçue pour cette séance.";updateManagerAlerts(tracks)}catch(e){}}
async function loadSessionConfig(){if(!session)return null;try{const r=await fetch('/api/sessions/'+encodeURIComponent(session.id)+'/config',{cache:'no-store'});if(!r.ok)throw new Error();const d=await r.json();sessionConfig=d.session||null;localStorage.setItem('co-v29-config-'+session.id,JSON.stringify(sessionConfig));applyConfigToUI();drawSavedZone();return sessionConfig}catch(e){try{sessionConfig=JSON.parse(localStorage.getItem('co-v29-config-'+session.id)||'null');if(sessionConfig){applyConfigToUI();drawSavedZone()}}catch(_){}return sessionConfig}}
function applyConfigToUI(){if(!sessionConfig)return;const m=sessionConfig.max_duration_sec;const w=sessionConfig.warning_duration_sec;if($('maxDuration'))$('maxDuration').value=m?Math.round(m/60):'';if($('warningDuration'))$('warningDuration').value=w!=null?Math.round(w/60):'';if($('zoneStatus'))$('zoneStatus').textContent=sessionConfig.geofence_geojson?'Zone de course définie.':'Aucune zone définie.'}
async function saveAlertSettings(){if(!session)return msg('alertSettingsMsg','Aucune séance active.','err');const max=Number($('maxDuration')?.value||0),warn=Number($('warningDuration')?.value||0);if(!max)return msg('alertSettingsMsg','Indiquez une durée maximale.','err');if(warn>max)return msg('alertSettingsMsg','L’alerte préalable doit être inférieure à la durée maximale.','err');let geo=sessionConfig?.geofence_geojson||null;try{const r=await apiFetch('/api/sessions/'+encodeURIComponent(session.id)+'/config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({max_duration_sec:Math.round(max*60),warning_duration_sec:Math.round(warn*60),geofence_geojson:geo})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Erreur');sessionConfig=d.session;applyConfigToUI();msg('alertSettingsMsg','Paramètres d’alerte enregistrés.','ok')}catch(e){msg('alertSettingsMsg',esc(e.message),'err')}}
function setZoneButtons(drawing){const b=$('zoneDrawBtn'),f=$('zoneFinishBtn'),c=$('zoneCancelBtn');if(b){b.textContent=drawing?'🗺️ Ajouter des points':'🗺️ Dessiner la zone';b.disabled=drawing}if(f)f.classList.toggle('hidden',!drawing);if(c)c.classList.toggle('hidden',!drawing)}
function startZoneDrawing(){if(!map){msg('zoneStatus','La carte n’est pas encore disponible. Ouvrez/actualisez l’espace gestionnaire puis réessayez.','err');return}if(zoneDrawing)return;zoneDrawing=true;zoneDraft=[];if(zoneLayer){map.removeLayer(zoneLayer);zoneLayer=null}map.doubleClickZoom.disable();map.getContainer().style.cursor='crosshair';setZoneButtons(true);$('zoneStatus').innerHTML='<b>Mode dessin actif</b> — cliquez sur la carte pour placer au moins 3 points. Puis cliquez sur « Terminer la zone ».';map.on('click',addZonePoint);map.on('dblclick',finishZoneDraft)}
function addZonePoint(e){if(!zoneDrawing)return;zoneDraft.push([e.latlng.lat,e.latlng.lng]);if(zoneLayer)map.removeLayer(zoneLayer);zoneLayer=L.polygon(zoneDraft,{weight:3,fillOpacity:.15}).addTo(map);if(zoneDraft.length>=3){$('zoneStatus').innerHTML='<b>Zone en construction</b> — '+zoneDraft.length+' points. Cliquez sur « Terminer la zone ».'}else{$('zoneStatus').textContent='Point '+zoneDraft.length+' ajouté — encore '+(3-zoneDraft.length)+' nécessaire(s).'}}
function finishZoneDraft(){if(!zoneDrawing)return;map.off('click',addZonePoint);map.off('dblclick',finishZoneDraft);map.doubleClickZoom.enable();map.getContainer().style.cursor='';zoneDrawing=false;setZoneButtons(false);if(zoneLayer){map.removeLayer(zoneLayer);zoneLayer=null}if(zoneDraft.length>=3){const pts=zoneDraft.slice();if(pts[0][0]!==pts.at(-1)[0]||pts[0][1]!==pts.at(-1)[1])pts.push(pts[0]);zoneDraft=pts;zoneLayer=L.polygon(pts,{weight:3,fillOpacity:.15,dashArray:'6 5'}).addTo(map);sessionConfig=sessionConfig||{};sessionConfig.geofence_geojson=JSON.stringify({type:'Polygon',coordinates:[[...pts.map(p=>[p[1],p[0]])]]});$('zoneStatus').textContent='Zone définie. Cliquez sur « Enregistrer les paramètres » pour la conserver.'}else{$('zoneStatus').textContent='Zone annulée : au moins 3 points sont nécessaires.';zoneDraft=[]}}
function cancelZoneDrawing(){if(!zoneDrawing)return;map.off('click',addZonePoint);map.off('dblclick',finishZoneDraft);map.doubleClickZoom.enable();map.getContainer().style.cursor='';zoneDrawing=false;setZoneButtons(false);if(zoneLayer){map.removeLayer(zoneLayer);zoneLayer=null}zoneDraft=[];$('zoneStatus').textContent=sessionConfig?.geofence_geojson?'Zone existante conservée.':'Aucune zone définie.'}
function clearZone(){if(zoneDrawing)cancelZoneDrawing();if(zoneLayer&&map)map.removeLayer(zoneLayer);zoneLayer=null;zoneDraft=[];sessionConfig=sessionConfig||{};sessionConfig.geofence_geojson=null;if($('zoneStatus'))$('zoneStatus').textContent='Zone effacée. Cliquez sur « Enregistrer les paramètres » pour la conserver.'}
function drawSavedZone(){if(!map||!sessionConfig?.geofence_geojson)return;try{const g=JSON.parse(sessionConfig.geofence_geojson);const pts=g.coordinates[0].map(p=>[p[1],p[0]]);if(zoneLayer)map.removeLayer(zoneLayer);zoneLayer=L.polygon(pts,{weight:3,fillOpacity:.12,dashArray:'6 5'}).addTo(map)}catch(e){}}
function pointInPolygon(lat,lon,geo){if(!geo)return false;try{const ring=JSON.parse(geo).coordinates[0];let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];const intersect=((yi>lat)!=(yj>lat))&&(lon<(xj-xi)*(lat-yi)/(yj-yi)+xi);if(intersect)inside=!inside}return inside}catch(e){return true}}
function notifyParticipant(text,kind='warning'){const e=$('participantAlert');if(!e)return;e.className='status '+(kind==='err'?'err':'ok');e.innerHTML='🔔 <b>'+esc(text)+'</b>';e.classList.remove('hidden');if(navigator.vibrate)try{navigator.vibrate([250,100,250])}catch(e){}try{const C=window.AudioContext||window.webkitAudioContext;if(C){const c=new C(),o=c.createOscillator(),g=c.createGain();o.frequency.value=kind==='err'?880:660;g.gain.value=.08;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+.35);setTimeout(()=>c.close(),500)}}catch(e){}if('Notification' in window&&Notification.permission==='granted')try{new Notification('Course d’orientation',{body:text})}catch(e){}}
async function askNotificationPermission(){if('Notification' in window&&Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}}
function evaluateAlerts(){if(!race||race.finish_at||!sessionConfig)return;const elapsed=(Date.now()-race.start_at)/1000;const max=Number(sessionConfig.max_duration_sec||0),warn=Number(sessionConfig.warning_duration_sec||0);if(warn>0&&elapsed>=warn&&!alertState.warning){alertState.warning=true;notifyParticipant('Il vous reste environ '+Math.max(0,Math.ceil((max-elapsed)/60))+' minute(s) avant la limite.','warning')}if(max>0&&elapsed>=max&&!alertState.limit){alertState.limit=true;notifyParticipant('Temps limite dépassé — veuillez rejoindre l’arrivée.','err')}if(race.battery_level!=null&&Number(race.battery_level)<=.2&&!alertState.battery){alertState.battery=true;notifyParticipant('Batterie faible (20 % ou moins). Si possible, économisez la batterie et rejoignez l’arrivée.','warning')}if(race.battery_level!=null&&Number(race.battery_level)>.2)alertState.battery=false;if(lastGpsAt&&Date.now()-lastGpsAt>=45000&&!alertState.gpslost){alertState.gpslost=true;notifyParticipant('Le signal GPS semble perdu. Vérifiez que la localisation est toujours autorisée.','warning')}if(lastGpsAt&&Date.now()-lastGpsAt<45000)alertState.gpslost=false;if(race.gps_last&&lastMovementAt&&Date.now()-lastMovementAt>=300000&&!alertState.immobile){alertState.immobile=true;notifyParticipant('Votre position semble inchangée depuis plusieurs minutes. Vérifiez votre situation et poursuivez si tout va bien.','warning')}if(race.gps_last&&lastMovementAt&&Date.now()-lastMovementAt<300000)alertState.immobile=false;if(sessionConfig.geofence_geojson&&race.gps_last){const inside=pointInPolygon(Number(race.gps_last.lat),Number(race.gps_last.lon),sessionConfig.geofence_geojson);if(!inside&&!alertState.out){alertState.out=true;notifyParticipant('Attention : vous êtes sorti de la zone de course. Revenez dans la zone autorisée.','err')}if(inside)alertState.out=false}}
async function start(){
  if(startLocked || race && !race.finish_at){
    if(race && !race.finish_at) msg("pmsg","Un parcours est déjà en cours. Termine-le avant de démarrer un nouveau parcours.","status");
    return;
  }
  startLocked=true; setRaceButtons(false);
  let d=$("pdate").value||todayISO(),t=$("ptitle").value.trim();
  if(!d||!t){startLocked=false;setRaceButtons(false);return msg("pmsg",`Date reçue : <b>${esc(d||"vide")}</b> — Nom reçu : <b>${esc(t||"vide")}</b><br>Renseigne la date et le nom de la séance.`,"err");}
  if([$("first").value.trim(),$("last").value.trim(),$("cls").value.trim(),$("course").value.trim()].some(x=>!x)){
    startLocked=false;setRaceButtons(false);return msg("pmsg","Tous les champs sont obligatoires.","err");
  }
  let x=await resolveSession(d,t);
  if(!x){startLocked=false;setRaceButtons(false);return msg("pmsg","Impossible de préparer la séance.","err");}
  session=x;localStorage.setItem(K,JSON.stringify(session));
  await loadSessionConfig(); await askNotificationPermission(); alertState={warning:false,limit:false,out:false,immobile:false,battery:false,gpslost:false};
  let now=Date.now();
  let a={id:crypto.randomUUID(),session_id:session.id,session_date:session.date,session_title:session.title,
    first_name:$("first").value.trim(),last_name:$("last").value.trim(),class_name:$("cls").value.trim(),
    course:$("course").value.trim(),start_at:now,finish_at:null,updated_at:now,server_synced_at:0};
  race=a;localStorage.setItem(R,JSON.stringify(a));$("run").classList.remove("hidden");
  finishLocked=false;startLocked=false;setRaceButtons(true);tick();timer=setInterval(tick,1000);startGps();
  msg("pmsg",`Nouveau parcours enregistré pour <b>${esc(a.first_name)} ${esc(a.last_name)}</b><br>Séance <b>${esc(session.title)}</b> du <b>${session.date}</b><br>Départ enregistré à <b>${clock(a.start_at)}</b>`,"ok");sync();
}
function updateParticipantTelemetry(){const e=$('participantTelemetry');if(!e)return;if(!race||race.finish_at){e.textContent='📡 GPS : arrêté · 🔋 Batterie : —';return}const b=race.battery_level!=null?Math.round(Number(race.battery_level)*100)+'%'+(race.battery_charging?' ⚡':''):'—';const gs=race.gps_status==='active'?'🟢 actif':race.gps_status==='imprecise'?'🟠 imprécis':race.gps_status==='lost'?'🔴 perdu':'⚪ en attente';e.innerHTML='📡 GPS : '+gs+' · 🔋 Batterie : '+b+(race.battery_level!=null&&Number(race.battery_level)<=.2?' · ⚠️ faible':'')+(lastMovementAt&&Date.now()-lastMovementAt>=300000?' · 🟠 immobile':'')}
function tick(){if(race){$("timer").textContent=dur(Date.now()-race.start_at);evaluateAlerts();updateParticipantTelemetry()}}
function finish(){
  if(finishLocked||!race||race.finish_at)return;
  finishLocked=true;setRaceButtons(true);
  race.finish_at=Date.now();race.updated_at=Date.now();localStorage.setItem(R,JSON.stringify(race));clearInterval(timer);$("run").classList.add("hidden");
  stopGps(); history=[race,...history.filter(x=>x.id!==race.id)].slice(0,100);localStorage.setItem(H,JSON.stringify(history));renderHistory();
  msg("pmsg",`Arrivée enregistrée : <b>${dur(race.finish_at-race.start_at)}</b><br>Le parcours est terminé. Tu peux lancer un <b>nouveau parcours</b> quand tu le souhaites.`,"ok");makeQR();sync();
  setRaceButtons(false);
}
async function makeQR(){
  if(!race)return;
  try{
    const r=await fetch('/api/qr/'+encodeURIComponent(race.id),{cache:'no-store'});
    if(r.ok){const d=await r.json();$("qrCard").classList.remove("hidden");$("qr").src=d.data;return;}
  }catch(err){}
  const payload="COR2."+btoa(unescape(encodeURIComponent(JSON.stringify(race))));
  if(typeof QRCode!=="undefined")QRCode.toDataURL(payload,{width:420,margin:1},(e,u)=>{if(!e){$("qrCard").classList.remove("hidden");$("qr").src=u;}});
}
async function sync(){
  if(!navigator.onLine||!race)return;
  if(Number(race.server_synced_at||0)>=Number(race.updated_at||0))return;
  try{
    let rr=await fetch("/api/sync",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({results:[race]})});
    if(rr.ok){let d=await rr.json();if(d.ok){race.server_synced_at=Date.now();localStorage.setItem(R,JSON.stringify(race));if(d.synced)msg("pmsg",(race.finish_at?"Résultat":"Départ")+" synchronisé automatiquement.","ok")}}
  }catch(e){}
}
async function refresh(){
  if(!navigator.onLine||!session)return;
  try{
    let r=await apiFetch("/api/sessions/"+encodeURIComponent(session.id)+"/live");
    if(r.ok){let d=await r.json();results=d.results||[];localStorage.setItem(S,JSON.stringify(results));render();renderRoster();refreshGpsMap()}
  }catch(e){}
}


function normName(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()}
async function loadRoster(){if(!session||!localStorage.getItem('co_admin_token'))return;try{const r=await apiFetch('/api/sessions/'+encodeURIComponent(session.id)+'/participants');if(r.ok){const d=await r.json();roster=d.participants||[];renderRoster()}}catch(e){}}
function parseRosterCSV(text){const lines=text.replace(/^\uFEFF/,'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return [];const sep=(lines[0].includes(';')?';':',');const head=lines.shift().split(sep).map(x=>normName(x));const map={first_name:head.findIndex(x=>['prenom','prénom','first name','firstname'].includes(x)),last_name:head.findIndex(x=>['nom','name','lastname','last name'].includes(x)),class_name:head.findIndex(x=>['classe','class'].includes(x)),group_name:head.findIndex(x=>['groupe','group'].includes(x))};if(map.first_name<0||map.last_name<0)throw new Error('Le CSV doit contenir les colonnes Prénom et Nom.');return lines.map(line=>{const a=line.split(sep).map(x=>x.trim().replace(/^"|"$/g,''));return {first_name:a[map.first_name]||'',last_name:a[map.last_name]||'',class_name:map.class_name>=0?(a[map.class_name]||''):'',group_name:map.group_name>=0?(a[map.group_name]||''):''}}).filter(x=>x.first_name&&x.last_name)}
async function importRosterFile(ev){const f=ev.target.files?.[0];if(!f||!session)return;try{const rows=parseRosterCSV(await f.text());if(!rows.length)throw new Error('Aucun participant valide.');const r=await apiFetch('/api/sessions/'+encodeURIComponent(session.id)+'/participants/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({participants:rows})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Import impossible');roster=d.participants||rows;renderRoster();msg('rosterMsg',`${Number(d.count||rows.length)} participant(s) importé(s).`,'ok')}catch(e){msg('rosterMsg',esc(e.message),'err')}ev.target.value=''}
async function clearRoster(){if(!session||!confirm('Effacer la liste des participants attendus pour cette séance ?'))return;const r=await apiFetch('/api/sessions/'+encodeURIComponent(session.id)+'/participants',{method:'DELETE'});if(r.ok){roster=[];renderRoster();msg('rosterMsg','Liste effacée.','ok')}}
function downloadRosterTemplate(){const csv='\ufeffNom;Prénom;Classe;Groupe\r\nDUPONT;Jean;STAPS L2;Groupe A\r\n';const b=new Blob([csv],{type:'text/csv;charset=utf-8'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='participants-modele.csv';a.click();URL.revokeObjectURL(u)}
function renderRoster(){const e=$('rosterTable');if(!e)return;const a=results.filter(x=>!session||x.session_id===session.id);if(!roster.length){e.innerHTML='<p class="small">Aucune liste importée. Vous pouvez tout de même utiliser la séance normalement.</p>';return}const rows=roster.map(p=>{const rr=a.filter(x=>normName(x.first_name)===normName(p.first_name)&&normName(x.last_name)===normName(p.last_name)&&(!p.class_name||normName(x.class_name)===normName(p.class_name)));const active=rr.find(x=>!x.finish_at),last=rr.slice().sort((x,y)=>Number(y.start_at)-Number(x.start_at))[0];let st=active?'🟢 En course':last?'🔵 Arrivé':'⚪ Pas parti';return `<tr><td><b>${esc(p.first_name+' '+p.last_name)}</b></td><td>${esc(p.class_name||'')}</td><td>${esc(p.group_name||'')}</td><td>${st}</td><td>${rr.length}</td><td>${active?dur(Date.now()-active.start_at):last?.finish_at?dur(last.finish_at-last.start_at):'—'}</td><td>${active?(last?.gps_status==='lost'?'🔴 GPS perdu':last?.gps_status==='imprecise'?'🟠 GPS imprécis':'🟢 GPS actif'):(last?.gps_status?'⚪ '+esc(last.gps_status):'—')}</td><td>${last?.battery_level!=null?Math.round(Number(last.battery_level)*100)+' %':'—'}</td></tr>`});e.innerHTML='<table><tr><th>Participant</th><th>Classe</th><th>Groupe</th><th>Statut</th><th>Parcours</th><th>Temps</th><th>GPS</th><th>Batterie</th></tr>'+rows.join('')+'</table>'}
function render(){
  let a=results.slice();if(session)a=a.filter(x=>x.session_id===session.id);
  let fc=($("fc")?.value||"").toLowerCase(),fco=($("fco")?.value||"").toLowerCase();
  a=a.filter(x=>(!fc||String(x.class_name).toLowerCase().includes(fc))&&(!fco||String(x.course).toLowerCase().includes(fco)));
  let done=a.filter(x=>x.finish_at),run=a.filter(x=>!x.finish_at),avg=done.length?done.reduce((s,x)=>s+x.finish_at-x.start_at,0)/done.length:0;
  $("stats").innerHTML=`<span class=stat><b>${a.length}</b> participants</span><span class=stat><b>${run.length}</b> en course</span><span class=stat><b>${done.length}</b> arrivés</span><span class=stat><b>${done.length?dur(avg):"—"}</b> moyenne</span>`;
  if($("liveStats")) $("liveStats").innerHTML=`<span class=stat><b>${run.length}</b> 🏃 en course</span><span class=stat><b>${done.length}</b> 🏁 arrivés</span>`; renderSecurityTable();
  if($("liveNow")) $("liveNow").innerHTML=run.length?'<b>Participants encore en course</b><div class="table"><table><tr><th>Participant</th><th>Classe</th><th>Circuit / balises</th><th>Départ</th><th>Temps écoulé</th></tr>'+run.map(x=>`<tr><td><b>${esc(x.first_name+' '+x.last_name)}</b></td><td>${esc(x.class_name)}</td><td><b>${esc(x.course||'—')}</b></td><td>${clock(x.start_at)}</td><td><b data-live-start="${x.start_at}">${dur(Date.now()-x.start_at)}</b></td></tr>`).join('')+'</table></div>':'<span class="small">Aucun participant actuellement en course.</span>';
  $("table").innerHTML=a.length?`<div class="small sessionline">Séance : <b>${esc(session?.title||"")}</b> — Date : <b>${esc(session?.date||"")}</b></div><table><tr><th>Participant</th><th>Classe</th><th>Circuit</th><th>Départ</th><th>Arrivée</th><th>Temps</th></tr>${a.map(x=>`<tr><td>${esc(x.first_name+" "+x.last_name)}</td><td>${esc(x.class_name)}</td><td>${esc(x.course)}</td><td>${clock(x.start_at)}</td><td>${x.finish_at?clock(x.finish_at):"—"}</td><td><b>${x.finish_at?dur(x.finish_at-x.start_at):"En course"}</b></td></tr>`).join("")}</table>`:"<p class=small>Aucun résultat.</p>"
}
function updateManagerAlerts(tracks){
  const e=$('liveAlerts'); if(!e)return;
  const alerts=[], now=Date.now(), max=Number(sessionConfig?.max_duration_sec||0), geo=sessionConfig?.geofence_geojson;
  for(const [rid,pts] of Object.entries(tracks||{})){
    if(!pts.length)continue;
    const last=pts[pts.length-1];
    if(last.finish_at)continue;
    const elapsed=(now-Number(last.start_at))/1000;
    if(max&&elapsed>=max)alerts.push('🔴 '+esc(last.first_name+' '+last.last_name)+' — temps limite dépassé');
    if(geo&&!pointInPolygon(Number(last.lat),Number(last.lon),geo))alerts.push('🔴 '+esc(last.first_name+' '+last.last_name)+' — hors zone');
    const age=now-Number(last.recorded_at);
    if(age>45000)alerts.push('🔴 '+esc(last.first_name+' '+last.last_name)+' — GPS perdu depuis '+Math.round(age/1000)+' s');
    else if(Number(last.accuracy)>50)alerts.push('🟠 '+esc(last.first_name+' '+last.last_name)+' — GPS imprécis');
    if(last.battery_level!=null&&Number(last.battery_level)<=.2)alerts.push('🟠 '+esc(last.first_name+' '+last.last_name)+' — batterie faible ('+Math.round(Number(last.battery_level)*100)+' %)');
    const recent=pts.filter(p=>now-Number(p.recorded_at)<=300000);
    if(recent.length>=2){let dist=0;for(let i=1;i<recent.length;i++)dist+=haversine(Number(recent[i-1].lat),Number(recent[i-1].lon),Number(recent[i].lat),Number(recent[i].lon));if(dist<15&&now-Number(recent[0].recorded_at)>=240000)alerts.push('🟠 '+esc(last.first_name+' '+last.last_name)+' — position presque immobile depuis plusieurs minutes')}
  }
  for(const x of results.filter(x=>!session||x.session_id===session.id)){
    if(x.finish_at)continue;
    if(x.battery_level!=null&&Number(x.battery_level)<=.2&&!alerts.some(a=>a.includes(x.first_name+' '+x.last_name)&&a.includes('batterie')))alerts.push('🟠 '+esc(x.first_name+' '+x.last_name)+' — batterie faible ('+Math.round(Number(x.battery_level)*100)+' %)');
    if(x.gps_status==='lost'&&!alerts.some(a=>a.includes(x.first_name+' '+x.last_name)&&a.includes('GPS perdu')))alerts.push('🔴 '+esc(x.first_name+' '+x.last_name)+' — GPS perdu');
    if(x.gps_status==='imprecise'&&!alerts.some(a=>a.includes(x.first_name+' '+x.last_name)&&a.includes('GPS imprécis')))alerts.push('🟠 '+esc(x.first_name+' '+x.last_name)+' — GPS imprécis');
  }
  e.innerHTML=alerts.length?'<b>Alertes actives</b><br>'+alerts.join('<br>'):'<span class="small">Aucune alerte active.</span>';
}

function renderSecurityTable(){
  const e=$('securityTable'); if(!e)return;
  const a=results.filter(x=>!session||x.session_id===session.id), now=Date.now();
  if(!a.length){e.innerHTML='<p class="small">Aucun participant en cours de suivi.</p>';return}
  const rows=a.slice().sort((x,y)=>(x.finish_at?1:0)-(y.finish_at?1:0)||Number(y.start_at)-Number(x.start_at)).map(x=>{
    const active=!x.finish_at, age=x.gps_last_at?now-Number(x.gps_last_at):Infinity;
    const gps=x.gps_status==='active'&&age<=45000?'🟢 Actif':x.gps_status==='imprecise'?'🟠 Imprécis':x.gps_status==='lost'||age>45000?'🔴 Perdu':'⚪ En attente';
    const batt=x.battery_level!=null?Math.round(Number(x.battery_level)*100)+' %'+(Number(x.battery_level)<=.2?' ⚠️':''):'—';
    const stale=active&&x.gps_last_at&&age>45000;
    return `<tr><td><b>${esc(x.first_name+' '+x.last_name)}</b></td><td>${esc(x.class_name||'')}</td><td>${active?'🟢 En course':'🔵 Arrivé'}</td><td>${gps}${stale?' <span class="small">('+Math.round(age/1000)+' s)</span>':''}</td><td>${batt}</td><td>${x.gps_last_at?clock(x.gps_last_at):'—'}</td><td>${active&&x.gps_last_at&&age>=300000?'🟠 À vérifier':'—'}</td></tr>`;
  });
  e.innerHTML='<table><tr><th>Participant</th><th>Classe</th><th>Statut</th><th>GPS</th><th>Batterie</th><th>Dernière télémétrie</th><th>Mobilité</th></tr>'+rows.join('')+'</table>';
}

function updateLiveClocks(){document.querySelectorAll("[data-live-start]").forEach(e=>e.textContent=dur(Date.now()-Number(e.dataset.liveStart)));}
let qrStream=null,qrScanTimer=null;
async function startQrScanner(){
  const video=$("qrVideo"),stop=$("stopQr"); if(!video)return;
  if(!navigator.mediaDevices?.getUserMedia)return msg("qrRecoverMsg","La caméra n’est pas disponible sur cet appareil. Utilise le champ de secours ou une image QR.","err");
  try{qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});video.srcObject=qrStream;video.classList.remove("hidden");stop.classList.remove("hidden");await video.play();
    if("BarcodeDetector" in window){const detector=new BarcodeDetector({formats:["qr_code"]});const scan=async()=>{if(!qrStream)return;try{const codes=await detector.detect(video);if(codes[0]?.rawValue){$("qrPayload").value=codes[0].rawValue;await recoverQr();stopQrScanner();return}}catch(e){}qrScanTimer=setTimeout(scan,350)};scan();}
    else msg("qrRecoverMsg","Le navigateur ne permet pas le scan caméra automatique. Utilise une image QR ou colle le contenu du QR.","status");
  }catch(e){msg("qrRecoverMsg","Impossible d’accéder à la caméra. Vérifie l’autorisation du navigateur.","err")}
}
function stopQrScanner(){if(qrScanTimer){clearTimeout(qrScanTimer);qrScanTimer=null}if(qrStream){qrStream.getTracks().forEach(t=>t.stop());qrStream=null}const v=$("qrVideo"),b=$("stopQr");if(v){v.pause();v.srcObject=null;v.classList.add("hidden")}if(b)b.classList.add("hidden")}
function decodeQrFile(ev){const f=ev.target.files?.[0];if(!f||typeof jsQR!=="function")return msg("qrRecoverMsg","Lecture d’image QR indisponible. Colle le contenu du QR dans le champ ci-dessous.","err");const rd=new FileReader();rd.onload=()=>{const img=new Image();img.onload=()=>{const c=document.createElement("canvas"),ctx=c.getContext("2d",{willReadFrequently:true});const max=1600,scale=Math.min(1,max/Math.max(img.width,img.height));c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);ctx.drawImage(img,0,0,c.width,c.height);const d=ctx.getImageData(0,0,c.width,c.height),code=jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(!code)return msg("qrRecoverMsg","Aucun QR lisible dans cette image.","err");$("qrPayload").value=code.data;recoverQr()};img.src=rd.result};rd.readAsDataURL(f)}
async function recoverQr(){const payload=$("qrPayload")?.value.trim();if(!payload)return msg("qrRecoverMsg","Scanne ou colle d’abord un QR de récupération.","err");try{const r=await apiFetch("/api/recover",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({payload})});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||"QR invalide");results=[d.result,...results.filter(x=>x.id!==d.result.id)];localStorage.setItem(S,JSON.stringify(results));render();msg("qrRecoverMsg",`Résultat récupéré pour <b>${esc(d.result.first_name)} ${esc(d.result.last_name)}</b>.`,"ok");$("qrPayload").value=""}catch(e){msg("qrRecoverMsg",esc(e.message),"err")}}
function exportCSV(){
  let a=results.filter(x=>!session||x.session_id===session.id),o=["Prénom;Nom;Classe;Circuit / balises;Départ;Arrivée;Temps"];
  a.forEach(x=>o.push([x.first_name,x.last_name,x.class_name,x.course,clock(x.start_at),clock(x.finish_at),x.finish_at?dur(x.finish_at-x.start_at):""].map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")));
  let b=new Blob(["\ufeff"+o.join("\r\n")],{type:"text/csv"}),u=URL.createObjectURL(b),a1=document.createElement("a");a1.href=u;a1.download="orientation-"+(session?.date||"resultats")+".csv";a1.click()
}
if(!$("pdate").value) $("pdate").value=todayISO();
if(!$("gdate").value) $("gdate").value=session?.date||todayISO();
net();fillParticipantSession();showServerVersion();renderHistory();checkAdmin();
if(localStorage.getItem('co_admin_token'))loadRoster();
if(race&&!race.finish_at){$("run").classList.remove("hidden");tick();timer=setInterval(tick,1000);setRaceButtons(true);startGps()}
else {setRaceButtons(false);updateParticipantTelemetry()}
if(race&&race.finish_at)makeQR();setTimeout(()=>{initGpsMap();map?.invalidateSize();refreshGpsMap();renderSessionQR()},700);
window.addEventListener("online",flushGpsQueue);setInterval(()=>{sync();flushGpsQueue();if($("managerContent")&&!$("managerContent").classList.contains("hidden"))refresh()},2000);setInterval(()=>{if($("managerContent")&&!$("managerContent").classList.contains("hidden"))refreshGpsMap()},5000);setInterval(updateLiveClocks,1000);render();
