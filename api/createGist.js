import axios from 'axios';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.elitebabes.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileName, jsonData, saveToMongo } = req.body;

  if (!fileName || !jsonData) {
    return res.status(400).json({ message: 'Missing fileName or jsonData or both 💢' });
  }

  const token = process.env.GITHUB_ACCESS_TOKEN;

  const gistData = {
    description: 'A new JSON Gist created via API for personal use!~',
    public: true,
    files: {
      [fileName]: {
        content: JSON.stringify(jsonData, null, 2),
      },
    },
  };

  try {
    // Step 1: Create the Gist
    const response = await axios.post('https://api.github.com/gists', gistData, {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Step 2: Extract raw URL
    const rawUrl = response.data.files[fileName].raw_url;

    // Step 3: Store in MongoDB
    if (saveToMongo) {
      await client.connect();
      const database = client.db('favsDB'); // your DB
      const collection = database.collection('collections');

      const { title, title_img, description, collection_url } = jsonData;

      await collection.insertOne({
        fileName,
        rawUrl,
        title,
        title_img,
        description,
        collection_url,
        createdAt: new Date()
      });

      console.log(`Saved to Mongo: ${title}`);
    }

    // Step 4: Return raw URL
    return res.status(200).json({ rawUrl });
  } catch (error) {
    console.error('Error creating gist:', error?.response?.data || error);
    return res.status(500).json({ message: 'Failed to create Gist or save to MongoDB' });
  }
}
