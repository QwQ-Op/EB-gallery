import fs from 'fs';  // We use fs to store the JSON data in Vercel's temporary file system

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { model, cover, photoset } = req.body;

    // Load existing JSON data
    let favorites = [];
    try {
      favorites = JSON.parse(fs.readFileSync('./favs.json', 'utf-8'));
    } catch (err) {
      console.error("Error reading favs.json:", err);
    }

    // Add new favorite
    favorites.push({ model, cover, photoset, date: new Date().toISOString().slice(0, 10) });

    // Save the updated JSON data
    try {
      fs.writeFileSync('./favs.json', JSON.stringify(favorites, null, 2));
    } catch (err) {
      console.error("Error writing to favs.json:", err);
      return res.status(500).json({ message: 'Failed to save favorite' });
    }

    return res.status(200).json({ message: 'Favorite added successfully!' });
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}
