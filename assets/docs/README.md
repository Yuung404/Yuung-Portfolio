# 📁 assets/docs/ — Documents & Certifications

## Arborescence recommandée

```
assets/docs/
├── certifications/
│   ├── certification-cisco.pdf
│   ├── certification-microsoft.pdf
│   └── diplome-bac.pdf
│
├── projet-1/
│   ├── rapport.pdf
│   ├── presentation.pdf
│   └── documentation.pdf
│
├── projet-2/
│   ├── rapport.pdf
│   └── presentation.pdf
│
├── projet-3/
│   └── rapport.pdf
│
├── projet-4/
│   └── rapport.pdf
│
└── veille/
    ├── article-cybersecurite.pdf
    └── article-cloud.pdf
```

## Comment lier un document dans le HTML

Dans `fr/certifications.html` ou `fr/projet-detail.html` :

```html
<button onclick="openPDF('../assets/docs/certifications/mon-fichier.pdf', 'Titre affiché')" class="cert-btn view" style="cursor:none;">
  VOIR 📄
</button>
```

## Format accepté
- **PDF uniquement** pour l'affichage dans le viewer intégré
- Les images (PNG, JPG) peuvent être affichées directement avec une balise `<img>`
- Autres formats : ils s'ouvriront dans un nouvel onglet

## Poids recommandé
- Moins de 10 MB par document pour un chargement rapide
- Compresse tes PDF avec ilovepdf.com ou smallpdf.com si nécessaire
