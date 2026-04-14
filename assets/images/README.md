# 📁 assets/images/ — Images du portfolio

## Fichiers à déposer ici

| Fichier             | Usage                                | Dimensions recommandées |
|---------------------|--------------------------------------|------------------------|
| `profile.jpg`       | Photo de profil (section À propos)   | 400×400 px minimum     |
| `projet-1.jpg`      | Image du projet 1                    | 800×450 px (16:9)      |
| `projet-2.jpg`      | Image du projet 2                    | 800×450 px             |
| `projet-3.jpg`      | Image du projet 3                    | 800×450 px             |
| `projet-4.jpg`      | Image du projet 4                    | 800×450 px             |

## Comment les utiliser dans le HTML

**Photo de profil** (fr/index.html) :
```html
<img src="../assets/images/profile.jpg" style="width:100%;border-radius:8px;border:1px solid var(--border);" alt="Photo de profil">
```

**Image projet** (fr/projets.html, dans la carte projet) :
```html
<img class="pj-img" src="../assets/images/projet-1.jpg" alt="Projet 1">
```
(Remplace le bloc `<div class="pj-img-ph">...</div>` par cette balise)

**Image détail projet** (fr/projet-detail.html) :
```html
<img class="pj-det-img" src="../assets/images/projet-1.jpg" alt="Projet 1">
```
(Remplace le bloc `<div class="pj-det-img-ph">...</div>` par cette balise)

## Formats acceptés
PNG, JPG, JPEG, WEBP, SVG

## Optimisation
Compresse tes images sur https://squoosh.app/ pour de meilleures performances.
