# XiaozhiBlog 云部署指南

> 目标：在阿里云 Ubuntu 24.04 服务器上部署并验证完整业务链路
> 验收标准：公网访问首页 + 登录 + 发帖 + 评论 + 读写闭环

---

## 前置条件

1. 阿里云 ECS 实例（Ubuntu 24.04）
2. SSH 访问权限（知晓 IP、用户名、秘钥或密码）
3. 安全组已开放 22（SSH）、5000（Flask）、8080（前端静态服务）端口
4. 实例至少 2GB 内存、10GB 存储
5. **Python 版本**：3.8 或更高（项目无版本限制，Ubuntu 24.04 默认 3.12）

---

## 部署步骤

### 第一步：服务器基础准备

登录到服务器并更新系统：

```bash
ssh ubuntu@<your-aliyun-ip>

# 更新包管理器
sudo apt update
sudo apt upgrade -y

# 安装必要依赖
sudo apt install -y python3 python3-pip python3-venv git curl

# 验证版本
python3 --version  # 应为 Python 3.8+（无版本限制，任何 3.8+ 都可）
pip3 --version
```

---

### 第二步：克隆项目

假设你有 Git 仓库（GitHub/Gitlab/自建）或直接上传本地代码：

```bash
# 方案 A：从 Git 仓库克隆
cd /opt
sudo git clone https://github.com/<your-username>/XiaozhiBlog.git
sudo chown -R ubuntu:ubuntu XiaozhiBlog

# 方案 B：从本地上传（用 scp）
# 本地执行：scp -r d:/Myself_Work/inspiration_project/XiaozhiBlog ubuntu@<ip>:/opt/

cd /opt/XiaozhiBlog
```

---

### 第三步：后端环境与依赖安装

```bash
cd /opt/XiaozhiBlog/backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate

# 升级 pip
pip install --upgrade pip

# 安装项目依赖
pip install -r requirements.txt

# 验证安装成功
pip list | grep -E "flask|sqlalchemy|jwt"
```

---

### 第四步：初始化数据库

```bash
# 仍在 backend 目录，venv 已激活
python init_db.py

# 验证数据库创建
ls -lah blog.db
```

---

### 第五步：启动后端服务

**选项 A：前台运行（用于测试）**

```bash
python app.py
# 输出应包含：
# * Running on http://0.0.0.0:5000
```

**选项 B：后台运行（用于长期部署）**

```bash
# 用 nohup 后台运行
nohup python app.py > app.log 2>&1 &

# 检查进程是否运行
ps aux | grep "python app.py"

# 查看日志
tail -f app.log
```

---

### 第六步：验证后端 API 可达性

在服务器上（或本地）测试：

```bash
# 测试登录端点
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"h_xiaozhi","password":"123456"}'

# 应返回类似：
# {"access_token":"<token>","username":"h_xiaozhi"}

# 测试获取笔记列表
curl http://localhost:5000/api/posts?page=1&per_page=5

# 应返回文章列表 JSON（首次为空数组）
```

---

### 第七步：启动前端静态服务

打开新的 SSH 会话：

```bash
cd /opt/XiaozhiBlog/frontend

# 启动 Python 简单 HTTP 服务器（用于开发/测试）
python3 -m http.server 8080

# 或后台运行：
nohup python3 -m http.server 8080 > frontend.log 2>&1 &
```

**生产环境建议**（可选）：用 Nginx 反向代理替代（见后续章节）。

---

### 第八步：前端配置调整

默认无需修改 `frontend/app.js`，`API_BASE` 会自动识别当前主机并请求 `5000` 端口（本地与云服务器都可直接使用）：

```bash
cd /opt/XiaozhiBlog/frontend

# 可选：如果你需要强制指定后端地址，再手工修改 app.js 中 API_BASE
nano app.js  # 找到 API_BASE 定义后修改并保存（Ctrl+X, Y, Enter）

# 可选示例（强制指定固定地址）
# const API_BASE = "http://<your-aliyun-ip>:5000/api";
```

---

### 第九步：防火墙 & 安全组配置

在阿里云控制台，为实例的安全组添加入站规则：

| 协议 | 端口范围 | 来源 | 说明 |
|------|--------|------|------|
| TCP | 5000 | 0.0.0.0/0 | Flask 后端 |
| TCP | 8080 | 0.0.0.0/0 | 前端静态服务 |

或在服务器上配置 UFW：

```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 5000/tcp # Flask
sudo ufw allow 8080/tcp # Frontend
sudo ufw enable
sudo ufw status
```

---

## 验收清单

按顺序执行，全部通过后即链路有效。

### ✓ 环境检查

- [ ] SSH 连接成功
- [ ] Python 3.12+ 已安装
- [ ] 虚拟环境已激活
- [ ] 依赖（Flask, SQLAlchemy, JWT, Markdown）已安装
- [ ] 数据库初始化完成（blog.db 存在）

### ✓ 后端服务检查

- [ ] Flask 启动成功，监听 5000 端口
- [ ] 日志无错误（app.log 或控制台输出）
- [ ] 本地 curl 登录端点返回 access_token

### ✓ 前端访问检查

- [ ] 前端静态服务启动，监听 8080 端口
- [ ] 公网浏览器访问 `http://<your-ip>:8080`，首页加载
- [ ] 页面控制台（F12）无明显 JavaScript 错误

