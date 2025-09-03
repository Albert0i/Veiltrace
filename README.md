### Veiltrace


#### Prologue 


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
