const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Determine paths
const userHome = os.homedir();
const defaultInstallDir = path.join(userHome, 'AppData', 'Local', 'Programs', 'antigravity');
const installDir = process.env.ANTIGRAVITY_INSTALL_DIR || defaultInstallDir;
const resourcesDir = path.join(installDir, 'resources');
const appAsarPath = path.join(resourcesDir, 'app.asar');
const appAsarBakPath = path.join(resourcesDir, 'app.asar.bak');
const appAsarUnpackedDir = path.join(resourcesDir, 'app.asar.unpacked');

const tempDir = path.join(__dirname, 'temp');
const extractedDir = path.join(tempDir, 'extracted');
const tempAsarPath = path.join(tempDir, 'app.asar');
const tempAsarUnpackedDir = path.join(tempDir, 'app.asar.unpacked');

const dictionaryPath = path.join(__dirname, 'dictionary.json');

// Revert function
function revert() {
  console.log('--- 正在执行恢复英文原版操作 ---');
  
  if (!fs.existsSync(appAsarBakPath)) {
    console.error('错误: 未找到备份文件 (app.asar.bak)，无法恢复。');
    process.exit(1);
  }

  // 1. 关闭 Antigravity
  killAntigravity();

  // 2. 还原备份
  try {
    fs.copyFileSync(appAsarBakPath, appAsarPath);
    console.log('成功: 已将备份还原为 app.asar');
  } catch (err) {
    console.error('错误: 还原文件失败:', err.message);
    process.exit(1);
  }

  // 3. 重启 Antigravity
  startAntigravity();
  console.log('--- 还原操作已完成！ ---');
}

// Close Antigravity.exe
function killAntigravity() {
  console.log('正在检查并关闭运行中的 Antigravity 进程...');
  try {
    // taskkill will exit with 128 if process not found, which is fine
    execSync('taskkill /F /IM Antigravity.exe', { stdio: 'ignore' });
    console.log('已关闭 Antigravity 进程。');
    // Wait a brief moment for locks to release
    execSync('powershell -Command "Start-Sleep -m 500"');
  } catch (err) {
    // Process might not be running, ignore
  }
}

// Start Antigravity.exe
function startAntigravity() {
  console.log('正在重新启动 Antigravity...');
  const appPath = path.join(installDir, 'Antigravity.exe');
  if (fs.existsSync(appPath)) {
    try {
      const { spawn } = require('child_process');
      const child = spawn(appPath, [], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      console.log('Antigravity 已在后台启动。');
    } catch (err) {
      console.error('启动 Antigravity 失败，请手动双击启动。', err.message);
    }
  } else {
    console.warn(`未找到可执行文件: ${appPath}，请手动启动。`);
  }
}

// Cleanup directory recursively
function cleanupFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
}

