import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  "/",
  "/en/",
  "/resume/",
  "/en/resume/",
  "/netliphy/",
  "/en/netliphy/",
  "/otphub/",
  "/en/otphub/",
  "/covid-dashboard/",
  "/en/covid-dashboard/",
  "/garage/",
  "/garage/en/",
  "/garage/privacy/",
  "/garage/en/privacy/",
];

const representativePages = [
  { name: "portfolio", path: "/" },
  { name: "resume", path: "/resume/" },
  { name: "garage", path: "/garage/" },
  { name: "archive", path: "/otphub/" },
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "phone", width: 390, height: 844 },
  { name: "phone-landscape", width: 844, height: 390 },
];

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
}

test.describe("metadata and routing", () => {
  for (const path of publicRoutes) {
    test(`${path} exposes complete metadata`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "networkidle" });
      expect(response?.ok()).toBeTruthy();

      await expect(page.locator("main")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /^https:\/\/lisindmitriy\.ru\//);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", /^https:\/\/lisindmitriy\.ru\//);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\/lisindmitriy\.ru\//);
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");

      await expect(page.locator('link[rel="alternate"][hreflang="ru"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveCount(1);

      const imagesWithoutAlt = await page.locator("img:not([alt])").count();
      expect(imagesWithoutAlt).toBe(0);
    });
  }

  test("robots and sitemap list the public site", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Sitemap: https://lisindmitriy.ru/sitemap.xml");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    for (const route of publicRoutes) {
      expect(xml).toContain(`https://lisindmitriy.ru${route}`);
    }
  });

  test("custom 404 is noindex", async ({ page }) => {
    const response = await page.goto("/definitely-not-a-real-page");
    expect(response?.status()).toBe(404);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, nofollow");
    await expect(page.locator("h1")).toContainText(/не найдена|not found/i);
  });
});

test.describe("responsive visual regression", () => {
  for (const route of representativePages) {
    for (const viewport of viewports) {
      test(`${route.name} · ${viewport.name}`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto(route.path, { waitUntil: "networkidle" });
        await settle(page);

        const overflow = await page.evaluate(() => {
          const root = document.documentElement;
          const viewportWidth = root.clientWidth;
          const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return {
                tag: element.tagName.toLowerCase(),
                className: element.className,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                width: Math.round(rect.width),
              };
            })
            .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewportWidth + 1))
            .slice(0, 12);

          return {
            amount: root.scrollWidth - viewportWidth,
            offenders,
          };
        });
        expect(
          overflow.amount,
          `Horizontal overflow offenders: ${JSON.stringify(overflow.offenders)}`,
        ).toBeLessThanOrEqual(1);

        await page.screenshot({
          path: `test-results/screenshots/${testInfo.project.name}-${route.name}-${viewport.name}.png`,
          fullPage: false,
        });
      });
    }
  }
});

test.describe("transition diagnostics", () => {
  test("logs Privacy and archive transition geometry", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "chromium");
    await page.emulateMedia({ reducedMotion: "no-preference" });

    const inspectTransition = async (from: string, targetHref: string) => {
      await page.goto(from, { waitUntil: "networkidle" });
      await page.evaluate(() => {
        (window as any).__transitionDebug = null;
        document.addEventListener("astro:before-swap", () => {
          const main = document.querySelector<HTMLElement>("main");
          const header = document.querySelector<HTMLElement>("[style*='view-transition-name: site-header'], .site-header-shell");
          (window as any).__transitionBefore = {
            scrollY: window.scrollY,
            main: main ? main.getBoundingClientRect().toJSON() : null,
            header: header ? header.getBoundingClientRect().toJSON() : null,
          };
        });
        document.addEventListener("astro:after-swap", () => {
          requestAnimationFrame(() => {
            const main = document.querySelector<HTMLElement>("main");
            const header = document.querySelector<HTMLElement>(".site-header-shell");
            (window as any).__transitionDebug = {
              before: (window as any).__transitionBefore,
              after: {
                scrollY: window.scrollY,
                main: main ? main.getBoundingClientRect().toJSON() : null,
                header: header ? header.getBoundingClientRect().toJSON() : null,
              },
              animations: document.getAnimations().map((animation: any) => ({
                animationName: animation.animationName ?? null,
                pseudoElement: animation.effect?.pseudoElement ?? null,
                timing: animation.effect?.getTiming?.() ?? null,
                keyframes: animation.effect?.getKeyframes?.() ?? null,
              })),
            };
          });
        });
      });
      const link = page.locator(`a[href="${targetHref}"]`).first();
      await link.scrollIntoViewIfNeeded();
      await link.click();
      await page.waitForTimeout(80);
      return await page.evaluate(() => (window as any).__transitionDebug);
    };

    const privacy = await inspectTransition("/garage/", "/garage/privacy/");
    const archive = await inspectTransition("/en/", "/en/netliphy/");
    console.log("TRANSITION_DEBUG_PRIVACY=" + JSON.stringify(privacy));
    console.log("TRANSITION_DEBUG_ARCHIVE=" + JSON.stringify(archive));
  });
});

