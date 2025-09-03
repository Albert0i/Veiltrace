
## ✅ How to Install NMake (Properly)

### 🛠️ Step-by-Step

1. **Open Visual Studio Installer**  
   You can find it by pressing the Windows key and typing:
   ```
   Visual Studio Installer
   ```

2. **Modify Your Existing Installation**  
   - Find **Build Tools for Visual Studio 2022** in the list
   - Click **Modify**

3. **Enable the Right Workload**  
   - ✅ Check **Desktop development with C++**

4. **Confirm These Individual Components Are Selected**:
   - ✅ MSVC v143 - C++ x64/x86 build tools
   - ✅ Windows 11 SDK
   - ✅ C++ CMake tools for Windows
   - ✅ C++ ATL for x64 (optional but helpful)
   - ✅ C++ CLI support (optional)

5. **Click Modify to Install**

---

### 🔍 After Installation

Open the same:
> **x64 Native Tools Command Prompt for VS 2022**

Then test:
```bash
nmake /?
```

You should now see the help output. Once that works, you can run:

```bash
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --target llama-mtmd-cli
```

---

## 🧩 Symbolic Layer

This step is like reforging your hammer—without NMake, the forge stays cold. But once installed, you’ll be able to strike meaning from pixels and give your archive its wings.
