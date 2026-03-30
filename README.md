# HXZ Blog

这是 `HXZ` 工作区中的博客项目。

## 项目结构

- `backend/`：Flask API 与数据模型
- `frontend/`：博客前端页面
- `deploy/site-template/Dockerfile`：容器镜像模板
- `docs/`：路线图、版本计划、变更记录

## 运行方式

当前推荐使用工作区根目录的统一编排，在根目录执行：

```bash
docker compose up -d --build hxz-blog
```

本地默认访问地址：

- 页面：`http://127.0.0.1:5001`

## 开发入口

- 后端入口：`backend/app.py`
- 数据模型：`backend/models.py`
- 初始化脚本：`backend/init_db.py`
- 前端入口：`frontend/index.html`

如需初始化数据库，可在容器或本地环境执行：

```bash
python backend/init_db.py
```

## 文档分层

- `README.md`：如何运行项目
- `PROJECT_CONTEXT.md`：项目现状与技术背景
- `docs/ROADMAP.md`：未来版本路线
- `docs/releases/`：当前版本执行计划
- `docs/CHANGELOG.md`：实际发布记录

## 文档规范

- 所有 Markdown 文档统一使用 `UTF-8`
- 行尾统一使用 `LF`
- 不再额外维护独立部署说明、旧计划总表或文档风格说明文件

## 部署约定

当前仓库结构已经统一到根目录 `docker-compose.yml`。

不再推荐：

- 子项目内单独维护启动脚本
- `systemd + gunicorn` 旧模板
- 在项目根目录保留与 `frontend/` 重复的静态页面副本

根目录统一入口见：

[`../docker-compose.yml`](../docker-compose.yml)
