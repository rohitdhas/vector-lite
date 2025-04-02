import express from "express";
import { VectorDB } from "./src/vector-db";

const app = express();
const db = new VectorDB();

app.use(express.json());

app.post("/add", (req, res) => {
  const { vector, metadata } = req.body;

  if (!Array.isArray(vector)) {
    return res.status(400).json({ error: "Invalid or missing 'vector'" });
  }

  try {
    const id = db.add({ vector, metadata });
    res.status(201).json({ message: "Document added", id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/search", (req, res) => {
  const { vector, topK = 5, filter } = req.body;

  if (!Array.isArray(vector)) {
    return res.status(400).json({ error: "Invalid or missing 'vector'" });
  }

  try {
    const results = db.search(vector, topK, filter);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/update/:id", (req, res) => {
  const id = req.params.id;
  const updated = req.body;

  try {
    const success = db.update(id, updated);
    if (success) {
      res.json({ message: "Document updated" });
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/delete/:id", (req, res) => {
  const id = req.params.id;

  try {
    const success = db.delete(id);
    if (success) {
      res.json({ message: "Document deleted" });
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/all", (_req, res) => {
  try {
    const docs = db.getAll();
    res.json(docs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log("✅ VectorLite server running at http://localhost:3000");
});
