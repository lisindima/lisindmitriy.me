import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://lisindmitriy.ru",
  markdown: { syntaxHighlight: false },
  redirects: {
    "/projects/netliphy/": "/netliphy/",
    "/projects/otphub/": "/otphub/",
    "/projects/covid-dashboard/": "/covid-dashboard/",
    "/en/projects/netliphy/": "/en/netliphy/",
    "/en/projects/otphub/": "/en/otphub/",
    "/en/projects/covid-dashboard/": "/en/covid-dashboard/",
  },
  build: {
    inlineStylesheets: "never",
  },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      styleDirective: {
        resources: [
          { resource: "'self'", kind: "element" },
          { resource: "'unsafe-inline'", kind: "element" },
          { resource: "'unsafe-inline'", kind: "attribute" },
        ],
      },
    },
  },
});
