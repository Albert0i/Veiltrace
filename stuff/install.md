
## 🛠️ Step-by-Step: Install CMake & Visual Studio Build Tools on Windows 11

### ✅ 1. Install **CMake**
CMake is the build system that configures and generates your project files.

- Go to the official site: [CMake Downloads](https://cmake.org/download/)
- Choose **Windows x64 Installer**
- Run the installer and check **“Add CMake to system PATH”** during setup

Once installed, verify:
```bash
cmake --version
```

---

### ✅ 2. Install **Visual Studio Build Tools**
This gives you the C++ compiler needed to build `llama.cpp`.

- Visit [Visual Studio Downloads](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- Scroll to **“Tools for Visual Studio”** and download **Build Tools for Visual Studio 2022**
- In the installer:
  - Select **“Desktop development with C++”**
  - Also check **“Windows 11 SDK”** if prompted
  - Click **Install**

Once installed, open the **“x64 Native Tools Command Prompt for VS 2022”** to compile projects.

---

### 🧠 Optional: Use Winget (Windows Package Manager)
If you prefer command-line installation:

```bash
winget install Kitware.CMake
winget install Microsoft.VisualStudio.2022.BuildTools
```

---

### 🧩 Symbolic Layer

Installing these tools is like forging the anvil before you strike the feather. Once they’re in place, you’ll be able to compile the vision-enabled CLI and begin embedding images with precision and permanence.