### ✓ 业务流程验证

#### 1. 登录流程
- [ ] 打开首页，点击右上角"登录"按钮
- [ ] 输入用户名 `h_xiaozhi`，密码 `123456`
- [ ] 点击登录，页面显示用户名且按钮变为"登出"
- [ ] 浏览器 DevTools → Application → LocalStorage，查看 `hx_token` 和 `hx_user` 已保存

#### 2. 发帖流程
- [ ] 登录后，点击"新建笔记"按钮
- [ ] 输入标题：`测试文章 - 部署验证`
- [ ] 输入分类：`部署`
- [ ] 输入标签：`阿里云,验证`
- [ ] 输入内容：`# 部署测试\n此文章用于验证云端链路。`
- [ ] 点击"保存"，显示"发布成功"后跳转回列表
- [ ] 列表中出现新发布的文章

#### 3. 列表展示流程
- [ ] 文章列表正常显示（分类、标签、发布时间、阅读数）
- [ ] 分页功能可用（如有多页）

#### 4. 文章详情和评论流程
- [ ] 点击文章"查看"进入详情页面
- [ ] 阅读数已更新（> 0）
- [ ] Markdown 内容已渲染
- [ ] 在"评论"区输入昵称和评论内容
- [ ] 点击"发表评论"，显示"评论成功"
- [ ] 评论出现在列表中

#### 5. 编辑流程
- [ ] 回到列表，点击文章"编辑"
- [ ] 修改标题：`测试文章 - 部署验证 [已编辑]`
- [ ] 点击"保存"，显示"更新成功"
- [ ] 列表中标题已更新

#### 6. 搜索与筛选流程
- [ ] 在首页搜索框输入 `部署`，点击"搜索"或 Enter
- [ ] 搜索结果仅显示包含"部署"的文章

#### 7. 主题切换流程
- [ ] 登出或在用户菜单中点击"切换深色"
- [ ] 页面颜色方案改变（深色模式）
- [ ] 再点击"切换浅色"，页面恢复亮色模式

#### 8. 数据持久化验证
- [ ] 重启后端服务
  ```bash
  # 停止进程（如果用 nohup）
  pkill -f "python app.py"
  # 重启
  nohup python app.py > app.log 2>&1 &
  ```
- [ ] 刷新前端页面，文章和评论仍然存在

---

## 故障排查

### 后端无法启动

```bash
# 1. 检查依赖
source venv/bin/activate
pip list

# 2. 检查前面的错误信息
python app.py  # 前台运行看日志

# 3. 检查数据库权限
ls -la blog.db
# 应为 ubuntu:ubuntu，权限 644 以上

# 4. 检查端口占用
sudo lsof -i :5000
# 若有进程占用，kill 后重启
```

### 前端无法连接后端 API

```bash
# 1. 检查 app.js 中的 API_BASE 是否正确
grep "API_BASE" frontend/app.js

# 2. 检查后端是否真的在运行
curl http://localhost:5000/api/posts

# 3. 检查防火墙
sudo ufw status
# 5000 端口应允许

# 4. 检查安全组
# 在阿里云控制台确认 5000 端口已开放
```

### 数据库初始化失败

```bash
# 1. 删除旧数据库重试
rm -f backend/blog.db

# 2. 虚拟环境激活后重新初始化
cd backend
source venv/bin/activate
python init_db.py

# 3. 检查权限
ls -la .
# 当前目录应可写
```

---

## 后续优化（可选）

1. **使用 Nginx 反向代理**
   - 统一使用端口 80（HTTP）
   - 类似配置见下方示例

2. **使用 Systemd 服务**
   - 让 Flask 和前端自动启动
   - 提高可靠性

3. **HTTPS & 域名**
   - 申请 SSL 证书
   - 绑定域名

4. **监控与日志**
   - 集成日志收集（ELK 或阿里云日志服务）
   - 设置告警

5. **代码更新流程**
   - 建立 CI/CD 或手工更新脚本

---

## 快速参考

### 启动所有服务

```bash
# 会话 1：后端
cd /opt/XiaozhiBlog/backend
source venv/bin/activate
nohup python app.py > app.log 2>&1 &

# 会话 2：前端
cd /opt/XiaozhiBlog/frontend
nohup python3 -m http.server 8080 > frontend.log 2>&1 &

# 验证
ps aux | grep python
```

### 停止所有服务

```bash
pkill -f "python app.py"
pkill -f "http.server"
```

### 查看日志

```bash
tail -f /opt/XiaozhiBlog/backend/app.log
tail -f /opt/XiaozhiBlog/frontend/frontend.log
```

### 数据库备份

```bash
cp /opt/XiaozhiBlog/backend/blog.db /opt/XiaozhiBlog/backend/blog.db.backup
```

---

## 完成后

验收清单全部勾选后，你已成功：
1. ✅ 在阿里云部署了完整的 Vue + Flask 博客系统
2. ✅ 验证了登录、发帖、评论、搜索等核心业务流程
3. ✅ 确认数据库持久化可用
4. ✅ 确保公网用户可访问

下一步可考虑：
- 自动化更新流程
- 生产级安全加固
- 性能优化与监控
