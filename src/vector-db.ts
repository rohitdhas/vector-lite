import { HierarchicalNSW } from "hnswlib-node";
import { BinaryStorage } from "./binary-storage";
import { matchesFilter } from "./utils/filter";

type Vector = number[];

export interface Document {
  id: string;
  vector: Vector;
  metadata?: Record<string, any>;
}

function cosineSimilarity(a: Vector, b: Vector): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return normA && normB ? dot / (normA * normB) : 0;
}

export class VectorDB {
  private documents: Map<string, Document> = new Map();
  private index: HierarchicalNSW;
  private vectorDim = 1536;
  private storage = new BinaryStorage();
  private currentIndex = 0;
  private idToIndex: Map<string, number> = new Map();
  private indexToId: Map<number, string> = new Map();

  constructor() {
    this.index = new HierarchicalNSW("cosine", this.vectorDim);
    this.index.initIndex(10000); // max number of vectors
    this.loadFromDisk();
  }

  add(doc: Document) {
    if (
      !doc.id ||
      !Array.isArray(doc.vector) ||
      doc.vector.length !== this.vectorDim
    ) {
      throw new Error("Invalid document");
    }

    if (this.documents.has(doc.id)) {
      throw new Error(
        `Document with id '${doc.id}' already exists. Use update() instead.`
      );
    }

    const internalIndex = this.currentIndex++;
    this.documents.set(doc.id, doc);
    this.index.addPoint(doc.vector, internalIndex);
    this.idToIndex.set(doc.id, internalIndex);
    this.indexToId.set(internalIndex, doc.id);
    this.saveToDisk();
  }

  search(query: Vector, topK = 5, filter?: Record<string, any>) {
    const knn = this.index.searchKnn(query, topK * 3); // overfetch in case filtering reduces results
    const results = [];

    for (let i = 0; i < knn.neighbors.length; i++) {
      const internalId = knn.neighbors[i];
      const id = this.indexToId.get(internalId);
      if (!id) continue;

      const doc = this.documents.get(id);
      if (!doc) continue;

      if (filter && !matchesFilter(doc.metadata, filter)) continue;

      results.push({
        doc,
        score: cosineSimilarity(query, doc.vector),
      });

      if (results.length >= topK) break;
    }

    return results.sort((a, b) => b.score - a.score);
  }

  update(id: string, updated: Partial<Omit<Document, "id">>) {
    const existing = this.documents.get(id);
    if (!existing) return false;

    const updatedDoc: Document = {
      ...existing,
      ...updated,
      vector: updated.vector ?? existing.vector,
      metadata: { ...existing.metadata, ...updated.metadata },
    };

    const internalIndex = this.idToIndex.get(id);
    if (internalIndex === undefined) return false;

    this.index.markDelete(internalIndex);
    this.index.addPoint(updatedDoc.vector, internalIndex);

    this.documents.set(id, updatedDoc);
    this.saveToDisk();
    return true;
  }

  delete(id: string) {
    const internalIndex = this.idToIndex.get(id);
    if (internalIndex === undefined) return false;

    this.documents.delete(id);
    this.index.markDelete(internalIndex);
    this.idToIndex.delete(id);
    this.indexToId.delete(internalIndex);
    this.saveToDisk();
    return true;
  }

  getAll(): Document[] {
    return Array.from(this.documents.values());
  }

  private saveToDisk() {
    this.storage.save(this.getAll());
  }

  private loadFromDisk() {
    const docs = this.storage.load();
    for (const doc of docs) {
      const internalIndex = this.currentIndex++;
      this.documents.set(doc.id, doc);
      this.index.addPoint(doc.vector, internalIndex);
      this.idToIndex.set(doc.id, internalIndex);
      this.indexToId.set(internalIndex, doc.id);
    }
  }
}
