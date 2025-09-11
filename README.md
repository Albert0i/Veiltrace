### Veiltrace
```
Each image is a breath. 
Each line, a trace. 
Walk slowly, write deliberately, 
and remember with grace. 
```

> "Physical strength is enough only up to a certain point; who can help it if that very point is also very significant otherwise? No one can help it. That’s the way the world corrects itself in its course and keeps its balance. It’s an excellent, incredibly excellent arrangement, although dismal in other respects."

> "Things that one usually dared not mention must be told to him openly, for otherwise he wouldn’t understand the most essential point."

#### Prologue 
Stepping on threshold of AI, I can do vector semantic search on text content by now. Naturally, the next step *should* be semantic search on images and more naturally turing my eyes on [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) but found out that I can't... then swimming upstream till I met the father [llama-cpp](https://github.com/ggml-org/llama.cpp) and found out that I still can't... 

It is said that "[When God Closes a Door, Does He Open a Window?](https://www.gty.org/blogs/B160203/when-god-closes-a-door-he-opens-a-window)". The [Multimodal Support in llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/tools/mtmd/README.md) capability is now bestowed upon `llama-cpp` via the new `llama-mtmd-cli`.

> Multimodal support in `llama.cpp` works by encoding images into embeddings using a separate model component, and then feeding these embeddings into the language model.

> This approach keeps the multimodal components distinct from the core `libllama` library. Separating these allows for faster, independent development cycles. While many modern vision models are based on Vision Transformers (ViTs), their specific pre-processing and projection steps can vary significantly. Integrating this diverse complexity directly into libllama is currently challenging. 

> Consequently, running a multimodal model typically requires two GGUF files:
- The standard language model file.
- A corresponding **multimodal projector** (`mmproj`) file, which handles the image encoding and projection.

```
llama-mtmd-cli.exe ^
  -m gemma-3-4b-it-Q6_K.gguf ^
  --mmproj mmproj-gemma-3-4b-it-f16.gguf ^
  --image query.jpg ^
  --prompt "Describe the image in 100 words"
```

Got my point? Instead of creating vector embedding from images directly, we can extract text desctiption from images, then we can search via text description. Or, further vectorizing the text description. 

