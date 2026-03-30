#!/usr/bin/env bash
set -euo pipefail

# Run this from the hxz-blog directory (where docker-compose.yml lives):
# sudo ./deploy/init_db_all.sh

echo "Ensuring backend directories exist..."
mkdir -p ./backend
mkdir -p ../hxz-fortune-telling/backend

echo "Initializing hxz-blog database..."
docker-compose run --rm hxz-blog python init_db.py

echo "Initializing hxz-fortune database..."
docker-compose run --rm hxz-fortune python init_db.py

echo "Initializations complete."
