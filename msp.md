# Planning avec marge

Application web monopage (`msp.html`) qui importe un planning exporté depuis **Microsoft Project au format XML** et produit une **version « avec marge »** : chaque durée est multipliée par un coefficient, puis toutes les dates sont recalculées en respectant les liens de dépendance entre tâches.

## Fonctionnement général

```
Fichier XML MS Project → Import → Tableau + Gantt → Application de la marge → Export (XML / CSV / HTML / PDF)
```

Le planning initial s'affiche en **gris**, le planning recalculé avec marge en **bleu**, les jalons en **losanges orange**, les tâches critiques en **rouge**, et le chemin de la tâche sélectionnée en **violet**.

## Onglets du ruban

| Onglet | Contenu |
|---|---|
| **Fichier** | Ouvrir un fichier XML/MSPDI (bouton ou glisser-déposer), exporter la vue courante en XML Project, CSV (Excel), HTML, PDF, **PPTX (sélection)**, ou un **rapport de projet HTML imprimable** |
| **Tâche** | Boutons de niveaux hiérarchiques, **édition du planning** (ajouter/supprimer/monter/descendre/indenter/désindenter, Annuler/Rétablir), choix des colonnes visibles, effacement des filtres/tris |
| **Projet** | Coefficient de marge (ex. 1.3), méthode de calcul : « Respecter les liens » (propagation via les prédécesseurs) ou « Homothétie du calendrier » (mise à l'échelle globale), **calendrier** (jours ouvrés, choix du calendrier du projet), **baselines MS Project 0–10** (dates, durées et coûts) et **contraintes** (case « Appliquer les contraintes dans le calcul ») |
| **Affichage** | Zoom (tout le projet ↔ 1 jour), affichage du planning initial, de la **baseline**, des liens entre tâches, de la ligne « aujourd'hui », et **ligne de progression** à une date de statut réglable |
| **Format** | Chemin critique en rouge, chemin de la tâche sélectionnée (prédécesseurs/successeurs pilotants ou tous), texte affiché à droite des barres (nom, ID, durée, dates, % achevé, ressources, décalage de fin) |

## Séparateur tableau / Gantt

- La limite verticale entre le tableau (gauche) et le Gantt (droite) se **glisse à la souris** (poignée entre les deux volets, surlignée au survol). Largeur min 220 px, max 92 % ; la position est **mémorisée** (localStorage) et restaurée au rechargement.

## Vue tableau (gauche)

- Colonnes issues des champs MS Project (ID, UID, Nom, **Type de tâche**, WBS, Durée, Début, Fin, % achevé, coûts MSP, ressources, prédécesseurs, **successeurs**, attributs étendus, etc.) plus colonnes calculées : début/fin/durée avec marge, décalage de fin, alerte contrainte et budget/coûts calculés.
- Les durées XML en ISO 8601 (`PT8H0M`) et les valeurs numériques en millisecondes sont affichées en jours du calendrier du projet (8 h par défaut) ; leur modification accepte `3j`, `24h` ou une durée ISO.
- La colonne **Type de tâche** propose un sélecteur visuel à deux boutons avec pictogrammes (tâche / losange de jalon) ; les tâches récapitulatives ne peuvent pas être converties en jalon.
- Tri et **filtres façon Excel** via le bouton ▾ de chaque en-tête (sélection de valeurs, recherche, conditions comparatives).
- **Regrouper par** (liste « Regrouper » de l'onglet Tâche) : les lignes sont groupées sous des en-têtes de groupe (valeur + effectif), dans le tableau comme dans le Gantt, façon « Regrouper par » de MS Project. Par « Noms des ressources », une tâche affectée à plusieurs ressources apparaît dans chaque groupe. Le tri en cours s'applique à l'intérieur des groupes ; les filtres s'appliquent avant regroupement.
- **Sélection multiple** façon MS Project : `Ctrl`+clic (ou `Cmd`+clic) pour ajouter/retirer une tâche, `Maj`+clic pour sélectionner une plage depuis la dernière tâche cliquée, clic simple pour tout désélectionner. Compteur « Sélection : N tâche(s) » dans la barre de statut ; la suppression supprime toute la sélection.
- Clic sur une ligne pour sélectionner la tâche ; clic sur ▶/▼ pour replier/déplier la hiérarchie.

## Vue Gantt (droite)

- Barres initiales (gris) et barres avec marge (bleu) superposées, jalons en losanges.
- **Dates réelles** : activez « Dates réelles » dans l'onglet Affichage pour superposer en vert les dates `ActualStart`/`ActualFinish` du fichier MSPDI. Si une tâche a commencé mais n'a pas encore de date de fin réelle, la barre réelle va jusqu'à la date de statut. Le Gantt et les exports HTML/PDF/PPTX incluent ces dates dans leur étendue temporelle.
- **Liens de dépendance** tracés entre tâches (FF, FD, DF, DD avec lags), en violet ou rouge s'ils appartiennent au chemin sélectionné/critique.
- Ligne verticale en pointillés rouges pour la date du jour.
- Zoom continu (curseur en bas) : de la vue projet entière jusqu'à 1 jour.

## Calcul de la marge

- Chaque durée de tâche feuille est multipliée par le coefficient `k`.
- En mode « Respecter les liens », les tâches sont recalculées dans l'ordre topologique : le début de chaque tâche est le maximum de son début initial et des fins (ou débuts) de ses prédécesseurs décalés du lag.
- En mode « Homothétie », tout le calendrier est mis à l'échelle proportionnellement depuis le début du projet.
- Les tâches récapitulatives (summary) englobent leurs enfants recalculés.

## Suivi d'avancement

- **Barres de progression** dans le Gantt (et les exports HTML/PDF) : remplissage sombre à hauteur du % achevé, sur la barre avec marge (bleue) et sur la barre initiale (grise).
- **Dates réelles** : le Gantt et les exports HTML/PDF/PPTX affichent en vert la période réelle tirée de `ActualStart` et `ActualFinish` ; pour une tâche en cours sans fin réelle, la date de statut sert de fin provisoire.
- **Baselines MS Project** : les emplacements 0 à 10 sont importés/exportés avec les champs MSPDI correspondants (`BaselineStart`/`Baseline1Start`…`Baseline10Start`, idem pour fin et durée). Choisir un emplacement puis « Définir référence » enregistre les dates et durées courantes pour toutes les tâches ; « Effacer » ne supprime que l'emplacement choisi. La baseline sélectionnée est affichée en pointillés orange dans le Gantt et les colonnes « Écart début (j) » et « Écart fin (j) » comparent le planning courant à celle-ci, en jours ouvrés si le calendrier est actif. Les dates et durées de référence sont disponibles dans le sélecteur de colonnes ; capture et effacement sont annulables.
- **Suivi des coûts MSPDI** : lit `Cost`, `ActualCost`, `RemainingCost`, `FixedCost` et `BaselineCost` sur les tâches, ainsi que les coûts et le travail des affectations et les taux standard/coûts par utilisation des ressources. Les colonnes calculées « Budget / estimé » et « Coût réel » sont affichées par défaut ; le reste, le budget de référence et l’écart sont disponibles dans le sélecteur. Les coûts source restent modifiables dans les colonnes MSP.
- **Budget estimé depuis les ressources** : si `Cost` manque, le budget est estimé depuis le travail d’affectation × taux standard ; si le travail manque, la durée de tâche × unités est utilisée. Les coûts fixes et par utilisation sont inclus. `~` indique une estimation, `*` une couverture partielle. Le coût réel n’est jamais déduit du seul % achevé.
- **Coût de référence** : « Définir référence » enregistre aussi `BaselineCost` (ou `Baseline1Cost`…`Baseline10Cost`) quand un budget peut être calculé ; l’effacement d’un emplacement supprime également son coût de référence.
- **Rapport de projet** (onglet Fichier) : export HTML imprimable / PDF avec synthèse du calendrier, avancement, tâches en retard et critiques, prochains jalons, budget par phase et coût par ressource. Il compare budget, coût réel, reste et baseline quand ces valeurs existent et précise les hypothèses ou données manquantes.
- **Exemple fourni** : [exemple-msproject.xml](./exemple-msproject.xml) contient 50 tâches, 5 ressources tarifées et 18 affectations. Il ne contient pas de coûts ni de travaux réels explicites : le rapport affiche donc un budget estimé (environ 56 880 € pour les tarifs de cet exemple), sans inventer de coût réel ; la devise EUR est utilisée par défaut car le XML ne la précise pas.
- **Ligne de progression** (onglet Affichage, date de statut réglable, aujourd'hui par défaut) : ligne verticale verte en pointillés à la date de statut, avec un **losange sur chaque tâche en cours** à cette date — rouge si l'avancement est inférieur à ce que le calendrier prévoit (retard), vert sinon. Le % attendu est calculé en temps ouvré quand le calendrier est actif.
- **Tâches en retard** : barre latérale rouge sur la ligne des tâches non terminées dont la fin prévue est dépassée à la date de statut ; compteur « En retard » dans la barre de statut.
- **% achevé des récapitulatives** : cumulé au prorata des durées des tâches filles (comme MS Project).

## Édition du planning

Le planning n'est plus en lecture seule (toutes les modifications sont répercutées dans l'export XML) :

- **Ajouter** : insère une tâche après la tâche sélectionnée (même niveau hiérarchique, durée 8 h, début au prochain jour ouvré après la fin de la sélection).
- **Suppr.** (ou touche `Suppr`) : supprime la tâche sélectionnée et tout son sous-arbre, et retire les liens qui la ciblaient.
- **Monter / Descendre** : réordonne la tâche parmi ses frères. **Indenter / Désindenter** : change son niveau hiérarchique (elle devient enfant de la tâche précédente / remonte d'un niveau).
- **Édition en ligne** : double-clic sur une cellule soulignée (ou **F2 / Entrée** sur la ligne sélectionnée pour éditer le nom) — les colonnes éditables permettent de modifier le nom, la durée (`3j`, `24h`, `PT8H0M`), les dates (`jj/mm/aaaa`), nombres, booléens (Oui/Non), textes libres, **prédécesseurs** et **successeurs** au format MS Project (`1FD`, `2FF+1j`, séparés par des virgules ; vider la cellule supprime tous les liens). La colonne « Type de tâche » se change avec les boutons illustrés « Tâche » / « Jalon ». `Entrée` valide, `Échap` annule. Modifier une date ou une durée recalcule l'autre, et tout le planning avec marge est recalculé (liens compris).
- **Menu contextuel** : clic droit sur une ligne (tableau ou Gantt) → Ajouter / **Copier** / **Coller** / **Dupliquer** / Supprimer / Monter / Descendre / Indenter / Désindenter / Annuler / Rétablir.
- **Copier / Coller** (`Ctrl+C` / `Ctrl+V`, ou menu contextuel) : copie les tâches sélectionnées **avec tout leur sous-arbre** et les liens internes (les liens vers des tâches non copiées sont abandonnés). Le collage insère les copies après la tâche sélectionnée, avec de nouveaux UID/ID et un niveau hiérarchique relatif conservé (« (copie) » ajouté au nom quand on copie une seule tâche). **Dupliquer** (⧉) = copier + coller immédiat.
- **Recherche rapide** (`Ctrl+F` ou champ 🔍 de l'onglet Tâche) : filtre les lignes affichées sur le nom ou l'ID (les tâches trouvées et leurs parents restent visibles, la hiérarchie est préservée). Le bouton « Effacer filtres/tri » vide aussi cette recherche.
- **Colonnes « Prédécesseurs » et « Successeurs » éditables** : saisir les liens au format MS Project (`2FD`, `3FF+1j`, séparés par des virgules ; vider = supprimer). Éditer les successeurs d'une tâche remplace tous ses liens sortants. Les liens circulaires sont refusés.

## Édition graphique dans le Gantt

- **Glisser une barre** (corps) : déplace la tâche (début + fin, durée conservée), par pas d'un jour, snappé sur le temps ouvré si le calendrier est actif ; les successeurs sont recalculés.
- **Tirer le bord droit d'une barre** : redimensionne la tâche (la fin suit la souris, snappée en fin de journée ouvrée ; la durée est recalculée).
- **Tirer le bord droit d'une barre vers une autre barre** : crée un lien **FD** (finir-à-démarrer) entre les deux tâches, comme dans MS Project.
- Toutes ces modifications sont undoables (Ctrl+Z), recalculent le planning avec marge et sont persistées dans l'export XML.
- **Annuler / Rétablir** (boutons ↶ ↷ ou `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Maj+Z`) : historique de 100 états.
- Les tâches récapitulatives ne sont pas éditables en durée/dates (elles englobent leurs filles), mais leur nom et leurs prédécesseurs le sont.
- Les opérations d'ajout, déplacement, indentation, désindentation, collage et suppression renumérotent automatiquement WBS et `OutlineNumber`.
- Les liens prédécesseurs/successeurs sont refusés lorsqu'ils créent une boucle circulaire dans le planning.

## Contraintes et échéances

- Case « **Appliquer les contraintes dans le calcul** » (onglet Projet, cochée par défaut). Les contraintes du fichier (`ConstraintType` / `ConstraintDate`) sont prises en compte dans le recalcul avec marge, en temps ouvré si le calendrier est actif :
  - « Doit commencer le » (2) et « Début au plus tôt » (4) **bloquent le début** à la date de contrainte (marqueur orange dans le Gantt) ;
  - « Doit finir le » (3), « Début au plus tard » (5), « Fin au plus tard » (7) et l'**échéance** (`Deadline`) ne déplacent pas la tâche mais déclenchent une **alerte** si la date calculée les dépasse : liseré orange/rouge sur la ligne, colonne « Alerte » (filtrable), marqueur d'échéance en pointillés rouges dans le Gantt, compteur « Alertes » dans la barre de statut.
- Les champs `ConstraintType` (éditable aussi par son libellé, ex. « Doit finir le »), `ConstraintDate` et `Deadline` sont modifiables en double-clic comme toute colonne.
- « Dès que possible » (0) et « Le plus tard possible » (1) n'ont pas d'effet sur le calcul avec marge (pas de planification à rebours).

## Calendrier et jours ouvrés

- Les **calendriers du fichier XML** sont lus (`<Calendars>`) : semaine type (`WeekDays`, horaires `WorkingTimes`) et **exceptions** (jours fériés / jours non travaillés par plage de dates), y compris l'héritage des calendriers de base (`BaseCalendarUID`). Le calendrier de chaque tâche (`CalendarUID`) est pris en compte, sinon celui du projet.
- Case « **Jours ouvrés** » (onglet Projet, cochée automatiquement si le fichier contient des calendriers) : les durées (`PT…H…M`) et les lags sont comptés en **temps ouvré** — week-ends et jours fériés exclus, pauses intra-journalières respectées. Exemple : une tâche de 5 j commençant un jeudi se termine le jeudi suivant (et non le mardi). Les décalages affichés (colonne « Décalage fin », barre de statut, étiquettes de barres) sont en **jours ouvrés**.
- Si la case est décochée, on retombe sur l'ancien comportement : tout le temps est calendaire (les week-ends comptent).
- Dans le Gantt (et les exports HTML/PDF), les **jours non travaillés sont grisés** quand le zoom est suffisant.
- La durée d'un « jour » affichée (colonne Durée) est déduite du calendrier (8 h par défaut pour le calendrier Standard).
- Les exceptions récurrentes quotidiennes, hebdomadaires, mensuelles et annuelles sont prises en charge selon les champs MSPDI (`Type`, `Period`, `Occurrences`, `DaysOfWeek`, `Month`, `MonthDay`, `MonthPosition`) ; les calendriers de ressources ne modifient pas la planification des tâches.

## Tests automatisés

- Exécuter la suite : `npm test`
- Les tests couvrent les semaines normales, les exceptions fixes, les exceptions récurrentes quotidiennes/hebdomadaires/mensuelles/annuelles et le parsing des durées MS Project.

## Chemin critique et chemins pilotants

- Le **chemin critique** est calculé à rebours depuis la fin du projet (tâches sans marge, enchaînées par des liens pilotants) et affiché en rouge si l'option est cochée.
- Pour la tâche sélectionnée, on peut afficher ses **prédécesseurs pilotants**, **successeurs pilotants** ou le **chemin pilotant complet** (en violet).

## Exports

| Format | Description |
|---|---|
| **XML Project / MSPDI** | Le fichier XML d'origine avec Start/Finish/Duration modifiés selon la marge — réimportable dans MS Project |
| **CSV** | La vue tableau courante (séparateur `;`, compatible Excel) |
| **HTML** | Une image SVG fidèle de la vue courante (tableau + Gantt), autonome |
| **PDF** | Impression de cette même vue via le navigateur |
| **PPTX (sélection)** | Fichier PowerPoint généré entièrement côté client (package OOXML/zip écrit en JS pur, sans bibliothèque) : une diapo de titre avec le récapitulatif du projet, une diapo avec l'image de la vue Gantt courante, puis **une diapo par tâche sélectionnée** (durée initiale/avec marge, dates, décalage, % achevé, ressources, prédécesseurs, alerte). Sans sélection, exporte les tâches visibles. Le fichier s'ouvre dans PowerPoint / LibreOffice / Google Slides |
| **Rapport projet HTML** | Rapport autonome et imprimable avec bouton « Imprimer / PDF », synthèse calendrier/coûts, ventilation par phase et ressource et tâches en retard |

## Barre de statut

Indique la fin initiale, la fin avec marge, le décalage total en jours, le nombre de lignes affichées, le coefficient appliqué et la tâche sélectionnée.

## Contraintes

- Ne lit **pas** les fichiers binaires `.mpp` (format propriétaire) : dans MS Project, faire *Fichier › Enregistrer sous › Fichier XML*.
- Fonctionne entièrement côté client, aucune donnée n'est envoyée sur le réseau.
- Supporte le thème sombre via `prefers-color-scheme`.
