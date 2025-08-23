// api/fetchJson.js

export default async function handler(req, res) {
  const { set } = req.query;  // 'json1' or 'json2'

  let url = '';
  if (set === 'json1') {
    url = process.env.JSON1; 
  } else if (set === 'json2') {
    url = process.env.JSON2; 
  } else {
    return res.status(400).json({ error: 'Invalid set' });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(500).json({ error: 'Failed to fetch JSON' });
    }
    
    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server Error' });
  }
}
