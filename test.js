// Chrome voice check logic
const voices = [
  { name: 'Google  සිංහල', lang: 'si-LK' },
  { name: 'Google Sinhala', lang: 'si' }
];
const selectedVoice = voices.find(v => v.lang.startsWith('si') || v.name.toLowerCase().includes('sinhala') || v.name.includes('සිංහල'));
console.log(selectedVoice);
