const express = require('express');
const cors = require('cors');
const { processChat } = require('./agent');

const app = express();
app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Kapruka Backend Agent is running' });
});

app.post('/chat', async (req, res) => {
  const { message, history, enablePostFilter, language, visibleProducts, cartItems } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    console.log(`[Server] Received message: "${message}"`);
    const result = await processChat(message, history || [], enablePostFilter, language || 'en-US', visibleProducts || [], cartItems || []);
    res.json(result);
  } catch (error) {
    console.error('[Server] Error processing chat:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🤖 AI Shopping Agent Backend running on http://localhost:${PORT}`);
});
