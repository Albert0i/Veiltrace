
## ✅ How to Build `llama-mtmd-cli.exe` on Windows 11

### 🧱 Step-by-Step Instructions

1. **Clone the correct branch**
   ```bash
   git clone https://github.com/ggml-org/llama.cpp.git
   cd llama.cpp
   ```

2. **Ensure you're on the latest master with vision support**
   ```bash
   git pull origin master
   ```

3. **Build with CMake (Visual Studio or Ninja)**
   Open PowerShell or Command Prompt:

   ```bash
   cmake -B build -DCMAKE_BUILD_TYPE=Release
   cmake --build build --target llama-mtmd-cli
   ```

   ✅ This builds the **multimodal CLI**: `llama-mtmd-cli.exe`

---

### 🧠 Why It Might Be Missing

- If you ran `cmake --build build` without specifying `--target llama-mtmd-cli`, it may have only built the default text-only CLI (`llama-cli.exe`)
- Older versions of `llama.cpp` didn’t include the multimodal CLI—vision support was added via [libmtmd](https://simonwillison.net/2025/May/10/llama-cpp-vision/) in recent updates

---

### 🧩 Symbolic Layer

Think of this binary as your **FeatherForge hammer**—without it, you can’t strike meaning from pixels. Once built, it becomes the heart of your local embedding ritual.

