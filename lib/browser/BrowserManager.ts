import puppeteer, { Browser, Page } from "puppeteer";

export class BrowserManager {
  private static instance: BrowserManager;
  private browser: Browser | null = null;

  private constructor() {}

  static getInstance(): BrowserManager {
    if (!BrowserManager.instance) {
      BrowserManager.instance = new BrowserManager();
    }
    return BrowserManager.instance;
  }

  async launchBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    // Try to find Brave browser executable path
    const possibleBravePaths = [
      "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
      "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
      process.env.LOCALAPPDATA + "\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    ];

    let executablePath: string | undefined;
    const fs = require('fs');
    
    for (const path of possibleBravePaths) {
      if (fs.existsSync(path)) {
        executablePath = path;
        break;
      }
    }

    this.browser = await puppeteer.launch({
      headless: "new",
      executablePath, // Use Brave if found, otherwise Chromium
      timeout: 60000,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--disable-web-resources",
        "--disable-features=TranslateUI,IsolateOrigins,site-per-process",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--start-maximized",
      ],
    });

    return this.browser;
  }

  async createPage(): Promise<Page> {
    const browser = await this.launchBrowser();
    const page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    
    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    return page;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async navigateToUrl(page: Page, url: string): Promise<void> {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  }

  async getPageHtml(page: Page): Promise<string> {
    return await page.content();
  }

  async extractTextWithSelector(page: Page, selector: string): Promise<string[]> {
    return await page.$$eval(selector, (elements) =>
      elements.map((el) => el.textContent?.trim() || "")
    );
  }

  async clickElement(page: Page, selector: string): Promise<void> {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.click(selector);
  }

  async fillForm(page: Page, selector: string, value: string): Promise<void> {
    await page.waitForSelector(selector, { timeout: 10000 });
    await page.type(selector, value, { delay: 50 });
  }

  async takeScreenshot(page: Page, path?: string): Promise<Buffer> {
    const screenshot = await page.screenshot({
      path,
      fullPage: true,
      type: "png",
    });
    return Buffer.from(screenshot);
  }

  async waitForElement(page: Page, selector: string, timeout = 10000): Promise<void> {
    await page.waitForSelector(selector, { timeout });
  }

  async scrollPage(page: Page, amount: string): Promise<void> {
    if (amount.toLowerCase() === "bottom") {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    } else {
      const pixels = parseInt(amount, 10);
      if (!isNaN(pixels)) {
        await page.evaluate((px) => {
          window.scrollBy(0, px);
        }, pixels);
      }
    }
  }
}

export const browserManager = BrowserManager.getInstance();
