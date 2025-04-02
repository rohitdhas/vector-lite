import dotenv from "dotenv";
import express, { Request, RequestHandler, Response } from "express";
import morgan from "morgan";
import * as yup from "yup";
import { VectorDB } from "./src/vector-db";

dotenv.config();

const app = express();
const db = new VectorDB();

app.use(express.json());
app.use(morgan("dev"));

const authenticate: RequestHandler = (req, res, next) => {
  const token = req.headers.authorization?.split("Bearer ")[1];
  if (token !== process.env.AUTH_TOKEN) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

// Validation Schemas
const vectorSchema = yup
  .array()
  .of(yup.number().required())
  .length(1536)
  .required();

const metadataSchema = yup.object().default({});
const filterSchema = yup.object().default({});

const addSchema = yup.object({
  vector: vectorSchema,
  metadata: metadataSchema.optional(),
});

const searchSchema = yup.object({
  vector: vectorSchema,
  topK: yup.number().default(10),
  filter: filterSchema.optional(),
  page: yup.number().default(1),
  pageSize: yup.number().default(10),
});

app.use(authenticate);

app.post("/add", (async (req: Request, res: Response) => {
  try {
    const { vector, metadata } = await addSchema.validate(req.body);
    const id = db.add({ vector, metadata });
    res.status(201).json({ message: "Document added", id });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}) as RequestHandler);

app.post("/search", (async (req: Request, res: Response) => {
  try {
    const { vector, topK, filter, page, pageSize } =
      await searchSchema.validate(req.body);
    const results = db.search(vector, topK, filter, page, pageSize);
    res.json(results);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}) as RequestHandler);

app.get("/doc/:id", ((req: Request, res: Response) => {
  const doc = db.getById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Not found" });
  res.json(doc);
}) as RequestHandler);

app.put("/update/:id", (async (req: Request, res: Response) => {
  try {
    const success = db.update(req.params.id, req.body);
    res
      .status(success ? 200 : 404)
      .json({ message: success ? "Updated" : "Not found" });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}) as RequestHandler);

app.delete("/delete/:id", ((req: Request, res: Response) => {
  const success = db.delete(req.params.id);
  res
    .status(success ? 200 : 404)
    .json({ message: success ? "Deleted" : "Not found" });
}) as RequestHandler);

app.get("/all", ((_req: Request, res: Response) => {
  res.json(db.getAll());
}) as RequestHandler);

app.listen(3000, () => {
  console.log("🚀 VectorLite running at http://localhost:3000");
});
