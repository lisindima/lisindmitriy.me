# lisindmitriy.me

Personal portfolio of Dmitriy Lisin.

## Stack

- Astro
- TypeScript-ready Astro components
- Static HTML/CSS
- Playwright regression tests
- GitHub Pages

## Included sites

- `/` and `/en/` — personal portfolio
- `/garage/` and `/garage/en/` — Garage app landing page
- `/garage/privacy/` and `/garage/en/privacy/` — Garage privacy policy
- `/netliphy/` and `/en/netliphy/` — archived Netliphy project
- `/otphub/` and `/en/otphub/` — archived OTPHub project
- `/covid-dashboard/` and `/en/covid-dashboard/` — archived COVID-19 Dashboard project

## Development

Use Node 22.19 or newer.

```bash
npm ci
npm run dev
```

Production build:

```bash
npm run build
```

Responsive and metadata regression tests:

```bash
npx playwright install chromium
npm run build
npm run test:site
```

The generated `dist` directory is deployed to GitHub Pages by the workflow in `.github/workflows/deploy-pages.yml`.
The site is fully static and has no server functions.
