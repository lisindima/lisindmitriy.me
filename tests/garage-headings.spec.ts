import { expect, test } from "@playwright/test";

for (const path of ["/garage/", "/garage/en/"]) {
  for (const width of [320, 360, 390, 430, 540, 650, 680, 700, 760, 761, 800, 900, 901, 1024, 1280, 1440]) {
    test(`Garage hero wraps whole words at ${width}px (${path})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const title = page.locator(".garage-hero-title");
      const layout = await title.evaluate((element) => {
        const heading = element as HTMLElement;
        const style = getComputedStyle(heading);
        const bounds = heading.getBoundingClientRect();
        const wordRects: DOMRect[] = [];
        let wordsStayWhole = true;
        const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
        let node: Node | null;
        while ((node = walker.nextNode())) {
          for (const match of (node.textContent ?? "").matchAll(/\S+/gu)) {
            const range = document.createRange();
            range.setStart(node, match.index!);
            range.setEnd(node, match.index! + match[0].length);
            const rects = Array.from(range.getClientRects());
            wordsStayWhole &&= new Set(rects.map((rect) => Math.round(rect.top))).size <= 1;
            wordRects.push(...rects);
          }
        }
        return {
          wordsStayWhole,
          overflowWrap: style.overflowWrap,
          wordBreak: style.wordBreak,
          hyphens: style.hyphens,
          overflow: heading.scrollWidth - heading.clientWidth,
          wordsFit: wordRects.every((rect) => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1),
          documentOverflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      expect(layout.overflowWrap).toBe("normal");
      expect(layout.wordBreak).toBe("normal");
      expect(layout.hyphens).toBe("none");
      expect(layout.overflow).toBeLessThanOrEqual(1);
      expect(layout.wordsFit).toBe(true);
      expect(layout.wordsStayWhole).toBe(true);
      expect(layout.documentOverflow).toBeLessThanOrEqual(1);

      for (const heading of await page.locator("main :is(h1, h2, h3, h4, h5, h6)").all()) {
        const wrapping = await heading.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.overflowWrap, style.wordBreak, style.hyphens];
        });
        expect(wrapping).toEqual(["normal", "normal", "none"]);
      }
    });
  }
}

test("Garage body text and URLs retain overflow protection", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/garage/", { waitUntil: "networkidle" });
  const protection = await page.locator(".garage-lead").evaluate((element) => {
    element.textContent = "a".repeat(200);
    const link = document.createElement("a");
    link.href = "https://example.com/";
    link.textContent = "https://example.com/" + "b".repeat(200);
    element.append(link);
    return {
      bodyWrap: getComputedStyle(element).overflowWrap,
      linkWrap: getComputedStyle(link).overflowWrap,
      overflow: (element as HTMLElement).scrollWidth - (element as HTMLElement).clientWidth,
    };
  });
  expect(protection.bodyWrap).toBe("break-word");
  expect(protection.linkWrap).toBe("break-word");
  expect(protection.overflow).toBeLessThanOrEqual(1);
});

for (const path of ["/garage/privacy/", "/garage/en/privacy/", "/garage/terms/", "/garage/en/terms/"]) {
  for (const width of [320, 390, 650]) {
    test(`Garage legal heading keeps whole words inside its column at ${width}px (${path})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path, { waitUntil: "networkidle" });
      // Exercise both native Apple fonts and the Arial fallback used on Linux CI.
      for (const font of [null, "Arial, sans-serif"]) {
        if (font) await page.addStyleTag({ content: `:root { --font-ui: ${font}; }` });
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.locator(".privacy-shell h1").evaluate((element) => {
          const heading = element as HTMLElement;
          const style = getComputedStyle(heading);
          return {
            wrapping: [style.overflowWrap, style.wordBreak, style.hyphens],
            titleOverflow: heading.scrollWidth - heading.clientWidth,
            bodyOverflow: document.body.scrollWidth - window.innerWidth,
          };
        });
        expect(layout.wrapping).toEqual(["normal", "normal", "none"]);
        expect(layout.titleOverflow).toBeLessThanOrEqual(1);
        expect(layout.bodyOverflow).toBeLessThanOrEqual(1);
      }
    });
  }
}
