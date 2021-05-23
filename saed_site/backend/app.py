import os
import imghdr
import sqlite3
from enum import IntEnum
from pathlib import Path
from functools import wraps
from itertools import islice
from contextlib import closing, ExitStack

import flask
from flask import Flask, Response, request, redirect, session, jsonify
from flask_cors import CORS
from flask_session import Session

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError


root_dir = Path(__file__).parent

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SESSION_TYPE'] = 'filesystem'
CORS(app, supports_credentials=True)
Session(app)

API_PATH = "/saed/api"
MAIN_DB = root_dir/"db.sqlite3"
IMG_DB = root_dir/"img-db.sqlite3"
SUPPORTED_IMAGE_TYPES = {
    "png": "image/png",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp"
}

user_info_columns = "email", "name", "given_name", "family_name", "musician", "instrument_supplier", "club_owner"

KB = 1024
MB = KB**2
GB = KB**3

with open("oauth_data") as f:
    google_client_id, google_client_secret = map(str.strip, f.readline().split(":"))
    google_scopes = [l.strip() for l in f]

AccountType = IntEnum("AccountType", "GOOGLE") #FACEBOOK...


def qmarks(n):
    return ", ".join(("?",) * n)


def updlist(columns):
    return ", ".join(f"{c} = ?" for c in columns)


def api_error(code, msg):
    return {"error": msg}, code


def connect(**dbs):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            with ExitStack() as stack:
                for arg_name, db_path in dbs.items():
                    conn = sqlite3.connect(db_path)
                    kwargs[arg_name] = conn
                    stack.enter_context(closing(conn))
                    stack.enter_context(conn)
                return f(*args, **kwargs)
        return wrapper
    return decorator


def with_session(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if "id" not in session:
            return api_error(401, "Unauthorized")
        return f(*args, **kwargs)
    return wrapper


def get_user_id(db, account_type, email):
    cur = db.cursor()
    cur.execute("SELECT id FROM users WHERE account_type = ? AND email = ?", (account_type, email))
    record = cur.fetchone()
    if record is None:
        raise KeyError
    return record[0]


def ensure_user_exists(db, img_db, account_type, email, name, given_name=None, family_name=None, picture_url=None):
    try:
        return get_user_id(db, account_type, email)
    except KeyError:
        cur = db.cursor()
        cur.execute(f"INSERT INTO users(account_type, email, name, given_name, family_name, musician, instrument_supplier, club_owner) VALUES ({qmarks(8)})",
                (account_type, email, name, given_name, family_name, False, False, False))
        user_id = get_user_id(db, account_type, email)
        if picture_url is not None:
            cur = img_db.cursor()
            cur.execute(f"INSERT INTO profile_pictures(user_id, external_url) VALUES (?, ?)", (user_id, picture_url))
        return user_id


@app.route(f"{API_PATH}/configure_session", methods=["POST"])
@connect(db=MAIN_DB, img_db=IMG_DB)
def configure_session(db, img_db):
    try:
        token = request.json["auth_token"]
    except KeyError:
        return api_error(400, "Oauth2 token not provided")

    credentials = Credentials(token, client_id=google_client_id, client_secret=google_client_secret, scopes=google_scopes)
    oauth2 = build("oauth2", "v2", credentials=credentials)

    try:
        userinfo = oauth2.userinfo().get().execute()
    except RefreshError:
        return api_error(401, "Token scaduto")

    session["id"] = ensure_user_exists(
            db,
            img_db,
            AccountType.GOOGLE,
            userinfo["email"],
            userinfo["name"],
            userinfo["given_name"],
            userinfo["family_name"],
            userinfo["picture"])

    return {}


@app.route(f"{API_PATH}/user_info")
@with_session
@connect(db=MAIN_DB)
def get_user_info(db):
    cur = db.cursor()
    cur.execute(f"SELECT {','.join(user_info_columns)} FROM users WHERE id = ?", (session["id"],))
    result = cur.fetchone()
    return dict(zip(user_info_columns, result))


@app.route(f"{API_PATH}/user_info", methods=["PUT"])
@with_session
@connect(db=MAIN_DB)
def set_user_info(db):
    cur = db.cursor()
    try:
        cur.execute(
                f"UPDATE users SET {updlist(user_info_columns)} WHERE id = ?",
                (*(request.json[c] for c in user_info_columns), session["id"]))
    except KeyError:
        return api_error(400, "Bad request")
    return {}


def _get_user_image(img_db, user_id):
    cur = img_db.cursor()
    cur.execute("SELECT image, mime FROM profile_pictures WHERE user_id = ? AND image IS NOT NULL", (user_id,))
    result = cur.fetchone()
    if result is not None:
        image, mime = result
        return Response(image, mimetype=mime)
    cur.execute("SELECT external_url FROM profile_pictures WHERE user_id = ? AND external_url IS NOT NULL", (user_id,))
    result = cur.fetchone()
    if result is not None:
        (external_url,) = result
        return redirect(external_url)
    return api_error(404, "Not found")


@app.route(f"{API_PATH}/user_image")
@with_session
@connect(img_db=IMG_DB)
def get_user_image(img_db):
    return _get_user_image(img_db, session["id"])


@app.route(f"{API_PATH}/user_image/<int:user_id>")
@connect(img_db=IMG_DB)
def get_any_user_image(img_db, user_id):
    return _get_user_image(img_db, user_id)


@app.route(f"{API_PATH}/user_image", methods=["PUT"])
@with_session
@connect(db=MAIN_DB, img_db=IMG_DB)
def set_user_image(db, img_db):
    if request.content_length > 2*MB:
        return api_error(413, "Payload too large (>2MB)")
    new_image = request.get_data(cache=False)
    try:
        mime = SUPPORTED_IMAGE_TYPES[imghdr.what(None, new_image)]
    except KeyError:
        return api_error(415, "Unsupported image type")
    cur = img_db.cursor()
    cur.execute("SELECT count(*) FROM profile_pictures WHERE user_id = ?", (session["id"],))
    (count,) = cur.fetchone()
    if count:
        cur.execute("UPDATE profile_pictures SET external_url = NULL, image = ?, mime = ? WHERE user_id = ?", (new_image, mime, session["id"]))
    else:
        cur.execute("INSERT INTO profile_pictures(user_id, image, mime) VALUES (?, ?, ?)", (session["id"], new_image, mime))
    return {}


def create_notification(db, user_id, message, action_url=None, picture_url=None):
    cur = db.cursor()
    cur.execute(f"INSERT INTO notifications(user_id, message, action_url, picture_url) VALUES ({qmarks(4)})", (user_id, message, action_url, picture_url))


@app.route(f"{API_PATH}/notifications")
@with_session
@connect(db=MAIN_DB)
def get_notifications(db):
    earlier_than = request.args.get("earlier_than", None)
    after = request.args.get("after", None)
    query = ["SELECT id, message, action_url, picture_url FROM notifications WHERE user_id = ?"]
    args = [session["id"]]
    if earlier_than is not None:
        query.append("AND id < ?")
        try:
            args.append(int(earlier_than))
        except TypeError:
            return api_error(400, "'earlier_than' should be an integer")
    if after is not None:
        query.append("AND id > ?")
        try:
            args.append(int(after))
        except TypeError:
            return api_error(400, "'after' should be an integer")
    query.append("ORDER BY id DESC")
    cur = db.cursor()
    cur.execute(" ".join(query), tuple(args))
    return jsonify([dict(zip(("id", "message", "action_url", "picture_url"), row)) for row in islice(cur, 10)])


if __name__ == "__main__":
    app.run()
