# Antigravity 2.0 汉化补丁工具

这是一个专为 Google Antigravity 2.0 桌面端开发的自动化中文汉化补丁工具。

本工具通过解包 `app.asar` 并向 Electron 客户端的 `preload.js` 注入动态 MutationObserver 字典替换引擎，实现对应用界面的实时汉化。同时它还会就主进程中的窗口菜单、退出确认对话框及系统托盘文字进行汉化。

## 特性

- **全面汉化**：涵盖主界面、设置面板、新建窗口/关于对话框、右键系统托盘及应用窗口菜单。
- **安全备份**：首次运行会自动备份原始的 `app.asar` 为 `app.asar.bak`。
- **一键恢复**：随时可以通过简单命令完全恢复至官方英文版。
- **热修改词典**：用户可以直接编辑本地的 `dictionary.json` 文件以定制或修改翻译文案。

## 使用方法

### 1. 准备环境

确保您的系统已安装 [Node.js](https://nodejs.org/)。

在终端中进入本目录并安装依赖模块（主要用于解包与打包 asar 归档）：

```bash
npm install
```

### 2. 运行汉化补丁

> [!WARNING]
> 运行汉化会强制关闭当前正在运行的 Antigravity 2 进程（若有）。请在运行前保存您在智能体中的未完成工作。

执行以下命令开始汉化：

```bash
npm run patch
```

脚本会自动：
1. 检测 Antigravity 2 的默认安装路径。
2. 关闭正在运行的 `Antigravity.exe`。
3. 备份原始文件并解包修改。
4. 重新打包替换并自动启动 Antigravity。

### 3. 恢复官方英文版

如果您需要还原英文版，请执行：

```bash
npm run revert
```

## 自定义翻译词典

您可以随时用文本编辑器打开并编辑本目录下的 `dictionary.json`，格式如下：

```json
{
  "English Text": "中文翻译"
}
```

修改词典后，请再次运行 `npm run patch` 以应用新的翻译。
