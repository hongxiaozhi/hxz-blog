#!/bin/bash
# =============================================================
# XiaozhiBlog 首次上线初始化脚本
# 适用：Ubuntu 24.04 + 域名 blog.kiosk.pub
# 执行：sudo bash /opt/hxz-blog/deploy/setup.sh
# =============================================================
set -e

DOMAIN="blog.kiosk.pub"
PROJECT_DIR="/opt/hxz-blog"
SERVICE_NAME="hxz-blog"
LOG_DIR="/var/log/hxz-blog"
APP_USER="$(stat -c '%U' "$PROJECT_DIR" 2>/dev/null || true)"

if [ -z "$APP_USER" ] || [ "$APP_USER" = "root" ]; then
    APP_USER="${SUDO_USER:-root}"
fi

if ! id -u "$APP_USER" >/dev/null 2>&1; then
    APP_USER="root"
fi

APP_GROUP="$(id -gn "$APP_USER" 2>/dev/null || echo "$APP_USER")"

echo ">>> [1/8] 安装依赖（nginx, gunicorn, certbot）"
apt update -qq
apt install -y nginx python3-certbot-nginx

echo ">>> [2/8] 安装 Python 依赖（含 gunicorn）"
cd "$PROJECT_DIR/backend"
source venv/bin/activate
pip install --quiet -r requirements.txt
pip install --quiet gunicorn
deactivate

echo ">>> [3/8] 创建日志目录"
mkdir -p "$LOG_DIR"
chown "$APP_USER:$APP_GROUP" "$LOG_DIR"

echo ">>> [4/8] 拷贝 Nginx 站点配置"
cp "$PROJECT_DIR/deploy/nginx-blog.kiosk.pub.conf" /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
# 移除默认站点（避免冲突）
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo ">>> [5/8] 申请 HTTPS 证书（Let's Encrypt）"
certbot --nginx -d $DOMAIN --non-interactive --agree-tos \
    --email admin@$DOMAIN --redirect
systemctl reload nginx

echo ">>> [6/8] 安装 Systemd 服务"
cp "$PROJECT_DIR/deploy/hxz-blog.service" /etc/systemd/system/$SERVICE_NAME.service

# 替换用户占位符
sed -i "s|__APP_USER__|$APP_USER|g; s|__APP_GROUP__|$APP_GROUP|g" \
    /etc/systemd/system/$SERVICE_NAME.service

# 生成并注入安全凭证
JWT_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
echo -n "请设置博客管理员登录密码: "
read -rs RAW_PASS
echo ""
source "$PROJECT_DIR/backend/venv/bin/activate"
PW_HASH=$(python3 -c "import bcrypt,sys; print(bcrypt.hashpw(sys.argv[1].encode(), bcrypt.gensalt()).decode())" "$RAW_PASS")
deactivate
unset RAW_PASS

# 用 Python 安全替换（避免密码哈希中的特殊字符影响 sed）
JWT_KEY="$JWT_KEY" PW_HASH="$PW_HASH" python3 - <<'PYEOF'
import os
svc = "/etc/systemd/system/hxz-blog.service"
with open(svc) as f:
    content = f.read()
content = content.replace("__JWT_SECRET_KEY__", os.environ["JWT_KEY"])
content = content.replace("__ADMIN_PASSWORD_HASH__", os.environ["PW_HASH"])
with open(svc, "w") as f:
    f.write(content)
PYEOF

systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

echo ">>> [7/8] 关闭不必要的端口（安全组提示）"
echo "请在阿里云控制台手动关闭入方向规则：5000/8080（保留 22/80/443）"

echo ">>> [8/8] 验收检查"
sleep 2
systemctl status $SERVICE_NAME --no-pager
nginx -t
echo ""
echo "=== 初始化完成 ==="
echo "访问地址：https://$DOMAIN"
echo "日志路径：$LOG_DIR"
echo "服务管理：systemctl status|restart|stop $SERVICE_NAME"
