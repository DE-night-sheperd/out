const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 3001;

let storage = {};

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

app.post('/api/save-response', (req, res) => {
  try {
    const data = req.body;
    const id = crypto.randomUUID();
    storage[id] = data;
    res.json({ id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save response' });
  }
});

app.get('/api/get-response', (req, res) => {
  try {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }
    const data = storage[id];
    if (!data) {
      return res.status(404).json({ error: 'Response not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch response' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
