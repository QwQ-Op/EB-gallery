import axios from 'axios';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.elitebabes.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { fileName, jsonData, saveToMongo } = req.body;

  if (!fileName || !jsonData) {
    return res.status(400).json({ message: 'Missing fileName or jsonData' });
  }

  const token = process.env.GITHUB_ACCESS_TOKEN; // Ensure this is in your .env file

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
    // Step 1: Create the Gist on GitHub
    const response = await axios.post('https://api.github.com/gists', gistData, {
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Step 2: Extract the raw URL from the response
    const rawUrl = response.data.files[fileName].raw_url;

    // Step 3: Store the raw URL in MongoDB
   if (saveToMongo) {
    await client.connect();
    const database = client.db('favsDB'); // Replace with your DB name
    const collection = database.collection('gists');
    await collection.insertOne({ fileName, rawUrl });
     
    console.log(`Raw URL saved to MongoDB: ${rawUrl}`);
   }
    // Step 4: Send the raw URL as the response
    return res.status(200).json({ rawUrl });
  } catch (error) {
    console.error('Error creating gist:', error);
    return res.status(500).json({ message: 'Failed to create Gist or save to MongoDB' });
  }
}
