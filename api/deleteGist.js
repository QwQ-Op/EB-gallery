import axios from "axios";
import { MongoClient } from "mongodb";

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.elitebabes.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ message: "Method Not Allowed" });

  const { gistIds } = req.body;

  if (!Array.isArray(gistIds) || gistIds.length === 0) {
    return res.status(400).json({ message: "Missing or invalid gistIds 💢" });
  }

  const token = process.env.GITHUB_ACCESS_TOKEN;
  const deleted = [];
  const failed = [];

  try {
    await client.connect();
    const database = client.db("favsDB");
    const collection = database.collection("collections");

    // Loop with delay
    for (const gistId of gistIds) {
      try {
        // 1. Delete gist from GitHub
        await axios.delete(`https://api.github.com/gists/${gistId}`, {
          headers: { Authorization: `token ${token}` },
        });

        // 2. Delete from Mongo
        const result = await collection.deleteOne({ gistId });

        if (result.deletedCount === 0) {
          console.warn(`No Mongo entry found for gistId: ${gistId}`);
        } else {
          console.log(`Deleted Mongo entry for gistId: ${gistId}`);
        }

        deleted.push(gistId);
      } catch (err) {
        console.error(`Error deleting gist ${gistId}:`, err?.response?.data || err);
        failed.push(gistId);
      }

      // wait 1 second before next request
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return res.status(200).json({
      success: true,
      deleted,
      failed,
      message: `Deleted ${deleted.length} gist(s), failed ${failed.length}`,
    });
  } catch (error) {
    console.error("Error in deleteGist API:", error);
    return res.status(500).json({ success: false, message: "Server error during deletion" });
  }
}
