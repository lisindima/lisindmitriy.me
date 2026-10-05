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

  test("App Store CTA is visible and linked in both locales", async ({ page }) => {
    for (const [path, text] of [
      ["/garage/", "Скачать"],
      ["/garage/en/", "Download"],
    ] as const) {
      await page.goto(path, { waitUntil: "networkidle" });
      const cta = page.locator(`a.app-store-placeholder[href="${APP_STORE_URL}"]`);
      await expect(cta).toHaveCount(1);
      await expect(cta).toContainText(text);

      const colors = await cta.evaluate((element) => {
        const computed = getComputedStyle(element);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        };
      });

      expect(colors.color).not.toBe(colors.backgroundColor);
    }
  });
});
