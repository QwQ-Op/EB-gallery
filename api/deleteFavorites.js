import { MongoClient, ObjectId } from "mongodb";

const client = new MongoClient(process.env.MONGO_URI);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { indexes } = req.body;
  if (!indexes || !Array.isArray(indexes)) return res.status(400).json({ message: "Invalid indexes" });

  try {
    await client.connect();
    const db = client.db("favsDB");
    const collection = db.collection("favorites");

    const allFavs = await collection.find({}).sort({ date: -1 }).toArray();
    const toDeleteIds = indexes.map(i => allFavs[i]._id);

    await collection.deleteMany({ _id: { $in: toDeleteIds } });

    res.status(200).json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete" });
  } finally {
    await client.close();
  }
}
