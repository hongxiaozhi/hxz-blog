#!/bin/bash
# =============================================================
# XiaozhiBlog 增量更新脚本（代码已推送后在服务器执行）
# 执行：bash /opt/hxz-blog/deploy/update.sh
# =============================================================
set -e

PROJECT_DIR="/opt/hxz-blog"
SERVICE_NAME="hxz-blog"

echo ">>> [1/4] 拉取最新代码"
cd "$PROJECT_DIR"
git pull origin main

echo ">>> [2/4] 更新后端依赖"
cd "$PROJECT_DIR/backend"
source venv/bin/activate
pip install --quiet -r requirements.txt
deactivate

echo ">>> [3/4] 重启后端服务"
systemctl restart $SERVICE_NAME
sleep 2
systemctl status $SERVICE_NAME --no-pager

echo ">>> [4/4] 验收接口"
curl -s http://127.0.0.1:8001/api/posts | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'OK - 共 {d[\"total\"]} 篇文章')" || echo "接口验收失败，请检查日志"

echo ""
echo "=== 更新完成 ==="
echo "日志：journalctl -u $SERVICE_NAME -n 30"
