import os
import sqlite3
from enum import IntEnum
from threading import Lock
from functools import wraps
from flask_cors import CORS
from flask_session import Session

import flask
from flask import Flask, request, session

from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError

app = Flask(__name__)
app.secret_key = os.urandom(24)
app.config['SESSION_TYPE'] = 'filesystem'
CORS(app, supports_credentials=True)
Session(app)

db = sqlite3.connect("db.sqlite3", check_same_thread=False)
db_lock = Lock()

API_PATH = "/saed/api"

with open("oauth_data") as f:
    google_client_id, google_client_secret = map(str.strip, f.readline().split(":"))
    google_scopes = [l.strip() for l in f]

AccountType = IntEnum("AccountType", "GOOGLE") #FACEBOOK...


def with_lock(lock):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            with lock:
                return f(*args, **kwargs)
        return wrapper
    return decorator


def api_error(code, msg):
    return {"error": msg}, code


@with_lock(db_lock)
def get_user_id(account_type, email):
    cur = db.cursor()
    cur.execute("SELECT id FROM users WHERE account_type = ? AND email = ?", (account_type, email))
    record = cur.fetchone()
    if record is None:
        raise KeyError
    return record[0]


def ensure_user_exists(account_type, email, name, given_name=None, family_name=None, picture_url=None):
    try:
        user_id = get_user_id(account_type, email)
    except KeyError:
        with db_lock:
            cur = db.cursor()
            cur.execute("INSERT INTO users(account_type, email, name, given_name, family_name, picture_url) VALUES (?, ?, ?, ?, ?, ?)",
                    (account_type, email, name, given_name, family_name, picture_url))
            db.commit()
        user_id = get_user_id(account_type, email)
    return user_id


@app.route(f"{API_PATH}/configure_session", methods=["POST"])
def configure_session():
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

    """user_id = ensure_user_exists(
            AccountType.GOOGLE,
            userinfo["email"],
            userinfo["name"],
            userinfo["given_name"],
            userinfo["family_name"],
            userinfo["picture"])
    """
    session["user_id"] = "prova"

    return {}