test.describe("known layout regressions", () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 430, height: 932 },
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 844, height: 390 },
    { width: 932, height: 430 },
    { width: 956, height: 440 },
  ]) {
    test(`Garage road sticker stays in the reserved area at ${viewport.width}×${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto("/garage/", { waitUntil: "networkidle" });
      await settle(page);

      const section = page.locator("#screenshots");
      await section.scrollIntoViewIfNeeded();

      const boxes = await page.evaluate(() => {
        const steps = document.querySelector<HTMLElement>(".steps-list");
        const heading = document.querySelector<HTMLElement>("#screenshots .section-heading");
        const sticker = document.querySelector<HTMLElement>("#screenshots .sticker-screens");
        if (!steps || !heading || !sticker) {
          throw new Error("Steps list, Screens heading or road sticker missing");
        }

        const stepsRect = steps.getBoundingClientRect();
        const headingRect = heading.getBoundingClientRect();
        const stickerRect = sticker.getBoundingClientRect();

        return {
          stepsBottom: stepsRect.bottom,
          headingTop: headingRect.top,
          stickerTop: stickerRect.top,
          stickerBottom: stickerRect.bottom,
        };
      });

      expect(boxes.stickerTop).toBeGreaterThanOrEqual(boxes.stepsBottom + 12);
      expect(boxes.stickerBottom).toBeLessThanOrEqual(boxes.headingTop - 12);

      await page.screenshot({
        path: `test-results/screenshots/${testInfo.project.name}-garage-road-sticker-${viewport.width}x${viewport.height}.png`,
        fullPage: false,
      });
    });
  }

  for (const width of [1024, 390]) {
    test(`Garage mileage pill does not overlap copy at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
      await page.goto("/garage/", { waitUntil: "networkidle" });
      const card = page.locator(".feature-card-accent");
      await card.scrollIntoViewIfNeeded();
      await settle(page);

      const copy = await card.locator("p").boundingBox();
      const pill = await card.locator(".mileage-pill").boundingBox();
      expect(copy).not.toBeNull();
      expect(pill).not.toBeNull();
      expect((copy?.y ?? 0) + (copy?.height ?? 0)).toBeLessThanOrEqual((pill?.y ?? 0) - 8);

      await card.screenshot({
        path: `test-results/screenshots/${testInfo.project.name}-garage-mileage-${width}.png`,
      });
    });
  }

  for (const width of [1440, 390]) {
    test(`archive closing card keeps its card treatment at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await page.goto("/otphub/", { waitUntil: "networkidle" });
      const card = page.locator(".archive-closing-card");
      await card.scrollIntoViewIfNeeded();
      await settle(page);

      const radius = await card.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).borderTopLeftRadius),
      );
      expect(radius).toBeGreaterThan(0);

      await card.screenshot({
        path: `test-results/screenshots/${testInfo.project.name}-archive-closing-${width}.png`,
      });
    });
  }

  for (const width of [320, 360, 390, 430, 480, 540]) {
    test(`portfolio display text stays inside narrow viewport at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/", { waitUntil: "networkidle" });
      await settle(page);

      const heroTitle = page.locator(".hero h1");
      const contactTitle = page.locator(".contact-panel h2");
      await contactTitle.scrollIntoViewIfNeeded();

      for (const locator of [heroTitle, contactTitle]) {
        const fits = await locator.evaluate((element) => {
          const htmlElement = element as HTMLElement;
          return htmlElement.scrollWidth <= htmlElement.clientWidth + 1;
        });
        expect(fits).toBeTruthy();
      }

      await page.screenshot({
        path: `test-results/screenshots/${testInfo.project.name}-portfolio-narrow-${width}.png`,
        fullPage: false,
      });
    });
  }

  test("portfolio hero stays iOS-first and links to the web resume", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    await expect(page.locator(".hero-eyebrow")).toContainText("iOS-разработчик");
    await expect(page.locator(".hero-rotator > span")).toHaveCount(4);
    await expect(page.locator(".hero-rotator > span").nth(0)).toHaveText("SwiftUI");
    await expect(page.locator(".hero-rotator > span").nth(1)).toHaveText("Swift Concurrency");
    await expect(page.locator(".hero-rotator > span").nth(2)).toHaveText("iOS Architecture");
    await expect(page.locator(".hero-rotator > span").nth(3)).toHaveText("Core ML");
    await expect(page.locator('.hero-actions a[href="/resume/"]')).toHaveCount(1);
  });

  test("Garage privacy uses only the header back button", async ({ page }) => {
    for (const [path, href] of [
      ["/garage/privacy/", "/garage/"],
      ["/garage/en/privacy/", "/garage/en/"],
    ] as const) {
      await page.goto(path, { waitUntil: "networkidle" });

      await expect(page.locator(".privacy-header .site-back-button")).toHaveAttribute("href", href);
      await expect(page.locator("main .back-link")).toHaveCount(0);
    }
  });

  test("public resume uses the public contact channel", async ({ page }) => {
    await page.goto("/resume/", { waitUntil: "networkidle" });

    await expect(page.locator("h1")).toHaveText("Дмитрий Лисин");
    await expect(page.locator(".experience-item")).toHaveCount(2);
    await expect(page.locator('a[href="mailto:me@lisindmitriy.ru"]')).not.toHaveCount(0);
    await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  });

  test("portfolio and resume use the footer micro changelog", async ({ page }) => {
    for (const path of ["/", "/resume/"]) {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator(".activity-section")).toHaveCount(0);
      await expect(page.locator(".site-footer-changelog")).toContainText("21");
      await expect(
        page.locator('.site-footer-source[href="https://github.com/lisindima/lisindmitriy.me"]'),
      ).toHaveCount(1);
    }
  });

  test("resume sections keep one aligned grid without sticky overlap", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/resume/", { waitUntil: "networkidle" });
    await settle(page);

    const layout = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll<HTMLElement>(".resume-section"));
      const bodyRects = sections.map((section) => {
        const body = section.children.item(1) as HTMLElement | null;
        if (!body) throw new Error("Resume section body missing");
        const rect = body.getBoundingClientRect();
        return { left: rect.left, right: rect.right, width: rect.width };
      });

      const headingPositions = sections.map((section) => {
        const heading = section.querySelector<HTMLElement>(".resume-section-heading");
        if (!heading) throw new Error("Resume section heading missing");
        return getComputedStyle(heading).position;
      });

      const experienceMeta = document.querySelector<HTMLElement>(".experience-item > :first-child");
      const educationMeta = document.querySelector<HTMLElement>(".resume-education > article > :first-child");
      if (!experienceMeta || !educationMeta) throw new Error("Resume meta columns missing");

      return {
        bodyRects,
        headingPositions,
        experienceMetaWidth: experienceMeta.getBoundingClientRect().width,
        educationMetaWidth: educationMeta.getBoundingClientRect().width,
      };
    });

    expect(layout.headingPositions.every((position) => position !== "sticky")).toBeTruthy();

    const reference = layout.bodyRects[0];
    for (const rect of layout.bodyRects.slice(1)) {
      expect(Math.abs(rect.left - reference.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(rect.right - reference.right)).toBeLessThanOrEqual(1);
      expect(Math.abs(rect.width - reference.width)).toBeLessThanOrEqual(1);
    }

    expect(Math.abs(layout.experienceMetaWidth - layout.educationMetaWidth)).toBeLessThanOrEqual(1);
  });

  test("Geely Diagnostics is the first standard project after Garage", async ({ page }) => {
    await page.goto("/en/", { waitUntil: "networkidle" });
    const titles = await page.locator(".project-card .project-title-row h3").allTextContents();

    expect(titles.slice(0, 2)).toEqual(["Garage", "Geely Diagnostics"]);
    await expect(
      page.locator('.project-card').nth(1).locator('a[href="https://github.com/lisindima/GeelyDiagnostics"]'),
    ).toHaveCount(1);
  });

  test("featured Garage artwork is not cropped on desktop", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/en/", { waitUntil: "networkidle" });
    await settle(page);

    const media = page.locator(".project-card.featured .project-media");
    const image = media.locator("img");
    await media.scrollIntoViewIfNeeded();

    const ratios = await media.evaluate((mediaElement) => {
      const imageElement = mediaElement.querySelector("img");
      if (!imageElement) throw new Error("Featured project image missing");

      const rect = mediaElement.getBoundingClientRect();
      return {
        mediaRatio: rect.width / rect.height,
        naturalRatio: imageElement.naturalWidth / imageElement.naturalHeight,
      };
    });

    expect(Math.abs(ratios.mediaRatio - ratios.naturalRatio)).toBeLessThanOrEqual(0.01);

    await media.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}-garage-featured-desktop.png`,
    });
  });

  test("project images keep centered cover crops on mobile", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/en/", { waitUntil: "networkidle" });
    await settle(page);

    const cards = page.locator(".project-card");
    await expect(cards).toHaveCount(5);

    for (let index = 0; index < 5; index += 1) {
      const card = cards.nth(index);
      const media = card.locator(".project-media");
      const image = media.locator("img");

      await media.scrollIntoViewIfNeeded();

      const geometry = await media.evaluate((mediaElement) => {
        const imageElement = mediaElement.querySelector("img");
        if (!imageElement) throw new Error("Project image missing");

        const mediaRect = mediaElement.getBoundingClientRect();
        const imageRect = imageElement.getBoundingClientRect();
        const style = getComputedStyle(imageElement);

        return {
          media: {
            left: mediaRect.left,
            top: mediaRect.top,
            width: mediaRect.width,
            height: mediaRect.height,
          },
          image: {
            left: imageRect.left,
            top: imageRect.top,
            width: imageRect.width,
            height: imageRect.height,
          },
          naturalWidth: imageElement.naturalWidth,
          naturalHeight: imageElement.naturalHeight,
          objectFit: style.objectFit,
          objectPosition: style.objectPosition,
          position: style.position,
        };
      });

      expect(Math.abs(geometry.image.left - geometry.media.left)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.image.top - geometry.media.top)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.image.width - geometry.media.width)).toBeLessThanOrEqual(1);
      expect(Math.abs(geometry.image.height - geometry.media.height)).toBeLessThanOrEqual(1);
      expect(geometry.objectFit).toBe(index === 1 ? "contain" : "cover");
      expect(["50% 50%", "center"]).toContain(geometry.objectPosition);
      expect(geometry.position).toBe("absolute");

      if (index === 0) {
        expect(geometry.naturalWidth).toBeGreaterThan(0);
        expect(geometry.naturalHeight).toBeGreaterThan(0);

        const mediaRatio = geometry.media.width / geometry.media.height;
        const naturalRatio = geometry.naturalWidth / geometry.naturalHeight;
        expect(Math.abs(mediaRatio - naturalRatio)).toBeLessThanOrEqual(0.01);
      }
    }

    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}-project-crops-mobile.png`,
      fullPage: true,
    });
  });

  test("mobile header and hidden skip link stay stable during tiny scrolls", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await settle(page);

    const header = page.locator(".floating-header");
    const skipLink = page.locator(".skip-link");

    const initialHeaderTop = await header.evaluate(
      (element) => element.getBoundingClientRect().top,
    );

    expect(initialHeaderTop).toBeGreaterThanOrEqual(0);

    for (const y of [0, 1, 2, 8, 32, 96, 0]) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
      await page.evaluate(
        () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
      );

      const state = await page.evaluate(() => {
        const headerElement = document.querySelector<HTMLElement>(".floating-header");
        const skipElement = document.querySelector<HTMLElement>(".skip-link");
        if (!headerElement || !skipElement) throw new Error("Header or skip link missing");

        const headerRect = headerElement.getBoundingClientRect();
        const skipRect = skipElement.getBoundingClientRect();
        const skipStyle = getComputedStyle(skipElement);

        return {
          headerTop: headerRect.top,
          skipWidth: skipRect.width,
          skipHeight: skipRect.height,
          skipClipPath: skipStyle.clipPath,
          skipOverflow: skipStyle.overflow,
          active: document.activeElement === skipElement,
        };
      });

      expect(Math.abs(state.headerTop - initialHeaderTop)).toBeLessThanOrEqual(1);
      expect(state.skipWidth).toBeLessThanOrEqual(1);
      expect(state.skipHeight).toBeLessThanOrEqual(1);
      expect(state.skipClipPath).not.toBe("none");
      expect(state.skipOverflow).toBe("hidden");
      expect(state.active).toBeFalsy();
    }

    await page.screenshot({
      path: `test-results/screenshots/${testInfo.project.name}-tiny-scroll.png`,
      fullPage: false,
    });
  });

  test("320px portfolio header keeps controls inside the pill", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/", { waitUntil: "networkidle" });
    const header = page.locator(".site-header-shell");

    const fits = await header.evaluate((element) => {
      const outer = element.getBoundingClientRect();
      return Array.from(element.querySelectorAll("a")).every((link) => {
        const rect = link.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return true;
        return rect.left >= outer.left - 1 && rect.right <= outer.right + 1;
      });
    });

    expect(fits).toBeTruthy();
  });

  test("skip link is the first keyboard target and becomes visible", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const skip = page.locator(".skip-link");
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
  });

  test("dark mode renders the dark palette", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.goto("/");
    const background = await page.locator("body").evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    expect(background).toBe("rgb(9, 9, 11)");
  });
});
