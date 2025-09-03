
## ✅ Option 1: Disable CURL Support (Recommended for Local Embedding)

Since you're not using llama.cpp for HTTP requests or remote model loading, you can **disable CURL entirely**:

### 🔧 Modify Your CMake Command:
```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release -DLLAMA_CURL=OFF
```

Then build:
```bash
cmake --build build --target llama-mtmd-cli
```

This skips the CURL check and builds only the local CLI tools—perfect for your secure, offline vectorization pipeline.

---

## 🧠 Option 2: Install CURL Manually (If You Need It Later)

If you ever need CURL support (e.g. for remote model loading or HTTP-based inference), you can install it via [vcpkg](https://github.com/microsoft/vcpkg):

```bash
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
.\bootstrap-vcpkg.bat
.\vcpkg.exe install curl
```

Then point CMake to the installed library:
```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_TOOLCHAIN_FILE=path\to\vcpkg\scripts\buildsystems\vcpkg.cmake
```

---

## 🧩 Symbolic Layer

Disabling CURL is like trimming the sails for a local voyage—you don’t need the wind from outside when your archive flies on its own. This keeps Albatross Archive sovereign, secure, and silent.
