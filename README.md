# Scraper Tool

Web-based generic scraper. Support static (axios+cheerio) dan dynamic/JS-render (puppeteer + headless chromium).

## Deploy ke Vercel

1. Push folder ini ke repo GitHub baru
2. Import ke Vercel, deploy langsung (Next.js auto-detect)
3. Buka domain hasil deploy nya, langsung bisa dipake

Catatan: kalau plan Vercel-nya Hobby (gratis), function timeout default 10 detik. Engine `dynamic` (puppeteer) kadang butuh lebih lama buat situs berat. Kalau sering timeout, upgrade ke Pro (timeout bisa sampe 60 detik, sudah di-set di `vercel.json`) atau pake engine `static` aja kalau situsnya gak butuh JS render.

## Cara pakai

1. Isi URL target
2. Pilih mode:
   - `list` = ambil banyak item (butuh "item selector" buat nunjuk container tiap item, misal `.product-card`)
   - `single` = ambil 1 halaman aja (detail page)
3. Pilih engine:
   - `auto` = coba static dulu, kalau kosong otomatis fallback ke dynamic
   - `static` = paling cepet, tapi gak jalanin JS
   - `dynamic` = render pake headless browser, lebih lambat tapi bisa handle React/Vue/dll
4. Tambah field: nama field bebas, selector CSS (relatif ke item kalau mode list), dan mau ambil apa (text/href/src/html/custom attribute)
5. Klik "Scrape sekarang", hasil JSON muncul, bisa copy atau download

## Contoh isian

Scrape list artikel dari blog:
- URL: `https://contoh-blog.com/artikel`
- Mode: list
- Item selector: `article.post`
- Fields:
  - `judul` → selector `.post-title` → text
  - `link` → selector `a.post-title` → href
  - `thumbnail` → selector `img` → src
  - `ringkasan` → selector `.excerpt` → text

## Batasan

- Situs yang punya proteksi anti-bot ketat (Cloudflare challenge, captcha) mungkin tetap gagal ditembus
- Selalu cek robots.txt dan ToS situs target sebelum scrape, terutama buat scraping skala besar atau konten berbayar
