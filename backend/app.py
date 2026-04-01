import os
import bcrypt
from datetime import timedelta
from sqlalchemy import text
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, verify_jwt_in_request
from flask_limiter import Limiter
from flask_sqlalchemy import SQLAlchemy
from markdown import markdown
from models import db, Post, Comment

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "blog.db")

app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_FILE}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-insecure-key-do-not-use-in-production")
# Development-friendly token lifetime to reduce re-login interruptions.
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

CORS(app, supports_credentials=True)
jwt = JWTManager(app)
ALLOWED_POST_STATUS = {"draft", "published", "archived"}


def json_error(message, status_code):
    return jsonify({"msg": message}), status_code


def is_api_request():
    return request.path.startswith("/api/")


def get_real_ip():
    # Use X-Forwarded-For when served behind Nginx; fallback to direct remote addr.
    forwarded_for = request.headers.get("X-Forwarded-For", "")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.remote_addr or "unknown"


limiter = Limiter(
    key_func=get_real_ip,
    app=app,
    default_limits=[],
)

db.init_app(app)

# 管理员用户名，默认 h_xiaozhi，可通过环境变量覆盖
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "h_xiaozhi")
# 密码哈希由 setup.sh 生成后注入环境变量
# 本地生成命令: python3 -c "import bcrypt; print(bcrypt.hashpw(b'your_password', bcrypt.gensalt()).decode())"
ADMIN_PASSWORD_HASH = os.environ.get("ADMIN_PASSWORD_HASH", "").encode()

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username", "")
    password = data.get("password", "")
    if not ADMIN_PASSWORD_HASH:
        return json_error("服务器未配置管理员密码，请联系管理员", 500)
    if username == ADMIN_USERNAME and bcrypt.checkpw(password.encode(), ADMIN_PASSWORD_HASH):
        token = create_access_token(identity=username)
        return jsonify({"access_token": token, "username": username})
    return json_error("用户名或密码错误", 401)


@app.errorhandler(429)
def handle_rate_limit(_error):
    if is_api_request():
        return json_error("评论过于频繁，请稍后再试", 429)
    return _error


@app.errorhandler(HTTPException)
def handle_http_exception(error):
    if not is_api_request():
        return error

    default_messages = {
        400: "请求参数无效",
        401: "当前操作需要登录",
        403: "没有权限执行该操作",
        404: "请求的内容不存在",
        405: "请求方法不被允许",
    }
    return json_error(default_messages.get(error.code, error.description), error.code)


@jwt.unauthorized_loader
def handle_missing_token(_reason):
    return json_error("当前操作需要登录", 401)


@jwt.invalid_token_loader
def handle_invalid_token(_reason):
    return json_error("登录状态无效，请重新登录", 401)


@jwt.expired_token_loader
def handle_expired_token(_jwt_header, _jwt_payload):
    return json_error("登录已过期，请重新登录", 401)


@jwt.revoked_token_loader
def handle_revoked_token(_jwt_header, _jwt_payload):
    return json_error("登录状态已失效，请重新登录", 401)


@jwt.needs_fresh_token_loader
def handle_non_fresh_token(_jwt_header, _jwt_payload):
    return json_error("请重新登录后再继续", 401)


@jwt.user_lookup_error_loader
def handle_user_lookup_error(_jwt_header, _jwt_payload):
    return json_error("登录状态无效，请重新登录", 401)


def parse_positive_int(raw_value, default_value, minimum=1, maximum=None):
    try:
        value = int(raw_value)
    except (TypeError, ValueError):
        return default_value

    if value < minimum:
        return minimum
    if maximum is not None and value > maximum:
        return maximum
    return value


def normalize_post_status(raw_status, default_value="published"):
    value = (raw_status or default_value).strip().lower()
    if value not in ALLOWED_POST_STATUS:
        return None
    return value


def ensure_post_status_column():
    # Lightweight SQLite schema patch to keep old local DB files compatible.
    with db.engine.begin() as conn:
        columns = [row[1] for row in conn.execute(text("PRAGMA table_info(posts)")).fetchall()]
        if "status" not in columns:
            conn.execute(text("ALTER TABLE posts ADD COLUMN status VARCHAR(16) NOT NULL DEFAULT 'published'"))


def init_db():
    with app.app_context():
        db.create_all()
        ensure_post_status_column()

with app.app_context():
    db.create_all()
    ensure_post_status_column()


@app.route("/api", methods=["GET"])
def api_root():
    return jsonify(
        {
            "service": "hxz-blog",
            "version": "v1.6.0",
            "status": "ok",
            "endpoints": {
                "login": "/api/auth/login",
                "posts": "/api/posts",
            },
        }
    )


