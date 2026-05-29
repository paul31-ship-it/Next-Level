# Next Level — Landing Page

Site vitrine de **Next Level**, le SaaS basket RPG pour coachs bénévoles.

## Stack

- HTML5 / CSS3 / Vanilla JS (zéro dépendance)
- Canvas 2D pour l'animation basketball au scroll
- Hébergé sur **Vercel** → [nextlevel.paulfourny.com](https://nextlevel.paulfourny.com)

## Pages

| Page | Description |
|------|-------------|
| `index.html` | Homepage — hero + phone mockup carousel + sections marketing |
| `a-propos.html` | Histoire, personas, valeurs, équipe |
| `contact.html` | Formulaire de contact + FAQ |

## Assets

Les screenshots de l'app sont dans `assets/` (`Nextlevel ecran 1.png` → `13.png`).

## Développement local

```bash
npx serve -l 3456 .
# → http://localhost:3456
```

## Déploiement

Tout push sur `master` déclenche un déploiement Vercel automatique.
