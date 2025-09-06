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
    const collection = db.collection("pinboards");

    const pinboards = await collection.find().toArray();
    return res.status(200).json(pinboards);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return res.status(500).json({ message: "Failed to fetch pinboards" });
  }
}
