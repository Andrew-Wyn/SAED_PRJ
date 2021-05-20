import os
import sqlite3
from enum import IntEnum
from threading import Lock
from functools import wraps
from contextlib import closing

import flask
from flask import Flask, request, session
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

with open("oauth_data") as f:
    google_client_id, google_client_secret = map(str.strip, f.readline().split(":"))
    google_scopes = [l.strip() for l in f]

AccountType = IntEnum("AccountType", "GOOGLE") #FACEBOOK...


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
        cur.execute("INSERT INTO users(account_type, email, name, given_name, family_name, picture_url) VALUES (?, ?, ?, ?, ?, ?)",
                (account_type, email, name, given_name, family_name, picture_url))
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
    columns = ("email", "name", "given_name", "family_name", "picture_url")
    cur.execute(f"SELECT {','.join(columns)} FROM users WHERE id = ?", (session["id"],))
    result = cur.fetchone()
    return dict(zip(columns, result))
