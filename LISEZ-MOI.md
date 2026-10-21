# Photos Boutique

Application web qui redimensionne et compresse les photos produit avant
mise en ligne sur une boutique. Tout le traitement se fait dans le
navigateur : aucune image n'est envoyée sur un serveur.

Mêmes réglages que le script Windows `Optimiser_images_boutique.bat`,
et mêmes résultats.

---

## 1. Mettre en ligne sur GitHub Pages

1. Créer un dépôt sur GitHub, par exemple `photos-boutique`, en **public**
   (Pages n'est gratuit que sur les dépôts publics).
2. Déposer tous les fichiers de ce dossier à la racine du dépôt
   (bouton *Add file* → *Upload files*).
3. Dans le dépôt : *Settings* → *Pages* → *Source* : **Deploy from a branch**,
   branche `main`, dossier `/ (root)*, puis *Save*.
4. Après une à deux minutes, l'adresse s'affiche en haut de la même page :
   `https://<compte>.github.io/photos-boutique/`

Cette adresse est en HTTPS, ce qui est indispensable : sans HTTPS, ni
l'installation sur l'écran d'accueil ni la réception des photos depuis le
menu Partager ne fonctionnent.

## 2. Installer sur Android

Ouvrir l'adresse dans Chrome, puis menu ⋮ → **Ajouter à l'écran d'accueil**.
L'application s'ouvre alors en plein écran, sans barre d'adresse, et
fonctionne hors connexion.

Une fois installée, elle apparaît aussi dans le menu **Partager** d'Android :
sélectionner des photos dans la galerie, Partager, *Photos Boutique*, et
elles sont traitées directement.

## 3. Obtenir un APK

Deux voies, aucune ne demande d'installer Android Studio.

**PWABuilder** (le plus simple) — aller sur `pwabuilder.com`, coller
l'adresse GitHub Pages, lancer l'analyse, puis demander le package Android.
Le service renvoie une archive contenant l'APK et le fichier
`assetlinks.json`. Ce dernier est à déposer dans un dossier
`.well-known/` à la racine du dépôt GitHub : sans lui, l'application
s'ouvre avec une barre d'adresse visible en haut.

**GitHub Actions** — pour un projet Android compilé en ligne. Plus long à
mettre en place, utile seulement pour une vraie application native.

---

## Les réglages

### Taille — plus grand côté

| Choix | Usage |
|---|---|
| 2048 px | dimension conseillée par Shopify pour une image produit |
| 1600 px | pages plus légères |
| 1024 px | vignettes, illustrations d'articles |
| Origine | aucun redimensionnement, compression seule |
| Autre | valeur libre |

Une image plus petite que la valeur choisie n'est jamais agrandie : elle
est seulement recompressée.

### Qualité — poids visé

| Profil | Qualité de départ | Cible à 2048 px | Plancher |
|---|---|---|---|
| Maximale | 90 | 800 Ko | 80 |
| Élevée | 85 | 500 Ko | 72 |
| Standard | 80 | 350 Ko | 65 |
| Légère | 75 | 200 Ko | 60 |
| Autre | au choix | au choix | départ − 20 |

L'application part de la qualité de départ, mesure le fichier obtenu, puis
redescend par paliers de 5 jusqu'à passer sous la cible. Elle s'arrête au
plancher plutôt que de continuer à dégrader ; la mention *plancher qualité
atteint* s'affiche alors.

Dans les profils, la cible est exprimée pour une image de 2048 × 2048 px
et s'ajuste au nombre de pixels réellement produits, ce qui maintient une
densité constante de 0,98 bit par pixel :

```
2048 x 2048  (4,2 Mpx)  ->   500 Ko
2048 x 1365  (2,8 Mpx)  ->   333 Ko
1024 x 1024  (1,0 Mpx)  ->   125 Ko
4032 x 3024 (12,2 Mpx)  ->  1450 Ko
```

En mode *Autre*, le poids saisi est un maximum absolu, appliqué tel quel.

### Limites Shopify signalées

L'application affiche un avertissement si une image dépasse 20 mégapixels
ou 20 Mo, les deux limites d'envoi de Shopify. Cela arrive vite avec
l'option *Origine* et un appareil photo récent.

---

## Les fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | toute l'application : interface, styles et traitement |
| `manifest.webmanifest` | nom, icônes, et déclaration du menu Partager |
| `sw.js` | fonctionnement hors ligne et réception des photos partagées |
| `icon-*.png` | icônes de l'application |

Aucune dépendance, aucun outil de compilation. Seules les polices de
caractères viennent de Google Fonts ; sans connexion, le navigateur
utilise les polices du système.

## Modifier les réglages

Les profils sont définis en haut du script, dans `index.html` :

```js
var PROFILS = {
  max:    { q0: 90, qmin: 80, kobase: 800, nom: 'Maximale' },
  haute:  { q0: 85, qmin: 72, kobase: 500, nom: 'Élevée' },
  ...
};
```

`q0` est la qualité de départ, `qmin` le plancher, `kobase` la cible en Ko
pour une image de 2048 × 2048 px.

Après modification, incrémenter `CACHE` dans `sw.js` (`photos-boutique-v2`,
puis `v3`…) pour que les appareils déjà installés reçoivent la nouvelle
version.
