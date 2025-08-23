import { MongoClient } from "mongodb";

let cachedClient = null;

export default async function handler(req, res) {
res.setHeader("Access-Control-Allow-Origin", "*");
res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
res.setHeader("Access-Control-Allow-Headers", "Content-Type");

if (req.method === "OPTIONS") {
  return res.status(200).end();
}

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { model, cover, photoset } = req.body;
if (!model || !cover || !photoset){
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    if (!cachedClient) {
      cachedClient = await MongoClient.connect(process.env.MONGO_URI);
    }
    const db = cachedClient.db("favsDB");
    const collection = db.collection("favorites");

    await collection.insertOne({
      model,
      cover,
      photoset, // 🔥 photoset link included
      date: new Date().toISOString().slice(0, 10)
    });

    res.status(200).json({ message: "Saved successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save" });
  }
}
