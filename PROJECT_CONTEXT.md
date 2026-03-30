# Project Context

最后更新：2026-03-30

## 项目定位

- 这是一个个人博客网站
- 目标用户是博主本人和普通访客
- 当前阶段是 `v1.x`，优先把写作、阅读、评论、部署链路稳定下来

## 当前技术结构

- 前端：Vue 3 CDN 单页应用
- 后端：Flask + JWT + SQLAlchemy
- 数据库：SQLite
- 部署方式：根目录统一 `docker compose` 编排，线上由 Nginx 反向代理到容器端口

## 当前运行方式

- 本地启动：在工作区根目录执行 `docker compose up -d --build hxz-blog`
- 本地访问：`http://127.0.0.1:5001`
- 线上部署：工作区根目录统一更新后重建对应容器
- 根目录统一编排入口：`../docker-compose.yml`
- 数据库文件默认位于：`backend/blog.db`
- 如仍使用 Nginx，建议代理到：`127.0.0.1:5001`

## 关键目录

- `backend/`
- `frontend/`
- `deploy/site-template/Dockerfile`
- `docs/`

## 当前约束

- 暂不做多用户系统
- 暂不迁移到 PostgreSQL
- 当前仍以单管理员内容管理为主
- 评论开放但仍是轻量管理模型

## 近期重点

- 当前版本重点：`v1.3` 体验优化与移动端适配
- 下一个版本重点：`v1.4` 编辑效率和编辑页深度适配
