from app import db, app

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        print("SQLite 数据库已创建: backend/blog.db")
