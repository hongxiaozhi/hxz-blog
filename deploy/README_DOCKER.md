# hxz-blog — Docker + Traefik deployment notes

Quick summary
- `docker-compose.yml` (Traefik + `hxz-blog` service) is at the project root: configure the domain and email before first run.
- `deploy/site-template/Dockerfile` builds an image that contains both `backend` and `frontend` and runs Gunicorn on port `5000`.

Server prerequisites
- Docker & Docker Compose installed on the server.
- Repository is cloned to `/opt/hxz-blog` on the server.

Environment / secrets
- Create a `.env` file (in the `hxz-blog` folder) or export environment variables before `docker-compose`:

```
JWT_SECRET_KEY=your_random_secret
ADMIN_PASSWORD_HASH=<bcrypt-hash-of-admin-password>
```

Quick start (on the server)
```
cd /opt/hxz-blog
# (optional) edit docker-compose.yml to set your domain and Traefik email
docker-compose up -d --build
```

Notes
- Traefik will request certificates for domains defined in the service labels. Change `blog.kiosk.pub` to your domain in `docker-compose.yml`.
- Persist `backend/blog.db` if you want SQLite data to survive container recreation (compose file includes an example volume).
- The provided GitHub Actions workflow expects the server to be reachable by SSH and the repo to be at `/opt/hxz-blog`.
