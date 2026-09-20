export const prerender = true;

const origin = "https://lisindmitriy.ru";

const pairs = [
  { ru: "/", en: "/en/" },
  { ru: "/netliphy/", en: "/en/netliphy/" },
  { ru: "/otphub/", en: "/en/otphub/" },
  { ru: "/covid-dashboard/", en: "/en/covid-dashboard/" },
  { ru: "/garage/", en: "/garage/en/" },
  { ru: "/garage/privacy/", en: "/garage/en/privacy/" },
] as const;

const escapeXml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const urlEntry = (path: string, pair: (typeof pairs)[number]) => {
  const loc = `${origin}${path}`;
  const ru = `${origin}${pair.ru}`;
  const en = `${origin}${pair.en}`;

  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <xhtml:link rel="alternate" hreflang="ru" href="${escapeXml(ru)}" />
    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(en)}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(ru)}" />
  </url>`;
};

export function GET() {
  const entries = pairs.flatMap((pair) => [
    urlEntry(pair.ru, pair),
    urlEntry(pair.en, pair),
  ]);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
