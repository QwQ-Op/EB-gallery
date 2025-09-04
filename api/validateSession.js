import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  try {
    await client.connect();
    const db = client.db("favsDB");
    const sessions = db.collection("sessions");

    // get cookie
    const cookie = req.headers.cookie || "";
    const session = cookie.split("; ").find(c => c.startsWith("session="))?.split("=")[1];

    if (!session) {
      return res.status(401).json({ success: false, message: "No session" });
    }

    const doc = await sessions.findOne({ token: session });

    if (!doc || new Date() > doc.expiresAt) {
      return res.status(401).json({ success: false, message: "Session expired" });
    }

    return res.status(200).json({ success: true, message: "Session valid" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  } finally {
    await client.close();
  }
}
