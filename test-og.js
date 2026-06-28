async function test() {
  const url = 'https://www.kapruka.com/buyonline/springtime-birthday-ribbon-cake/kid/cakes/CAKE00KA001685';
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' } });
  const html = await res.text();
  const match = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
  console.log("Status:", res.status);
  console.log("Image found:", match ? match[1] : "No");
  if (!match) console.log(html.substring(0, 500));
}
test();
