# Planning avec marge

Application web monopage (`planning-avec-marge.html`) qui importe un planning exporté depuis **Microsoft Project au format XML** et produit une **version « avec marge »** : chaque durée est multipliée par un coefficient, puis toutes les dates sont recalculées en respectant les liens de dépendance entre tâches.

## Fonctionnement général

```
Fichier XML MS Project → Import → Tableau + Gantt → Application de la marge → Export (XML / CSV / HTML / PDF)
```

Le planning initial s'affiche en **gris**, le planning recalculé avec marge en **bleu**, les jalons en **losanges orange**, les tâches critiques en **rouge**, et le chemin de la tâche sélectionnée en **violet**.

## Onglets du ruban

| Onglet | Contenu |
|---|---|
| **Fichier** | Ouvrir un fichier XML (bouton ou glisser-déposer), exporter la vue courante en XML Project, CSV (Excel), HTML ou PDF |
| **Tâche** | Boutons de niveaux hiérarchiques, **édition du planning** (ajouter/supprimer/monter/descendre/indenter/désindenter, Annuler/Rétablir), choix des colonnes visibles, effacement des filtres/tris |
| **Projet** | Coefficient de marge (ex. 1.3), méthode de calcul : « Respecter les liens » (propagation via les prédécesseurs) ou « Homothétie du calendrier » (mise à l'échelle globale), et **calendrier** : calcul en jours ouvrés avec choix du calendrier du projet |
| **Affichage** | Zoom (tout le projet ↔ 1 jour), affichage du planning initial, des liens entre tâches, de la ligne « aujourd'hui » |
| **Format** | Chemin critique en rouge, chemin de la tâche sélectionnée (prédécesseurs/successeurs pilotants ou tous), texte affiché à droite des barres (nom, ID, durée, dates, % achevé, ressources, décalage de fin) |

## Vue tableau (gauche)

- Colonnes issues des champs MS Project (ID, UID, Nom, WBS, Durée, Début, Fin, % achevé, ressources, prédécesseurs, attributs étendus, etc.) plus colonnes calculées : début/fin/durée avec marge et décalage de fin.
- Tri et **filtres façon Excel** via le bouton ▾ de chaque en-tête (sélection de valeurs, recherche, conditions comparatives).
- Clic sur une ligne pour sélectionner la tâche ; clic sur ▶/▼ pour replier/déplier la hiérarchie.

## Vue Gantt (droite)

- Barres initiales (gris) et barres avec marge (bleu) superposées, jalons en losanges.
- **Liens de dépendance** tracés entre tâches (FF, FD, DF, DD avec lags), en violet ou rouge s'ils appartiennent au chemin sélectionné/critique.
- Ligne verticale en pointillés rouges pour la date du jour.
- Zoom continu (curseur en bas) : de la vue projet entière jusqu'à 1 jour.

## Calcul de la marge

- Chaque durée de tâche feuille est multipliée par le coefficient `k`.
- En mode « Respecter les liens », les tâches sont recalculées dans l'ordre topologique : le début de chaque tâche est le maximum de son début initial et des fins (ou débuts) de ses prédécesseurs décalés du lag.
- En mode « Homothétie », tout le calendrier est mis à l'échelle proportionnellement depuis le début du projet.
- Les tâches récapitulatives (summary) englobent leurs enfants recalculés.

## Édition du planning

Le planning n'est plus en lecture seule (toutes les modifications sont répercutées dans l'export XML) :

- **Ajouter** : insère une tâche après la tâche sélectionnée (même niveau hiérarchique, durée 8 h, début au prochain jour ouvré après la fin de la sélection).
- **Suppr.** (ou touche `Suppr`) : supprime la tâche sélectionnée et tout son sous-arbre, et retire les liens qui la ciblaient.
- **Monter / Descendre** : réordonne la tâche parmi ses frères. **Indenter / Désindenter** : change son niveau hiérarchique (elle devient enfant de la tâche précédente / remonte d'un niveau).
- **Édition en ligne** : double-clic sur une cellule surlignée — nom, durée (`3j`, `24h`, `PT8H0M`), dates de début/fin (`jj/mm/aaaa`), % achevé, et **prédécesseurs** au format MS Project (`1FD`, `2FF+1j`, séparés par des virgules ; vider la cellule supprime tous les liens). Modifier une date ou une durée recalcule l'autre, et tout le planning avec marge est recalculé (liens compris).
- **Annuler / Rétablir** (boutons ↶ ↷ ou `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Maj+Z`) : historique de 100 états.
- Les tâches récapitulatives ne sont pas éditables en durée/dates (elles englobent leurs filles), mais leur nom et leurs prédécesseurs le sont.

## Calendrier et jours ouvrés

- Les **calendriers du fichier XML** sont lus (`<Calendars>`) : semaine type (`WeekDays`, horaires `WorkingTimes`) et **exceptions** (jours fériés / jours non travaillés par plage de dates), y compris l'héritage des calendriers de base (`BaseCalendarUID`). Le calendrier de chaque tâche (`CalendarUID`) est pris en compte, sinon celui du projet.
- Case « **Jours ouvrés** » (onglet Projet, cochée automatiquement si le fichier contient des calendriers) : les durées (`PT…H…M`) et les lags sont comptés en **temps ouvré** — week-ends et jours fériés exclus, pauses intra-journalières respectées. Exemple : une tâche de 5 j commençant un jeudi se termine le jeudi suivant (et non le mardi). Les décalages affichés (colonne « Décalage fin », barre de statut, étiquettes de barres) sont en **jours ouvrés**.
- Si la case est décochée, on retombe sur l'ancien comportement : tout le temps est calendaire (les week-ends comptent).
- Dans le Gantt (et les exports HTML/PDF), les **jours non travaillés sont grisés** quand le zoom est suffisant.
- La durée d'un « jour » affichée (colonne Durée) est déduite du calendrier (8 h par défaut pour le calendrier Standard).
- Limites : les exceptions récurrentes sans plage de dates (`TimePeriod`) ne sont pas gérées ; les calendriers de ressources ne modifient pas la planification des tâches.

## Chemin critique et chemins pilotants

- Le **chemin critique** est calculé à rebours depuis la fin du projet (tâches sans marge, enchaînées par des liens pilotants) et affiché en rouge si l'option est cochée.
- Pour la tâche sélectionnée, on peut afficher ses **prédécesseurs pilotants**, **successeurs pilotants** ou le **chemin pilotant complet** (en violet).

## Exports

| Format | Description |
|---|---|
| **XML Project** | Le fichier XML d'origine avec Start/Finish/Duration modifiés selon la marge — réimportable dans MS Project |
| **CSV** | La vue tableau courante (séparateur `;`, compatible Excel) |
| **HTML** | Une image SVG fidèle de la vue courante (tableau + Gantt), autonome |
| **PDF** | Impression de cette même vue via le navigateur |

## Barre de statut

Indique la fin initiale, la fin avec marge, le décalage total en jours, le nombre de lignes affichées, le coefficient appliqué et la tâche sélectionnée.

## Contraintes

- Ne lit **pas** les fichiers binaires `.mpp` (format propriétaire) : dans MS Project, faire *Fichier › Enregistrer sous › Fichier XML*.
- Fonctionne entièrement côté client, aucune donnée n'est envoyée sur le réseau.
- Supporte le thème sombre via `prefers-color-scheme`.
