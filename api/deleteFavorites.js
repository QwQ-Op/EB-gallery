import { MongoClient, ObjectId } from "mongodb";

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(process.env.MONGO_URI);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method Not Allowed" });

  const { indexes } = req.body;
  if (!indexes || !Array.isArray(indexes))
    return res.status(400).json({ message: "Invalid indexes" });

  try {
    const client = await clientPromise;
    const db = client.db("favsDB");
    const collection = db.collection("favorites");

    // Fetch all favorites in same order as frontend
    const allFavs = await collection.find({}).sort({ model: 1 }).toArray();
    // Pick IDs to delete
    const toDeleteIds = indexes.map(i => new ObjectId(allFavs[i]._id));

    await collection.deleteMany({ _id: { $in: toDeleteIds } });

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Failed to delete" });
  }
}