// Patch function
async function patch() {
  console.log('--- 开始进行 Antigravity 2.0 中文汉化 ---');
  
  if (!fs.existsSync(appAsarPath)) {
    console.error(`错误: 未能在路径找到 app.asar: ${appAsarPath}`);
    console.error('请确认 Antigravity 2.0 是否已正确安装，或通过环境变量 ANTIGRAVITY_INSTALL_DIR 指定安装目录。');
    process.exit(1);
  }

  // 1. 加载 asar 依赖
  let asar;
  try {
    asar = require('@electron/asar');
  } catch (err) {
    console.error('错误: 未能加载 @electron/asar 模块，请先运行 "npm install"。');
    process.exit(1);
  }

  // 2. 加载汉化词典
  if (!fs.existsSync(dictionaryPath)) {
    console.error(`错误: 未找到词典文件: ${dictionaryPath}`);
    process.exit(1);
  }
  const dictionary = JSON.parse(fs.readFileSync(dictionaryPath, 'utf8'));
  console.log(`已成功加载词典，共包含 ${Object.keys(dictionary).length} 个词条。`);

  // 3. 关闭运行中的进程
  killAntigravity();

  // 4. 创建备份
  if (!fs.existsSync(appAsarBakPath)) {
    console.log('正在创建原始 app.asar 的备份...');
    try {
      fs.copyFileSync(appAsarPath, appAsarBakPath);
      console.log(`备份已成功保存到: ${appAsarBakPath}`);
    } catch (err) {
      console.error('创建备份失败，请检查写入权限:', err.message);
      process.exit(1);
    }
  } else {
    console.log('备份文件 (app.asar.bak) 已存在，跳过备份。');
  }

  // 5. 准备临时工作区
  console.log('正在准备临时工作区...');
  cleanupFolder(tempDir);
  fs.mkdirSync(tempDir, { recursive: true });

  // 6. 复制 app.asar 和 app.asar.unpacked 到临时工作区
  try {
    fs.copyFileSync(appAsarPath, tempAsarPath);
    if (fs.existsSync(appAsarUnpackedDir)) {
      // Copy unpacked directory
      console.log('检测到 app.asar.unpacked，正在同步复制...');
      copyFolderSync(appAsarUnpackedDir, tempAsarUnpackedDir);
    }
  } catch (err) {
    console.error('复制代码到临时区失败:', err.message);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 7. 解包 app.asar
  console.log('正在解包 app.asar...');
  try {
    asar.extractAll(tempAsarPath, extractedDir);
    console.log('解包成功。');
  } catch (err) {
    console.error('解包失败:', err.message);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 8. 注入汉化代码
  console.log('正在注入汉化补丁...');

  // A. 注入 preload.js
  const preloadPath = path.join(extractedDir, 'dist', 'preload.js');
  if (fs.existsSync(preloadPath)) {
    console.log('正在注入 preload.js...');
    const injectCode = buildInjectScript(dictionary);
    fs.appendFileSync(preloadPath, '\n\n' + injectCode);
  } else {
    console.warn('警告: 未找到 dist/preload.js');
  }

  // B. 修改 main.js 中的弹窗和托盘
  const mainPath = path.join(extractedDir, 'dist', 'main.js');
  if (fs.existsSync(mainPath)) {
    console.log('正在汉化 main.js (弹窗与托盘默认项)...');
    let mainContent = fs.readFileSync(mainPath, 'utf8');
    
    // Replace quit confirmation strings with regex to match varying whitespace/formatting
    mainContent = mainContent.replace(/buttons:\s*\[\s*'Cancel'\s*,\s*'Quit'\s*\]/g, "buttons: ['取消', '退出']");
    mainContent = mainContent.replace(/title:\s*'Confirm Quit'/g, "title: '确认退出'");
    mainContent = mainContent.replace(/message:\s*'Are you sure you want to quit\?'/g, "message: '您确定要退出吗？'");
    mainContent = mainContent.replace(/detail:\s*'There may be agents or background tasks running\.'/g, "detail: '可能还有智能体或后台任务正在运行。'");
    
    // Replace default tray options
    mainContent = mainContent.replace(/label:\s*'No agents running'/g, "label: '没有运行中的智能体'");
    mainContent = mainContent.replace(/label:\s*`Open \${electron_1\.app\.getName\(\)}`/g, "label: `打开 ${electron_1.app.getName()}`");
    mainContent = mainContent.replace(/label:\s*'Quit'/g, "label: '退出'");

    fs.writeFileSync(mainPath, mainContent, 'utf8');
  }

  // C. 修改 menu.js 中的窗口菜单
  const menuPath = path.join(extractedDir, 'dist', 'menu.js');
  if (fs.existsSync(menuPath)) {
    console.log('正在汉化 menu.js (应用窗口菜单)...');
    let menuContent = fs.readFileSync(menuPath, 'utf8');
    menuContent = menuContent.replace(/label:\s*'New Window'/g, "label: '新建窗口'");
    menuContent = menuContent.replace(/label:\s*'Docs'/g, "label: '文档'");
    fs.writeFileSync(menuPath, menuContent, 'utf8');
  }

  // D. 修改 tray.js 中的托盘动态状态
  const trayPath = path.join(extractedDir, 'dist', 'tray.js');
  if (fs.existsSync(trayPath)) {
    console.log('正在汉化 tray.js (系统托盘动态状态)...');
    let trayContent = fs.readFileSync(trayPath, 'utf8');
    
    // Use regex to robustly match dynamic string concat regardless of indentation and newlines
    const trayRegex = /\(count\s*>\s*0\s*\?\s*`\$\{count\}`\s*:\s*'No'\)\s*\+\s*' agent'\s*\+\s*\(count\s*===\s*1\s*\?\s*''\s*:\s*'s'\)\s*\+\s*' running'/g;
    trayContent = trayContent.replace(trayRegex, "(count > 0 ? `${count} 个智能体正在运行` : '没有运行中的智能体')");
    
    fs.writeFileSync(trayPath, trayContent, 'utf8');
  }

  // 9. 重新打包 app.asar
  console.log('正在重新打包 app.asar...');
  try {
    // Delete the old asar in temp so we pack into a clean target
    fs.unlinkSync(tempAsarPath);
    await asar.createPackage(extractedDir, tempAsarPath);
    console.log('打包成功。');
  } catch (err) {
    console.error('打包失败:', err.message);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 10. 覆盖回原安装目录
  console.log('正在应用修改后的 app.asar...');
  try {
    fs.copyFileSync(tempAsarPath, appAsarPath);
    console.log('汉化程序已成功替换！');
  } catch (err) {
    console.error('覆盖 app.asar 失败，请确认程序已完全退出且拥有写入权限:', err.message);
    console.log(`您可以手动复制此文件到目标目录: ${tempAsarPath} -> ${appAsarPath}`);
    cleanupFolder(tempDir);
    process.exit(1);
  }

  // 11. 清理临时目录
  console.log('正在清理临时文件...');
  cleanupFolder(tempDir);

  // 12. 重新启动
  startAntigravity();
  
  console.log('--- 汉化补丁应用成功！享受中文界面吧！ ---');
}

// Copy directory helper
function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

// Generate the script to inject into preload.js
function buildInjectScript(dict) {
  return `
// ==================== ANTIGRAVITY CHINESE LOCALIZATION PATCH ====================
(function() {
  const dictionary = ${JSON.stringify(dict, null, 2)};

  function translateText(text) {
    if (!text) return text;
    const trimmed = text.trim();
    if (dictionary[trimmed]) {
      return text.replace(trimmed, dictionary[trimmed]);
    }
    return null;
  }

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const translated = translateText(node.textContent);
      if (translated !== null) {
        node.textContent = translated;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Input placeholders
      if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
        const placeholder = node.getAttribute('placeholder');
        const translated = translateText(placeholder);
        if (translated !== null) {
          node.setAttribute('placeholder', translated);
        }
      }
      // Tooltips and titles
      if (node.hasAttribute('title')) {
        const title = node.getAttribute('title');
        const translated = translateText(title);
        if (translated !== null) {
          node.setAttribute('title', translated);
        }
      }
      // Translate buttons/inputs with values
      if (node.tagName === 'INPUT' && (node.type === 'button' || node.type === 'submit')) {
        const val = node.value;
        const translated = translateText(val);
        if (translated !== null) {
          node.value = translated;
        }
      }
      // Check children
      for (let child of node.childNodes) {
        translateNode(child);
      }
    }
  }

  function observeDOM() {
    const observer = new MutationObserver((mutations) => {
      for (let mutation of mutations) {
        if (mutation.type === 'childList') {
          for (let node of mutation.addedNodes) {
            translateNode(node);
          }
        } else if (mutation.type === 'characterData') {
          translateNode(mutation.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Initial translation
    translateNode(document.body);
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeDOM);
  } else {
    observeDOM();
  }

  // Translate document title
  const originalTitle = document.title;
  const translatedTitle = translateText(originalTitle);
  if (translatedTitle !== null) {
    document.title = translatedTitle;
  }
  
  // Observe title changes
  const titleObserver = new MutationObserver(() => {
    const title = document.title;
    const translated = translateText(title);
    if (translated !== null && title !== translated) {
      document.title = translated;
    }
  });
  
  const titleEl = document.querySelector('title');
  if (titleEl) {
    titleObserver.observe(titleEl, { childList: true, characterData: true });
  }
})();
// ==================== END OF ANTIGRAVITY CHINESE LOCALIZATION PATCH ====================
`;
}

// Run Main
const args = process.argv.slice(2);
if (args.includes('--revert')) {
  revert();
} else {
  patch();
}
