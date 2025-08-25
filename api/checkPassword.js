import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { password } = req.body;
  const correctPassword = process.env.SITE_PASSWORD; 

  if (password !== correctPassword) {
    return res.status(401).json({ success: false, message: "Wrong password" });
  }

  try {
    await client.connect();
    const db = client.db("favsDB"); 
    const visits = db.collection("visits");

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const week = Math.ceil((((now - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);

    let doc = await visits.findOne({ year: now.getFullYear(), week });
    if (!doc) {
      doc = { year: now.getFullYear(), week, count: 0 };
      await visits.insertOne(doc);
    }

    if (doc.count >= 2) {
      return res.status(403).json({ success: false, message: "No visits left this week" });
    }

    // increment count
    await visits.updateOne(
      { year: now.getFullYear(), week },
      { $inc: { count: 1 } }
    );

    return res.status(200).json({ success: true, message: "Access granted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    await client.close();
  }
}
