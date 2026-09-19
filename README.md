# lisindmitriy.me

Personal portfolio of Dmitriy Lisin.

## Stack

- Astro
- TypeScript-ready Astro components
- Static HTML/CSS
- GitHub Pages

## Included sites

- `/` — personal portfolio
- `/garage/` — Garage app landing page
- `/garage/en/` — English Garage landing page
- `/garage/privacy/` — Garage privacy policy
- `/garage/en/privacy/` — English Garage privacy policy

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

The generated `dist` directory is deployed to GitHub Pages by the workflow in `.github/workflows/deploy-pages.yml`.
The site is fully static and has no server functions.
