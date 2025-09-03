### Veiltrace
```
Each image is a breath. 
Each line, a trace. 
Walk slowly, write deliberately, 
and remember with grace. 
```


#### Prologue 
Stepping on threshold of AI, I can do vector semantic search on text content by now. Naturally, the next step *should* be semantic search on images and more naturally i turn eyes on [node-llama-cpp](https://github.com/withcatai/node-llama-cpp) and found out that I can't... then I swam upstream till I met the father  [llama-cpp](https://github.com/ggml-org/llama.cpp) and found out that I still can't... 

It is said that "[When God Closes a Door, Does He Open a Window?](https://www.gty.org/blogs/B160203/when-god-closes-a-door-he-opens-a-window)". The [Multimodal Support in llama.cpp](https://github.com/ggml-org/llama.cpp/blob/master/tools/mtmd/README.md) capability is bestowed upon `llama-cpp` via the new `llama-mtmd-cli`.

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

Got my point? Instead of creating vector embedding from images directly, we can extract text info from images, then search via text description. Or, further vectorize the on text description. 


#### I. 


#### II. 


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
