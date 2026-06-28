const crypto = require('crypto');

let storage = {};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = req.body;
    const id = crypto.randomUUID();
    storage[id] = data;

    res.status(200).json({ id });
  } catch (error) {
    console.error('Error saving response:', error);
    res.status(500).json({ error: 'Failed to save response' });
  }
};
