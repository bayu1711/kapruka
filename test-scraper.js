const imageCache = new Map();

async function fetchImageForUrl(url) {
  if (!url) return '';
  if (imageCache.has(url)) return imageCache.get(url);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }});
    const html = await res.text();
    const match = html.match(/<meta property="og:image" content="([^"]+)"/i) || html.match(/<img[^>]+id="zoom1"[^>]+src="([^"]+)"/i);
    let imageUrl = '';
    if (match) {
      imageUrl = match[1];
    }
    const parts = url.split('/kid/');
    const imgId = parts.length > 1 ? parts[1] : null;
    if (!imageUrl && imgId) {
      imageUrl = `https://www.kapruka.com/cdn-cgi/image/width=300,quality=90,format=auto/shops/specialGifts/productImages/${imgId}.jpg`;
    }
    imageCache.set(url, imageUrl);
    return imageUrl;
  } catch (e) {
    console.error('Error fetching image for URL', url, e.message);
    return '';
  }
}

async function test() {
  const url = 'https://www.kapruka.com/buyonline/java-lounge-signature-black-forest-ribbon-cake/kid/1234';
  console.log(await fetchImageForUrl(url));
}
test();
