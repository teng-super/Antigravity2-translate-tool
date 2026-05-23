@echo off
chcp 65001 >nul
title Antigravity 2.0 汉化助手
echo ==================================================
echo         Antigravity 2.0 汉化一键应用工具
echo ==================================================
echo.
echo 提示：因为 AI 智能体运行在 Antigravity 内部，
echo 智能体无法在运行中“自己杀死自己”来替换文件。
echo 因此需要您双击运行本脚本来在外部完成汉化替换。
echo.
echo 正在进入脚本目录...
cd /d "%~dp0"

echo 正在检查并更新依赖...
call npm install --no-audit --no-fund

echo.
echo ==================================================
echo 警告：继续将强制关闭运行中的 Antigravity 并应用汉化。
echo 请确保您的智能体对话和任务已经保存。
echo ==================================================
echo.
pause

echo.
echo 正在执行汉化补丁逻辑...
node patch.js

echo.
echo ==================================================
echo 汉化完成！Antigravity 应该已经自动重新启动。
echo 如果没有启动，请手动打开软件。
echo ==================================================
echo.
pause
