import os
import imghdr
import sqlite3
from enum import IntEnum
from functools import wraps
from itertools import islice
from contextlib import closing

import flask
from flask import Flask, Response, request, session, jsonify
from flask_cors import CORS
from flask_session import Session

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError


app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SESSION_TYPE'] = 'filesystem'
CORS(app, supports_credentials=True)
Session(app)

API_PATH = "/saed/api"
MAIN_DB = "db.sqlite3"
IMG_DB = "img-db.sqlite3"
SUPPORTED_IMAGE_TYPES = {
    "png": "image/png",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp"
}

KB = 1024
MB = KB**2
GB = KB**3

with open("oauth_data") as f:
    google_client_id, google_client_secret = map(str.strip, f.readline().split(":"))
    google_scopes = [l.strip() for l in f]

AccountType = IntEnum("AccountType", "GOOGLE") #FACEBOOK...


def qmarks(n):
    return ", ".join(("?",) * n)


def api_error(code, msg):
    return {"error": msg}, code


def connect(arg_name, db_path):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            conn = sqlite3.connect(db_path)
            kwargs[arg_name] = conn
            with closing(conn):
                with conn:
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


def ensure_user_exists(db, account_type, email, name, given_name=None, family_name=None, picture_url=None):
    try:
        return get_user_id(db, account_type, email)
    except KeyError:
        cur = db.cursor()
        cur.execute(f"INSERT INTO users(account_type, email, name, given_name, family_name, picture_url, musician, instrument_supplier, club_owner) VALUES ({qmarks(9)})",
                (account_type, email, name, given_name, family_name, picture_url, False, False, False))
        return get_user_id(db, account_type, email)


@app.route(f"{API_PATH}/configure_session", methods=["POST"])
@connect("db", MAIN_DB)
def configure_session(db):
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
            AccountType.GOOGLE,
            userinfo["email"],
            userinfo["name"],
            userinfo["given_name"],
            userinfo["family_name"],
            userinfo["picture"])

    return {}


@app.route(f"{API_PATH}/user_info")
@with_session
@connect("db", MAIN_DB)
def get_user_info(db):
    cur = db.cursor()
    columns = ("email", "name", "given_name", "family_name", "picture_url", "musician", "instrument_supplier", "club_owner")
    cur.execute(f"SELECT {','.join(columns)} FROM users WHERE id = ?", (session["id"],))
    result = cur.fetchone()
    return dict(zip(columns, result))


@app.route(f"{API_PATH}/user_image")
@with_session
@connect("img_db", IMG_DB)
def get_user_image(img_db):
    cur = img_db.cursor()
    cur.execute("SELECT image, mime FROM images WHERE user_id = ?", (session["id"],))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "User image is not stored here")
    image, mime = result
    return Response(image, mimetype=mime)


@app.route(f"{API_PATH}/user_image/<int:user_id>")
@connect("img_db", IMG_DB)
def get_any_user_image(user_id, img_db):
    cur = img_db.cursor()
    cur.execute("SELECT image, mime FROM images WHERE user_id = ?", (user_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "User image is not stored here")
    image, mime = result
    return Response(image, mimetype=mime)


@app.route(f"{API_PATH}/user_image", methods=["PUT"])
@with_session
@connect("db", MAIN_DB)
@connect("img_db", IMG_DB)
def set_user_image(db, img_db):
    if request.content_length > 2*MB:
        return api_error(413, "Payload too large (>2MB)")
    new_image = request.get_data(cache=False)
    try:
        mime = SUPPORTED_IMAGE_TYPES[imghdr.what(None, new_image)]
    except KeyError:
        return api_error(415, "Unsupported image type")
    cur = img_db.cursor()
    cur.execute("SELECT count(*) FROM images WHERE user_id = ?", (session["id"],))
    (count,) = cur.fetchone()
    if count:
        cur.execute("UPDATE images SET image = ?, mime = ? WHERE user_id = ?", (new_image, mime, session["id"]))
    else:
        cur.execute("INSERT INTO images(user_id, image, mime) VALUES (?, ?, ?)", (session["id"], new_image, mime))
    cur = db.cursor()
    cur.execute("UPDATE users SET picture_url = '/saed/api/user_image' WHERE id = ?", (session["id"],))
    return {}


def create_notification(db, user_id, message, action_url=None, picture_url=None):
    cur = db.cursor()
    cur.execute(f"INSERT INTO notifications(user_id, message, action_url, picture_url) VALUES ({qmarks(4)})", (user_id, message, action_url, picture_url))


@app.route(f"{API_PATH}/notifications")
@with_session
@connect("db", MAIN_DB)
def get_notifications(db):
    cur = db.cursor()
    try:
        earlier_than = request.args["earlier_than"]
        cur.execute("SELECT id, message, action_url, picture_url FROM notifications WHERE user_id = ? AND id < ? ORDER BY id DESC", (session["id"], earlier_than))
    except KeyError:
        cur.execute("SELECT id, message, action_url, picture_url FROM notifications WHERE user_id = ? ORDER BY id DESC", (session["id"],))
    return jsonify([dict(zip(("id", "message", "action_url", "picture_url"), row)) for row in islice(cur, 10)])
