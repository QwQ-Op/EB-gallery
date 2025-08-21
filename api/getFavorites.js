import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await client.connect();
    const db = client.db("favsDB");
    const collection = db.collection("favorites");
    const favorites = await collection.find({}).sort({ model: 1 }).toArray();

    return res.status(200).json(favorites);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to fetch favorites" });
  } finally {
    await client.close();
  }
}
