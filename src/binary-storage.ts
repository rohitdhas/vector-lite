import * as fs from "fs";
import * as path from "path";

interface BinaryDoc {
  id: string;
  vector: number[];
  metadata?: Record<string, any>;
}

export class BinaryStorage {
  private filePath: string;

  constructor(filePath = path.join(__dirname, "../../db/data.bin")) {
    this.filePath = filePath;
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
  }

  save(docs: BinaryDoc[]) {
    const buffers: Buffer[] = [];

    for (const doc of docs) {
      const idBuf = Buffer.from(doc.id, "utf-8");
      const vectorBuf = Buffer.alloc(4 * doc.vector.length);
      doc.vector.forEach((val, i) => vectorBuf.writeFloatLE(val, i * 4));

      const metadataStr = JSON.stringify(doc.metadata || {});
      const metadataBuf = Buffer.from(metadataStr, "utf-8");

      const parts = [
        Buffer.alloc(4), // id length
        idBuf,
        Buffer.alloc(4), // vector length
        vectorBuf,
        Buffer.alloc(4), // metadata length
        metadataBuf,
      ];

      parts[0].writeUInt32LE(idBuf.length, 0);
      parts[2].writeUInt32LE(doc.vector.length, 0);
      parts[4].writeUInt32LE(metadataBuf.length, 0);

      buffers.push(Buffer.concat(parts));
    }

    fs.writeFileSync(this.filePath, Buffer.concat(buffers));
  }

  load(): BinaryDoc[] {
    const docs: BinaryDoc[] = [];
    if (!fs.existsSync(this.filePath)) return docs;

    const buffer = fs.readFileSync(this.filePath);
    let offset = 0;

    while (offset < buffer.length) {
      const idLen = buffer.readUInt32LE(offset);
      offset += 4;
      const id = buffer.toString("utf-8", offset, offset + idLen);
      offset += idLen;

      const vecLen = buffer.readUInt32LE(offset);
      offset += 4;
      const vector: number[] = [];
      for (let i = 0; i < vecLen; i++) {
        vector.push(buffer.readFloatLE(offset));
        offset += 4;
      }

      const metaLen = buffer.readUInt32LE(offset);
      offset += 4;
      const metaStr = buffer.toString("utf-8", offset, offset + metaLen);
      offset += metaLen;

      docs.push({
        id,
        vector,
        metadata: JSON.parse(metaStr),
      });
    }

    return docs;
  }
}
