function detectLang(text) {
  if (/[\u0D80-\u0DFF]/.test(text)) return 'si';
  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta';
  return null;
}
console.log("Sinhala:", detectLang("මෙය සිංහල"));
console.log("Tamil:", detectLang("இது தமிழ்"));
console.log("English:", detectLang("This is English"));
