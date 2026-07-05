const express = require('express');
const cors = require('cors');
const { processChat } = require('./agent');

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Kapruka Backend Agent is running' });
});

app.get('/tts', async (req, res) => {
  const { text, lang } = req.query;
  if (!text || !lang) return res.status(400).json({ error: 'Missing text or lang' });
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&ttsspeed=0.3&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });
    if (!response.ok) throw new Error(`Google TTS failed: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('TTS Error:', err);
    res.status(500).json({ error: 'TTS failed' });
  }
});

app.post('/chat', async (req, res) => {
  const { message, history, enablePostFilter, language, visibleProducts, cartItems, selectedProduct } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    console.log(`[Server] Received message: "${message}"`);
    const result = await processChat(message, history || [], enablePostFilter, language || 'en-US', visibleProducts || [], cartItems || [], selectedProduct || null);
    res.json(result);
  } catch (error) {
    console.error('[Server] Error processing chat:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`🤖 AI Shopping Agent Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
