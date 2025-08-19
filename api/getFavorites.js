import { MongoClient } from "mongodb";

let cachedClient = null;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    if (!cachedClient) {
      cachedClient = await MongoClient.connect(process.env.MONGO_URI);
    }
    const db = cachedClient.db("favsDB");
    const collection = db.collection("favorites");

    const favorites = await collection.find({}).sort({ date: -1 }).toArray();
    res.status(200).json(favorites);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load favorites" });
  }
}
