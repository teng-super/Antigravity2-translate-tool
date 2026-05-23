# Antigravity 2.0 汉化补丁工具 (Antigravity 2.0 Chinese Localization Patcher)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-blue.svg)](https://nodejs.org/)

这是一个专为 Google Antigravity 2.0 桌面端应用设计的**自动化中文汉化补丁工具**。

通过本工具，你可以一键将 Antigravity 2.0 的用户界面（包含侧边栏、对话框、设置面板等）、顶部窗口菜单、右键系统托盘及各类系统提示框完整汉化为简体中文。

---

## 🛠️ 工作原理 (How it Works)

1. **自动定位与关闭**：检测系统正在运行的 `Antigravity.exe` 进程并将其安全关闭（以释放文件锁）。
2. **安全备份**：在首次运行时，自动将官方原始的核心文件 `app.asar` 备份为 `app.asar.bak`。
3. **提取与解包**：使用 `@electron/asar` 模块将客户端归档解包到临时目录。
4. **补丁注入**：
   - **渲染层 (`preload.js`)**：注入基于 **MutationObserver** 的动态 DOM 翻译引擎。当界面渲染新组件（如对话内容、新设置项）时，引擎会自动抓取文本节点并与本地词典比对翻译，支持动态词汇和输入框占位符（Placeholder）的翻译。
   - **主进程层 (`main.js` / `menu.js` / `tray.js`)**：原地修改系统菜单、右键托盘状态文字、以及退出确认对话框，让系统级 UI 呈现中文。
5. **打包与替换**：重构 `app.asar` 并覆盖回官方安装目录，随后自动重新启动应用，使汉化即刻生效。

---

## 📦 仓库结构 (Repository Structure)

```text
Antigravity2-translate-tool/
├── .gitignore          # Git 忽略配置（忽略本地临时目录及依赖）
├── LICENSE             # 开源协议文件 (MIT License)
├── README.md           # 项目详细说明文档 (当前文件)
├── dictionary.json     # 汉化对照词典 (英文 -> 中文映射表)
├── package.json        # 项目依赖及运行命令脚本
└── patch.js            # 汉化/还原自动化核心控制脚本
```

---

## ❓ 常见问题 (FAQ)

### Q: 这个汉化工具包（本项目文件夹）必须放在 C 盘吗？能不能移动到别处？
**A: 完全不需要放在 C 盘！**
- **汉化工具本身**：你可以将其存放在电脑的任何位置（例如 `D:\tools\Antigravity2-translate-tool` 或 `E:\` 盘的任意文件夹下）。脚本在执行时，会自动通过 Node.js 动态检测当前操作系统的用户 Home 目录，从而智能定位位于 C 盘 AppData 的官方应用路径。
- **Antigravity 软件本身**：默认安装在 C 盘（`C:\Users\<您的用户名>\AppData\Local\Programs\antigravity`）。如果你把软件本身也装到了其他非默认路径（例如 `D:\Programs\antigravity`），那也完全没关系！只需在运行本工具前，在终端设置环境变量指定安装目录即可：
  ```powershell
  # Windows PowerShell
  $env:ANTIGRAVITY_INSTALL_DIR="D:\Programs\antigravity"
  npm run patch
  ```

---

## 🚀 快速开始 (Quick Start)

### 1. 准备环境
确保您的电脑上已经安装了 [Node.js](https://nodejs.org/)（推荐使用 LTS 版本）。

### 2. 下载并安装依赖
在项目根目录下打开终端，运行以下命令安装解包依赖模块：
```bash
npm install
```

### 3. 一键应用汉化
> [!WARNING]
> 运行汉化脚本会强制关闭当前正在运行的 Antigravity 2 软件，请确保您的智能体任务已保存或暂停。

在终端中运行以下命令：
```bash
npm run patch
```
脚本执行完毕后，Antigravity 2 将自动重启并呈现中文界面。

### 4. 一键还原官方英文
如果您在使用过程中想要退回官方英文原版，随时可以运行：
```bash
npm run revert
```

---

## 📖 自定义翻译词典 (Customization)

如果您发现某些新增界面词汇未被汉化，或者想调整现有的翻译用词，可以直接用文本编辑器打开项目中的 `dictionary.json` 文件：

```json
{
  "Original English Text": "您想要的中文翻译"
}
```

修改并保存后，只需**重新运行**一次 `npm run patch` 重新打包注入即可生效！欢迎提交 Pull Request 贡献您的词汇翻译！

## 📄 开源协议 (License)

本项目采用 [MIT License](LICENSE) 开源协议。
