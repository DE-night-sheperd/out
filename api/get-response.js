let storage = {};

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }

    const data = storage[id];
    
    if (!data) {
      return res.status(404).json({ error: 'Response not found' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ error: 'Failed to fetch response' });
  }
};