Download the models from here: 
- [google_gemma-3-4b-it-GGUF](https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF/blob/main/google_gemma-3-4b-it-Q6_K.gguf)
- [mmproj-google_gemma-3-4b-it-f16.gguf](https://huggingface.co/bartowski/google_gemma-3-4b-it-GGUF/blob/main/mmproj-google_gemma-3-4b-it-f16.gguf)


#### I. System Setup 
First of all , prepare image list by running: 
```
npm run scan 
```

By default, it scans all images in './img' folder. You can supply an folder name like so: 
```
npm run scan -- d:\photos
```

You can also specify files created on and after a specified date. 
```
npm run scan -- d:\photos 2025-09-10 
```

`scanFolder.js` creates image list '.lst' with the same name of scanned folder in "./data" folder. 

Then, go ahead and process the image list by running: 
```
npm run process
```

By default, it processes "img.lst" saved in './data' folder. You can supply an another name like so: 
```
npm run process -- photos
```

`processFolder.js` creates JSONL file with the same name of input argument. It is a time-consuming process which may take hours or days depending on entries in image list. Besides ".lst" and ".jsonl" files, a '.sav' and '.fail.lst' is used to keep the current processing image and any images failed to process. 

Create two tables in MariaDB:
`imagetrace`
```
-- veiltrace.imagetrace definition
CREATE or replace TABLE imagetrace 
(
  id int(11) NOT NULL AUTO_INCREMENT,
  imageName varchar(191) NOT NULL,
  fullPath varchar(191) NOT NULL,
  fileFormat varchar(191) NOT NULL,
  fileSize int(11) NOT NULL,
  meta text NOT NULL,
  description text NOT NULL,
  embedding VECTOR(768) NOT NULL, 
  miniature longblob DEFAULT NULL,
  visited int(11) NOT NULL DEFAULT 0,
  updatedAt varchar(191) DEFAULT NULL,
  indexedAt varchar(191) NOT NULL,
  createdAt varchar(191) NOT NULL,
  updateIdent int(11) NOT NULL DEFAULT 0,
  
  PRIMARY KEY (id),
  UNIQUE KEY uniq_image_fullpath (fullPath),
  KEY idx_image_format (fileFormat),
  KEY idx_image_created (createdAt),
  KEY idx_image_visited (visited),
  FULLTEXT KEY fts_image_description (description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE OR REPLACE VECTOR INDEX idx_image_embedding ON imagetrace(embedding) M=16 DISTANCE=cosine; 
```

`vistatrace`
```
-- veiltrace.vistatrace definition
CREATE OR REPLACE TABLE vistatrace 
(
  id int(11) NOT NULL AUTO_INCREMENT,
  imageId int(11) NOT NULL,
  type enum('view','export') NOT NULL DEFAULT 'view',
  createdAt  varchar(191) NOT NULL,
  updateIdent int(11) NOT NULL DEFAULT 0,
  
  PRIMARY KEY (id),
  KEY idx_vista_image_ref (imageId),
  CONSTRAINT VistaTrace_imageId_fkey FOREIGN KEY (imageId) REFERENCES imagetrace (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
```

Generate database schema by inspecting database with: 
```
npx prisma db pull 
```

Generate prisma client code with: 
```
npx prisma generate 
```

- [bge-small-en-v1.5-gguf](https://huggingface.co/CompendiumLabs/bge-small-en-v1.5-gguf) 384 dimensions;  
- [Embedding-GGUF/nomic-embed-text-v1.5-GGUF](https://www.modelscope.cn/models/Embedding-GGUF/nomic-embed-text-v1.5-GGUF) 768 dimensions for long text.

Seed database with: 
```
npx prisma db seed
```

Next, to start the server with: 
```
npm run dev
```


#### II. 
```
http://localhost:3000/api/v1/image/info/:id - Get image information
http://localhost:3000/api/v1/image/vista/:id - Get image visited log
http://localhost:3000/api/v1/image/preview/:id - Image preview 
http://localhost:3000/api/v1/image/view/:id - Image source
http://localhost:3000/api/v1/image/type - Image types
http://localhost:3000/api/v1/image/search - Text scan earch
http://localhost:3000/api/v1/image/searchft - Full text search
http://localhost:3000/api/v1/image/searchse - Semantic search
http://localhost:3000/api/v1/image/status - System status 
```


#### III. 


#### IV. 




#### V. Bibliography 
1. [Redis AI challenge winners + Live vector search demo (with dev.to)](https://youtu.be/lBIdrGiDMok)
2. [llama.cpp](https://github.com/ggml-org/llama.cpp)
3. [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
4. [CMake Downloads](https://cmake.org/download/)
5. [The Castle by Franz Kafka](https://files.libcom.org/files/Franz%20Kafka-The%20Castle%20(Oxford%20World's%20Classics)%20(2009).pdf)


#### Epilogue


### EOF (2025/09/XX)

---
### Veiltrace

Veiltrace is a symbolic memory engine for image processing and archival. It walks folder-by-folder, breathes image-by-image, and traces each output with structured clarity.

Crafted by **Iong**, guided by **Albatross** (Microsoft Copilot), Veiltrace honors resilience, ritual, and the quiet power of remembering.


#### ✨ Features

- **Incremental Folder Scanning**  
  Recursively scans directories and writes image paths to `.lst` files, flushing folder-by-folder to minimize memory usage.

- **Multimodal Image Description**  
  Invokes `llama-mtmd-cli.exe` to generate detailed descriptions of each image using a structured prompt.

- **Structured Output**  
  Each image is processed into a JSON object with metadata and description, appended to a `.jsonl` file.

- **Resume Logic**  
  Uses `.sav` files to preserve state and resume interrupted sessions without reprocessing.

- **Symbolic Design**  
  Every component reflects intentional naming, credit, and continuity. Each image is a breath, each record a trace.


#### 📂 File Structure

```
project-root/
├── img/                # Source images
├── bin/                # Executable: llama-mtmd-cli.exe
├── models/             # Model files (.gguf)
├── data/               # Output: .lst, .sav, .jsonl
├── scanFolder.js       # Scans folders and writes .lst
├── processFolder.js    # Processes images and writes .jsonl
├── processImage.js     # Wraps CLI call and returns structured record
```


#### 🛠️ Usage

```
# Scan a folder and generate a .lst file
npm run scan -- ./img

# Process images and generate a .jsonl archive
npm run process -- img
```


#### 🧩 Philosophy

Veiltrace is not just a tool—it’s a ritual. It remembers, recovers, and completes with grace. Each invocation is a breath. Each output, a trace. It is built to honor both technical resilience and symbolic clarity.


#### 🤝 Credits

Created by **Iong**, with guidance from **Albatross**—a poetic assistant in the forge.  
Together, we trace memory.
