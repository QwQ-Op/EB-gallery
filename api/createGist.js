import axios from 'axios';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://www.elitebabes.com');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { fileName, jsonData, saveToMongo, whatGist } = req.body;

  if (!fileName || !jsonData) {
    return res.status(400).json({ message: 'Missing fileName or jsonData 💢' });
  }

  const token = process.env.GITHUB_ACCESS_TOKEN;

  try {
    let rawUrl, gistId;

    if (whatGist) {
      // --- Append mode ---
      // 1. Fetch existing gist
      const existing = await axios.get(`https://api.github.com/gists/${whatGist}`, {
        headers: { Authorization: `token ${token}` },
      });

      gistId = existing.data.id;

      // 2. Merge old + new JSON (append into array)
      const oldFiles = existing.data.files;
      const firstFile = Object.values(oldFiles)[0]; // take first file
      let oldContent;

      try {
        oldContent = JSON.parse(firstFile.content);
      } catch {
        oldContent = { content: [] };
      }

      if (!Array.isArray(oldContent.content)) {
        oldContent.content = [];
      }

      // push new jsonData.content items
      if (Array.isArray(jsonData.content)) {
        oldContent.content.push(...jsonData.content);
      }

      // keep metadata up-to-date (optional, you can tweak)
      oldContent.title = jsonData.title || oldContent.title;
      oldContent.title_img = jsonData.title_img || oldContent.title_img;
      oldContent.description = jsonData.description || oldContent.description;
      oldContent.collection_url = jsonData.collection_url || oldContent.collection_url;

      // 3. Update gist
      const patchRes = await axios.patch(
        `https://api.github.com/gists/${gistId}`,
        {
          files: {
            [fileName]: {
              content: JSON.stringify(oldContent, null, 2),
            },
          },
        },
        { headers: { Authorization: `token ${token}` } }
      );

      rawUrl = patchRes.data.files[fileName].raw_url;
    } else {
      // --- Create new gist ---
      const gistData = {
        description: 'A new JSON Gist created via API for personal use!~',
        public: true,
        files: {
          [fileName]: {
            content: JSON.stringify(jsonData, null, 2),
          },
        },
      };

      const response = await axios.post('https://api.github.com/gists', gistData, {
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      rawUrl = response.data.files[fileName].raw_url;
      gistId = response.data.id;
    }

    // --- Save to Mongo ---
  await client.connect();
  const database = client.db('favsDB');
  const collection = database.collection('collections');

  const { title, title_img, description, collection_url } = jsonData;

  if (whatGist) {
    // Update existing Mongo record
    await collection.updateOne(
      { gistId: whatGist }, // match by gistId
      {
        $set: {
          rawUrl,
          fileName,
          title,
          title_img,
          description,
          collection_url,
          date: new Date().toISOString().slice(0, 10),
        },
      }
    );
    console.log(`Updated Mongo for gist ${whatGist}`);
  } else {
    // Insert new Mongo record
    await collection.insertOne({
      fileName,
      rawUrl,
      gistId,
      title,
      title_img,
      description,
      collection_url,
      date: new Date().toISOString().slice(0, 10),
    });
    console.log(`Inserted new Mongo record: ${title}`);
  }


    return res.status(200).json({ rawUrl, gistId });
  } catch (error) {
    console.error('Error creating/updating gist:', error?.response?.data || error);
    return res.status(500).json({ message: 'Failed to create/update gist or save to MongoDB' });
  }
}
