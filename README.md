# h_xiaozhi 个人博客

这是个人技术与感受记录博客项目，核心目标：

- 学习笔记归档
- 个人感悟输出
- 简洁易用的内容管理

## 快速启动（Vue + Flask）

### 1. 创建 Python 虚拟环境并安装依赖

```bash
cd d:/Myself_Work/inspiration_project/XiaozhiBlog/backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 2. 初始化数据库

```bash
python init_db.py
```

### 3. 启动 Flask 后端

```bash
python app.py
```

默认：`http://localhost:5000`

### 4. 启动前端（可用本地静态服务）

```bash
cd d:/Myself_Work/inspiration_project/XiaozhiBlog/frontend
python -m http.server 8080
```

然后访问：`http://localhost:8080`

> 另：也可直接用 `Flask` 静态渲染访问 `http://localhost:5000`，`app.py` 已配置静态文件与前端路由。

## 目录结构

- `backend/` - Flask 后端项目，含 API、JWT、SQLite
  - `app.py`
  - `models.py`
  - `init_db.py`
  - `requirements.txt`
  - `blog.db`（运行后生成）
- `frontend/` - Vue + CDN 前端静态页面
  - `index.html`
  - `style.css`
  - `app.js`

## C4 模型（系统架构）

### 1. Context（系统边界）

- 系统名：`h_xiaozhi 个人博客`
- 用户：
  - 博主：`h_xiaozhi`（CRUD、发布、管理）
  - 访客：浏览、查看文章
- 目标：文章管理、Markdown 渲染、用户验证、轻量部署
- 外部系统：浏览器、部署平台（阿里云 ECS/Serverless）

## 跨平台开发：统一启动脚本

### 1) macOS / Linux

```bash
bash setup.sh
```

### 2) Windows

```powershell
powershell -ExecutionPolicy Bypass .\setup.ps1
```

### 3) 启动服务

- 后端：
```bash
cd backend
# macOS/Linux
source venv/bin/activate
# Windows（PowerShell）
# .\venv\Scripts\Activate.ps1
python app.py
```
- 前端：
```bash
cd frontend
python -m http.server 8080
```

访问：`http://localhost:8080` 或 `http://localhost:5000`

### 2. Container（容器）

- 前端容器：`frontend`（Vue 3 + Axios + marked）
  - 功能：UI、登录、文章列表、编辑预览、请求后端 API
- 后端容器：`backend`（Flask + Flask-JWT + SQLAlchemy）
  - 功能：用户认证、文章 API、Markdown 转 HTML、静态文件服务
- 数据库容器：`SQLite`（本地文件 `blog.db`）

### 3. Component（组件）

- 前端组件
  - `App`（状态管理：token、帖子列表、表单、当前模式）
  - `API` 调用：封装请求函数（请求头含 JWT）
  - `Markdown 预览`：`marked.parse()`
- 后端组件
  - `models.Post`（持久化 schema）
  - 认证 `POST /api/auth/login`
  - CRUD API `GET/POST/PUT/DELETE /api/posts`
  - `GET /api/posts/{id}` 渲染 html

### 4. Code（关键实现）

- `backend/app.py`：
  - `JWT_SECRET_KEY`（生产环境换成环境变量）
  - `@jwt_required()` 保护写接口
  - `markdown(... extensions=["fenced_code","codehilite"])`
- `frontend/app.js`：
  - `localStorage` token 持久化
  - `mode` 控制：`list/detail/edit`
  - 登录/登出/CRUD 逻辑

### 5. PlantUML（可视化 C4 图，推荐用工具渲染）

```plantuml
@startuml
!define C4P https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master
!includeurl C4P/C4_Context.puml
!includeurl C4P/C4_Container.puml
Person(user, "访客 / 博主", "使用博客系统")
System(blog, "h_xiaozhi 个人博客", "博客管理与浏览")
System_Ext(browser, "浏览器", "用户使用界面")
System_Ext(aliyun, "阿里云", "部署平台")
Rel(user, browser, "通过 WEB 访问")
Rel(browser, blog, "前端请求")

Container(frontend, "Vue 前端", "Vue 3 + Axios + marked", "页面呈现与交互")
Container(backend, "Flask 后端", "Flask + JWT + REST API", "业务与 API")
ContainerDb(db, "SQLite", "SQLite", "数据存储")
Rel(browser, frontend, "HTTP")
Rel(frontend, backend, "REST API")
Rel(backend, db, "SQLAlchemy")
Rel(backend, aliyun, "部署")
@enduml
```

---

> 如果你更喜欢单独文档，我也可以把上述 C4 内容复制到 `C4.md`，保持 README 简洁。

## 项目路线图

- 阶段计划文档： [docs/ROADMAP.md](docs/ROADMAP.md)
- 后续功能迭代默认以该文档为准（包含 UI iOS 风格目标、功能分期、验收标准与优先级）。