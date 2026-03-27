import os
from datetime import timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from markdown import markdown
from models import db, Post, Comment

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "blog.db")

app = Flask(__name__, static_folder="../frontend", static_url_path="")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_FILE}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "change-this-secret-before-production"
# Development-friendly token lifetime to reduce re-login interruptions.
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

CORS(app, supports_credentials=True)
jwt = JWTManager(app)

db.init_app(app)

VALID_USER = {
    "username": "h_xiaozhi",
    "password": "123456",
}

@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = data.get("username")
    password = data.get("password")
    if username == VALID_USER["username"] and password == VALID_USER["password"]:
        token = create_access_token(identity=username)
        return jsonify({"access_token": token, "username": username})
    return jsonify({"msg": "用户名或密码错误"}), 401

@app.route("/api/posts", methods=["GET"])
def list_posts():
    keyword = request.args.get("query", "").strip()
    tag = request.args.get("tag", "").strip()
    category = request.args.get("category", "").strip()
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 10))

    q = Post.query
    if keyword:
        ilike = f"%{keyword}%"
        q = q.filter((Post.title.ilike(ilike)) | (Post.content.ilike(ilike)))
    if tag:
        q = q.filter(Post.tags.ilike(f"%{tag}%"))
    if category:
        q = q.filter(Post.category.ilike(f"%{category}%"))

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
    post = Post.query.get_or_404(post_id)
    post.view_count = post.view_count + 1
    db.session.commit()
    data = post.to_dict()
    data["html"] = markdown(data["content"], extensions=["fenced_code", "codehilite"])
    return jsonify(data)


@app.route("/api/posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    post = Post.query.get_or_404(post_id)
    comments = [c.to_dict() for c in Comment.query.filter_by(post_id=post.id).order_by(Comment.created_at.desc()).all()]
    return jsonify(comments)


@app.route("/api/posts/<int:post_id>/comments", methods=["POST"])
def create_comment(post_id):
    post = Post.query.get_or_404(post_id)
    data = request.get_json() or {}
    author = (data.get("author") or "匿名").strip()
    content = (data.get("content") or "").strip()
    if not content:
        return jsonify({"msg": "评论内容不能为空"}), 400
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
    if not title or not content:
        return jsonify({"msg": "标题和内容不能为空"}), 400
    duplicate = Post.query.filter_by(title=title).first()
    if duplicate:
        return jsonify({"msg": "标题已存在，请更换标题"}), 400
    post = Post(title=title, content=content, category=category, tags=tags, is_pinned=is_pinned)
    db.session.add(post)
    db.session.commit()
    return jsonify(post.to_dict()), 201

@app.route("/api/posts/<int:post_id>", methods=["PUT"])
@jwt_required()
def update_post(post_id):
    post = Post.query.get_or_404(post_id)
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    category = data.get("category", "").strip() or None
    tags = ",".join([t.strip() for t in (data.get("tags", "") or "").split(",") if t.strip()])
    is_pinned = bool(data.get("is_pinned", False))
    if not title or not content:
        return jsonify({"msg": "标题和内容不能为空"}), 400
    duplicate = Post.query.filter(Post.id != post.id, Post.title == title).first()
    if duplicate:
        return jsonify({"msg": "标题已存在，请更换标题"}), 400
    post.title = title
    post.content = content
    post.category = category
    post.tags = tags
    post.is_pinned = is_pinned
    db.session.commit()
    return jsonify(post.to_dict())

@app.route("/api/posts/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"msg": "删除成功"})

def init_db():
    with app.app_context():
        db.create_all()

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return app.send_static_file(path)
    return app.send_static_file("index.html")

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
