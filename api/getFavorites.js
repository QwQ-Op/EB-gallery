// api/getFavorites.js

import fs from 'fs';

export default async function handler(req, res) {
  try {
    const data = fs.readFileSync('./favs.json', 'utf-8');
    const favorites = JSON.parse(data);
    res.status(200).json(favorites);
  } catch (err) {
    console.error('Error reading favs.json:', err);
    res.status(500).json({ message: 'Failed to load favorites' });
  }
}
