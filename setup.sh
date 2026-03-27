#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "== 开始设置 (macOS/Linux) =="

# 后端环境
python3 -m venv backend/venv
source backend/venv/bin/activate
python -m pip install --upgrade pip
pip install -r backend/requirements.txt

# 初始化数据库
python backend/init_db.py

echo "== 设置完成 =="

echo "后端启动：\n  source backend/venv/bin/activate\n  python backend/app.py"

echo "前端启动：\n  cd frontend && python -m http.server 8080"