@app.route("/api/posts", methods=["GET"])
def list_posts():
    verify_jwt_in_request(optional=True)
    current_user = get_jwt_identity()
    keyword = request.args.get("query", "").strip()
    tag = request.args.get("tag", "").strip()
    category = request.args.get("category", "").strip()
    status_filter = request.args.get("status", "").strip().lower()
    sort = request.args.get("sort", "default").strip().lower()
    page = parse_positive_int(request.args.get("page", 1), 1)
    per_page = parse_positive_int(request.args.get("per_page", 10), 10, maximum=20)

    q = Post.query
    if keyword:
        ilike = f"%{keyword}%"
        q = q.filter((Post.title.ilike(ilike)) | (Post.content.ilike(ilike)))
    if tag:
        q = q.filter(Post.tags.ilike(f"%{tag}%"))
    if category:
        q = q.filter(Post.category.ilike(f"%{category}%"))
    if not current_user:
        q = q.filter(Post.status == "published")
    elif status_filter and status_filter != "all":
        normalized_status = normalize_post_status(status_filter, default_value="")
        if not normalized_status:
            return json_error("文章状态参数无效", 400)
        q = q.filter(Post.status == normalized_status)

    if sort == "views":
        t = q.order_by(Post.view_count.desc(), Post.created_at.desc())
    elif sort == "oldest":
        t = q.order_by(Post.created_at.asc())
    else:
        t = q.order_by(Post.is_pinned.desc(), Post.created_at.desc())

    pagination = t.paginate(page=page, per_page=per_page, error_out=False)
    result = {
        "items": [p.to_dict() for p in pagination.items],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }
    return jsonify(result)

@app.route("/api/posts/<int:post_id>", methods=["GET"])
def get_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return json_error("文章不存在或已被删除", 404)
    if post.status != "published":
        verify_jwt_in_request(optional=True)
        if not get_jwt_identity():
            return json_error("请求的内容不存在", 404)
    post.view_count = post.view_count + 1
    db.session.commit()
    data = post.to_dict()
    data["html"] = markdown(data["content"], extensions=["fenced_code"])
    return jsonify(data)


@app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    post = Post.query.get(post_id)
    if not post:
        return json_error("文章不存在或已被删除", 404)
    comments = [c.to_dict() for c in Comment.query.filter_by(post_id=post.id).order_by(Comment.created_at.desc()).all()]
    return jsonify(comments)


@app.route("/api/posts/<int:post_id>/comments/<int:comment_id>", methods=["DELETE"])
@jwt_required()
def delete_comment(post_id, comment_id):
    post = Post.query.get(post_id)
    if not post:
        return json_error("文章不存在或已被删除", 404)
    comment = Comment.query.filter_by(id=comment_id, post_id=post_id).first()
    if not comment:
        return json_error("评论不存在或已被删除", 404)
    db.session.delete(comment)
    db.session.commit()
    return jsonify({"msg": "删除成功"})

@app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
@limiter.limit("100 per hour")
@limiter.limit("5 per minute")
def create_comment(post_id):
    post = Post.query.get(post_id)
    if not post:
        return json_error("文章不存在或已被删除", 404)
    data = request.get_json() or {}
    author = (data.get("author") or "匿名").strip()
    content = (data.get("content") or "").strip()
    if not content:
        return json_error("评论内容不能为空", 400)
    comment = Comment(post_id=post.id, author=author, content=content)
    db.session.add(comment)
    db.session.commit()
    return jsonify(comment.to_dict()), 201

@app.route("/api/posts", methods=["POST"])
@jwt_required()
def create_post():
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    category = data.get("category", "").strip() or None
    tags = ",".join([t.strip() for t in (data.get("tags", "") or "").split(",") if t.strip()])
    is_pinned = bool(data.get("is_pinned", False))
    status = normalize_post_status(data.get("status"), default_value="published")
    if not title or not content:
        return json_error("标题和内容不能为空", 400)
    if not status:
        return json_error("文章状态无效", 400)
    duplicate = Post.query.filter_by(title=title).first()
    if duplicate:
        return json_error("标题已存在，请更换标题", 400)
    post = Post(title=title, content=content, category=category, tags=tags, is_pinned=is_pinned, status=status)
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201

@app.route("/api/posts/<int:post_id>", methods=["PUT"])
@jwt_required()
def update_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return json_error("文章不存在或已被删除", 404)
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    category = data.get("category", "").strip() or None
    tags = ",".join([t.strip() for t in (data.get("tags", "") or "").split(",") if t.strip()])
    is_pinned = bool(data.get("is_pinned", False))
    status = normalize_post_status(data.get("status"), default_value=post.status or "published")
    if not title or not content:
        return json_error("标题和内容不能为空", 400)
    if not status:
        return json_error("文章状态无效", 400)
    duplicate = Post.query.filter(Post.id != post.id, Post.title == title).first()
    if duplicate:
        return json_error("标题已存在，请更换标题", 400)
    post.title = title
    post.content = content
    post.category = category
    post.tags = tags
    post.is_pinned = is_pinned
    post.status = status
    db.session.commit()
    return jsonify(post.to_dict())

@app.route("/api/posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    post = Post.query.get(post_id)
    if not post:
        return json_error("文章不存在或已被删除", 404)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"msg": "删除成功"})

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    return app.send_static_file("index.html")

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
