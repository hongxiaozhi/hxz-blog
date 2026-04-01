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
- API：`http://127.0.0.1:5001/api`

## 当前版本状态

当前活跃版本为 `v1.5`，重点是统一全站交互反馈、状态文案与基础可信提示。

目前已经落地的本版本能力包括：

- 提示条支持 loading / 成功 / 失败 / 信息四类统一反馈
- 列表页、详情页、评论区与编辑页的空状态文案更一致
- 页面补充了轻量的使用说明与可信提示
- 页面头部与主内容区继续显示当前运行版本，便于验收与核对部署结果

上一版本 `v1.4` 已完成的能力包括：

- 编辑页双栏 / 单栏切换
- 快捷保存、未保存变更提示与离开保护
- 编辑页移动端适配与版本信息展示

## 开发入口

- 后端入口：`backend/app.py`
- 数据模型：`backend/models.py`
- 初始化脚本：`backend/init_db.py`
- 前端入口：`frontend/index.html`

如需初始化数据库，可在容器或本地环境执行：

```bash
python backend/init_db.py
```

## 验证方式

优先使用项目既有的 Docker 路径进行验证：

```bash
docker compose build hxz-blog
docker compose up -d hxz-blog
docker compose ps hxz-blog
```

说明：

- 当前仓库以根目录统一编排为准，不再维护子项目独立部署链路
- 如果本机未安装可用的 `python` / `node` 运行时，可直接使用 Docker 完成构建与启动验证

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

## API Quick Check

- `GET /api` returns service status and endpoint index.
- `GET /api/posts` returns posts list data.
