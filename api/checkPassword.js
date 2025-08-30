import { MongoClient } from "mongodb";
import crypto from "crypto";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { password } = req.body;
  const correctPassword = process.env.SITE_PASSWORD;

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

    // ✅ Check visit limit FIRST
    if (doc.count < 0){//(doc.count >= 2) {
      return res.status(403).json({ success: false, message: "No visits left this week" });
    }

    // Now check password
    if (password !== correctPassword) {
      return res.status(401).json({ success: false, message: "Wrong password entered!" });
    }

    // increment count
    await visits.updateOne(
      { year: now.getFullYear(), week },
      { $inc: { count: 1 } }
    );

    // 🔑 create a simple session token
    const token = crypto.randomBytes(16).toString("hex");

    // send as cookie
    res.setHeader("Set-Cookie", `session=${token}; HttpOnly; Path=/; Max-Age=7200`);

    return res.status(200).json({ success: true, message: "Access granted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    await client.close();
  }
}
