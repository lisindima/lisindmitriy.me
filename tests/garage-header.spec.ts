import { expect, test } from "@playwright/test";

const APP_STORE_URL = "https://apps.apple.com/app/apple-store/id6817084863";

test.describe("Garage header and App Store CTA regressions", () => {
  test("header navigation never splits a label across lines", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/garage/", { waitUntil: "networkidle" });

    const links = page.locator(".garage-nav .site-nav-link");
    await expect(links).toHaveCount(3);

    for (const link of await links.all()) {
      const style = await link.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          whiteSpace: computed.whiteSpace,
          overflowWrap: computed.overflowWrap,
          wordBreak: computed.wordBreak,
        };
      });

      expect(style.whiteSpace).toBe("nowrap");
      expect(style.overflowWrap).toBe("normal");
      expect(style.wordBreak).toBe("normal");
    }
  });

  test("official App Store badges are localized, loaded and linked", async ({ page }) => {
    for (const [path, locale, label] of [
      ["/garage/", "ru-ru", "Скачать Garage в App Store"],
      ["/garage/en/", "en-us", "Download Garage on the App Store"],
    ] as const) {
      for (const width of [320, 650, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path, { waitUntil: "networkidle" });
        const cta = page.locator(`a.app-store-badge[href="${APP_STORE_URL}"]`);
        await expect(cta).toHaveCount(1);
        await expect(cta).toHaveAccessibleName(label);
        const badge = cta.locator("img");
        await expect(badge).toBeVisible();
        await expect(badge).toHaveAttribute("src", `/garage/app-store/download-${locale}.svg`);
        const image = await badge.evaluate((element) => {
          const img = element as HTMLImageElement;
          const rect = img.getBoundingClientRect();
          return {
            loaded: img.complete && img.naturalWidth > 0,
            height: rect.height,
            ratio: rect.width / rect.height,
            naturalRatio: img.naturalWidth / img.naturalHeight,
            fits: rect.left >= 0 && rect.right <= window.innerWidth,
            opacity: getComputedStyle(img.parentElement!).opacity,
          };
        });
        expect(image.loaded).toBe(true);
        expect(image.height).toBeGreaterThanOrEqual(40);
        expect(image.ratio).toBeCloseTo(image.naturalRatio, 1);
        expect(image.fits).toBe(true);
        expect(image.opacity).toBe("1");
      }
    }
  });
});
