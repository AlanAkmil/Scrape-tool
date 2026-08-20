import axios from "axios";
import * as cheerio from "cheerio";

export const runtime = "nodejs";
export const maxDuration = 60;

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

function extractStatic($, root, fields) {
  const obj = {};
  fields.forEach((f) => {
    const el = f.selector ? $(root).find(f.selector).first() : $(root);
    if (!el || el.length === 0) {
      obj[f.name] = null;
      return;
    }
    if (f.attr === "text") obj[f.name] = el.text().trim();
    else if (f.attr === "html") obj[f.name] = $.html(el);
    else obj[f.name] = el.attr(f.attr) || null;
  });
  return obj;
}

async function scrapeStatic({ url, mode, itemSelector, fields }) {
  const { data: html } = await axios.get(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9,id;q=0.8" },
    timeout: 20000,
  });
  const $ = cheerio.load(html);

  if (mode === "single") {
    return [extractStatic($, "body", fields)];
  }

  const items = itemSelector ? $(itemSelector).toArray() : [];
  return items.map((item) => extractStatic($, item, fields));
}

async function scrapeDynamic({ url, mode, itemSelector, fields, waitSelector }) {
  const chromium = (await import("@sparticuz/chromium")).default;
  const puppeteer = await import("puppeteer-core");

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    if (waitSelector) {
      await page.waitForSelector(waitSelector, { timeout: 15000 }).catch(() => {});
    }

    const results = await page.evaluate(
      (mode, itemSelector, fields) => {
        function extract(root, fields) {
          const obj = {};
          fields.forEach((f) => {
            const el = f.selector ? root.querySelector(f.selector) : root;
            if (!el) {
              obj[f.name] = null;
              return;
            }
            if (f.attr === "text") obj[f.name] = el.textContent.trim();
            else if (f.attr === "html") obj[f.name] = el.outerHTML;
            else obj[f.name] = el.getAttribute(f.attr) || null;
          });
          return obj;
        }

        if (mode === "single") {
          return [extract(document.body, fields)];
        }
        const items = itemSelector ? Array.from(document.querySelectorAll(itemSelector)) : [];
        return items.map((item) => extract(item, fields));
      },
      mode,
      itemSelector,
      fields
    );

    return results;
  } finally {
    await browser.close();
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      url,
      mode = "list",
      engine = "auto",
      itemSelector = "",
      fields = [],
      waitSelector = "",
    } = body;

    if (!url) {
      return Response.json({ error: "URL wajib diisi" }, { status: 400 });
    }
    if (!fields || fields.length === 0) {
      return Response.json({ error: "Minimal 1 field harus diisi" }, { status: 400 });
    }
    if (mode === "list" && !itemSelector) {
      return Response.json({ error: "Mode list butuh item selector" }, { status: 400 });
    }

    const params = { url, mode, itemSelector, fields, waitSelector };
    let usedEngine = engine;
    let results = [];

    if (engine === "static") {
      results = await scrapeStatic(params);
    } else if (engine === "dynamic") {
      results = await scrapeDynamic(params);
      usedEngine = "dynamic";
    } else {
      try {
        results = await scrapeStatic(params);
        usedEngine = "static";
        const hasData = results.some((r) => Object.values(r).some((v) => v));
        if (!hasData) {
          results = await scrapeDynamic(params);
          usedEngine = "dynamic (fallback)";
        }
      } catch (e) {
        results = await scrapeDynamic(params);
        usedEngine = "dynamic (fallback after error)";
      }
    }

    return Response.json({ engine: usedEngine, count: results.length, results });
  } catch (err) {
    return Response.json({ error: err.message || "Scrape gagal" }, { status: 500 });
  }
}
