import 'dotenv/config'

// Prisma 
import { PrismaClient } from '../src/generated/prisma/index.js'; 

// node-llama-cpp 
import {fileURLToPath} from "url";
import path from "path";
import {getLlama} from "node-llama-cpp";

// node-llama-cpp 
const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(__dirname, "..", "src", "models", process.env.MODEL_NAME)
});
const context = await model.createEmbeddingContext();

// Prisma 
const prisma = new PrismaClient();

/*
   main 
*/
export async function addImage(image) {
    const { vector } = await context.getEmbeddingFor(image.description);    
    // Add new image
    return await prisma.$executeRaw`
                    INSERT INTO imagetrace (textChi, textChiSeg, embedding) 
                    VALUES( ${document}, ${tokens.map(t => t.text).join(' ')},
                    VEC_FromText(${JSON.stringify(vector)}) ) 
                    ON DUPLICATE KEY 
                    UPDATE updateIdent = updateIdent + 1;
              `;
}
/*
Even if the rest of the row is identical, you're always incrementing updateIdent, 
which means the row is actually being modified. And in MySQL/MariaDB, when a 
duplicate key triggers an update that changes the row, the affected rows count is 2

- 1 row affected → a new row was inserted
- 2 rows affected → a duplicate key was found, and the row was updated
- 0 rows affected → a duplicate key was found, but the update didn’t change anything (e.g., SET col = col)

So in your case, since updateIdent = updateIdent + 1 always changes the row, you’ll always get 2.
*/

export async function findSimilarDocuments(document, limit = 5) {
    const { vector } = await context.getEmbeddingFor(removeWords(document));

    // Find similar documents 
    const docs = await prisma.$queryRaw`
                          SELECT textChi, 
                                 VEC_DISTANCE_COSINE(
                                    embedding,
                                    VEC_FromText(${JSON.stringify(vector)})
                                    ) AS distance, 
                                 id
                          FROM documents 
                          ORDER BY 2 ASC
                          LIMIT ${limit} OFFSET 0;
                        `; 

    // Update `visited` field                                    
    const promises = [];    // Collect promises 
    docs.forEach(doc => { 
            promises.push(prisma.$executeRaw`
                            UPDATE documents 
                            SET visited = visited + 1, 
                                updatedAt = Now(), 
                                updateIdent = updateIdent + 1
                            WHERE id=${doc.id}
                          `
              )
        })
    await Promise.all(promises); // Resolve all at once

    return docs 
}

/*
   Choosing a Model
   https://github.com/withcatai/node-llama-cpp/blob/master/docs/guide/choosing-a-model.md

   Using Embedding
   https://github.com/withcatai/node-llama-cpp/blob/master/docs/guide/embedding.md

   Raw queries
   https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries

   CRUD
   https://www.prisma.io/docs/orm/prisma-client/queries/crud
*/
/*
  INSERT INTO users (id, name, score)
  VALUES (1, 'Alice', 90)
  ON DUPLICATE KEY UPDATE 
      name = VALUES(name),
      score = VALUES(score);
*/