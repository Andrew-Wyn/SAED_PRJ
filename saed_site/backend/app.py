import os
import re
import imghdr
import sqlite3
from enum import IntEnum
from pathlib import Path
from functools import wraps
from itertools import islice
from contextlib import closing, ExitStack
from sqlite3 import IntegrityError

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

ad_types = "Locale", "Band", "Musicista", "Strumento"
user_info_columns = "email", "name", "given_name", "family_name", "musician", "instrument_supplier", "club_owner"

KB = 1024
MB = KB**2
GB = KB**3

with open("oauth_data") as f:
    google_client_id, google_client_secret = map(str.strip, f.readline().split(":"))
    google_scopes = [l.strip() for l in f]

AccountType = IntEnum("AccountType", "GOOGLE") #FACEBOOK...


def removeprefix(s, prefix):
    if s.startswith(prefix):
        return s[len(prefix):]
    return s


def iceil(n, d):
    return -(n // -d)


def qmarks(n):
    return ", ".join(("?",) * n)


def updlist(columns):
    return ", ".join(f"{c} = ?" for c in columns)


def qualify_cols(table, columns):
    return (f"{table}.{c}" for c in columns)


def cols_list(columns):
    return ",".join(columns)


def api_error(code, msg):
    return {"error": msg}, code


price_re = re.compile(r"(?P<units>\d+)(\.(?P<cents>\d\d))?")

def validate_price(s):
    m = price_re.fullmatch(s)
    if not m:
        raise ValueError
    price = int(m.group("units"))*100
    if m.group("cents"):
        price += int(m.group("cents"))
    return price


def to_cents(n):
    q, r = divmod(n, 100)
    return f"{q}.{r:02}"


# RFC 5322
email_re = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

def validate_email(s):
    if not email_re.fullmatch(s):
        raise ValueError
    return s


def validate_ad_type(t):
    if t not in ad_types:
        raise ValueError
    return t


def str_or_null(s):
    if s is None:
        return None
    return str(s)


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


class Namespace:
    pass


def with_json(**fields):
    def decorator(f):
        bad_request = api_error(400, "Bad request")
        @wraps(f)
        def wrapper(*args, **kwargs):
            if request.json is None:
                return bad_request
            ns = Namespace()
            for fieldname, validator in fields.items():
                try:
                    value = request.json[fieldname]
                except KeyError:
                    return bad_request
                if callable(validator):
                    try:
                        setattr(ns, fieldname, validator(value))
                    except ValueError:
                        return bad_request
                else:
                    if value not in validator:
                        return bad_request
                    setattr(ns, fieldname, value)
            kwargs["json"] = ns
            return f(*args, **kwargs)
        return wrapper
    return decorator


class QueryGenerator:
    def __init__(self, db, query_head):
        self.db = db
        self.query_head = query_head
        self.checks = []
        self.params = []
        self.query_tail = None

    def add_check(self, check, value, validator=lambda x: x):
        if self.query_tail is not None:
            raise RuntimeError
        self.checks.append(check)
        self.params.append(validator(value))

    def finalize(self, query_tail):
        if self.query_tail is not None:
            raise RuntimeError
        self.query_tail = query_tail

    def execute(self):
        if self.query_tail is None:
            raise RuntimeError
        cur = self.db.cursor()
        if self.checks:
            checks = " AND ".join(self.checks)
            query = " ".join([self.query_head, "WHERE", checks, self.query_tail])
            cur.execute(query, self.params)
        else:
            cur.execute(" ".join([self.query_head, self.query_tail]), self.params)
        return cur


def get_or_create_user(db, img_db, account_type, email, name, given_name=None, family_name=None, picture_url=None):
    cur = db.cursor()
    cur.execute("SELECT id FROM users WHERE account_type = ? AND email = ?", (account_type, email))
    record = cur.fetchone()
    if record is not None:
        return record[0]
    cur.execute(
            f"INSERT INTO users(account_type, email, name, given_name, family_name, musician, instrument_supplier, club_owner) VALUES ({qmarks(8)})",
            (account_type, email, name, given_name, family_name, False, False, False))
    user_id = cur.lastrowid
    if picture_url is not None:
        cur = img_db.cursor()
        cur.execute(f"INSERT INTO profile_pictures(id, external_url) VALUES (?, ?)", (user_id, picture_url))
    return user_id


@app.route(f"{API_PATH}/session", methods=["PUT"])
@with_json(token=str)
@connect(db=MAIN_DB, img_db=IMG_DB)
def configure_session(db, img_db, json):
    credentials = Credentials(json.token, client_id=google_client_id, client_secret=google_client_secret, scopes=google_scopes)
    oauth2 = build("oauth2", "v2", credentials=credentials)

    try:
        userinfo = oauth2.userinfo().get().execute()
    except RefreshError:
        return api_error(401, "Token scaduto")

    session["id"] = get_or_create_user(
            db, img_db,
            AccountType.GOOGLE,
            userinfo["email"],
            userinfo["name"],
            userinfo["given_name"],
            userinfo["family_name"],
            userinfo["picture"])

    return {}


@app.route(f"{API_PATH}/session")
def logged_in():
    return {"user_id": session.get("id", None)}


@app.route(f"{API_PATH}/session", methods=["DELETE"])
def logged_out():
    session.pop("id", None)
    return {}


@app.route(f"{API_PATH}/user_info")
@with_session
@connect(db=MAIN_DB)
def get_user_info(db):
    cur = db.cursor()
    cur.execute(f"SELECT {cols_list(user_info_columns)} FROM users WHERE id = ?", (session["id"],))
    result = cur.fetchone()
    return dict(zip(user_info_columns, result))


@app.route(f"{API_PATH}/user_info", methods=["PUT"])
@with_session
@with_json(email=validate_email, name=str, given_name=str_or_null, family_name=str_or_null, musician=bool, instrument_supplier=bool, club_owner=bool)
@connect(db=MAIN_DB)
def set_user_info(db, json):
    cur = db.cursor()
    try:
        cur.execute(
                f"UPDATE users SET {updlist(user_info_columns)} WHERE id = ?",
                (*(getattr(json, c) for c in user_info_columns), session["id"]))
    except KeyError:
        return api_error(400, "Bad request")
    return {}


def get_image(img_db, with_external_url, table, id_value):
    cur = img_db.cursor()
    cur.execute(f"SELECT image, mime FROM {table} WHERE id = ? AND image IS NOT NULL", (id_value,))
    result = cur.fetchone()
    if result is not None:
        image, mime = result
        return Response(image, mimetype=mime)
    if not with_external_url:
        return api_error(404, "Not found")
    cur.execute(f"SELECT external_url FROM {table} WHERE id = ? AND external_url IS NOT NULL", (id_value,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    (external_url,) = result
    return redirect(external_url)


def set_image(img_db, with_external_url, table, id_value, max_size):
    if request.content_length > max_size:
        return api_error(413, "Payload too large")
    new_image = request.get_data(cache=False)
    try:
        mime = SUPPORTED_IMAGE_TYPES[imghdr.what(None, new_image)]
    except KeyError:
        return api_error(415, "Unsupported image type")
    cur = img_db.cursor()
    cur.execute(f"SELECT count(*) FROM {table} WHERE id = ?", (id_value,))
    (count,) = cur.fetchone()
    if count:
        cur.execute(f"UPDATE {table} SET {'external_url = NULL,' if with_external_url else ''} image = ?, mime = ? WHERE id = ?", (new_image, mime, id_value))
    else:
        cur.execute(f"INSERT INTO {table}(id, image, mime) VALUES (?, ?, ?)", (id_value, new_image, mime))
    return {}


@app.route(f"{API_PATH}/user_image/<int:user_id>")
@connect(img_db=IMG_DB)
def get_any_user_image(img_db, user_id):
    return get_image(img_db, True, "profile_pictures", user_id)


@app.route(f"{API_PATH}/user_image")
@with_session
@connect(img_db=IMG_DB)
def get_user_image(img_db):
    return get_image(img_db, True, "profile_pictures", session["id"])


@app.route(f"{API_PATH}/user_image", methods=["PUT"])
@with_session
@connect(img_db=IMG_DB)
def set_user_image(img_db):
    return set_image(img_db, True, "profile_pictures", session["id"], 2*MB)


def create_notification(db, user_id, message, action_url=None, picture_url=None):
    cur = db.cursor()
    cur.execute(f"INSERT INTO notifications(user_id, message, action_url, picture_url) VALUES ({qmarks(4)})", (user_id, message, action_url, picture_url))


def is_ad_owner(db, user_id, ad_id):
    cur = db.cursor()
    cur.execute("SELECT NULL FROM ads WHERE id = ? AND owner = ?", (ad_id, user_id))
    return bool(cur.fetchone())


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
        query.append(f"AND id > {after}") # SQL INJECTION!
        #query.append("AND id > ?")
        #try:
        #    args.append(int(after))
        #except TypeError:
        #    return api_error(400, "'after' should be an integer")
    query.append("ORDER BY id DESC")
    cur = db.cursor()
    cur.execute(" ".join(query), tuple(args))
    return jsonify([dict(zip(("id", "message", "action_url", "picture_url"), row)) for row in islice(cur, 10)])


ad_columns = "id", "title", "description", "price", "owner", "ad_type"
user_columns = "name", "email", "phone_number"
qualified_cols = [*qualify_cols("ads", ad_columns), *qualify_cols("users", user_columns)]

def make_ad_object(db, record, user_id):
    record = dict(zip(qualified_cols, record))
    ret = {removeprefix(k, "ads."): v for k, v in record.items() if k.startswith("ads.")}
    ret["can_edit"] = (ret["owner"] == user_id)
    ret["owner"] = record["users.name"]
    ret["price"] = to_cents(ret["price"])
    cur = db.cursor()
    cur.execute(
            "SELECT NULL FROM ads_interested WHERE ad_id = ? AND user_id = ?",
            (ret["id"], user_id))
    if cur.fetchone() is not None:
        ret["contact_info"] = {
            "email": record["users.email"],
            "phone_number": record["users.phone_number"]
        }
    else:
        ret["contact_info"] = None
    return ret


@app.route(f"{API_PATH}/ads/<int:ad_id>")
@with_session
@connect(db=MAIN_DB)
def get_ad(db, ad_id):
    cur = db.cursor()
    cur.execute(f"SELECT {cols_list(qualified_cols)} FROM ads JOIN users ON ads.owner = users.id WHERE ads.id = ?", (ad_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    return make_ad_object(db, result, session["id"])


@app.route(f"{API_PATH}/ads")
@with_session
@connect(db=MAIN_DB)
def query_ads(db):
    query = QueryGenerator(db, f"SELECT {cols_list(qualified_cols)} FROM ads JOIN users ON ads.owner = users.id")
    checks = (
        ("price >= ?", "min_price", validate_price),
        ("price <= ?", "max_price", validate_price),
        ("ad_type = ?", "ad_type", validate_ad_type),
        ("title LIKE '%'||?||'%'", "title", str),
        ("description LIKE '%'||?||'%'", "description", str),
    )
    for check, arg, validator in checks:
        try:
            query.add_check(check, request.args[arg], validator)
        except ValueError:
            return api_error(400, "Bad request")
        except KeyError:
            pass
    query.finalize("ORDER BY ads.id DESC")
    cur = query.execute()
    page = int(request.args.get("page", 0))
    page_size = 10
    page_off = page_size * page
    count = sum(1 for _ in islice(cur, page_off))
    results = [
        make_ad_object(db, record, session["id"])
        for record in islice(cur, page_size)
    ]
    count += len(results) + sum(1 for _ in cur)
    return {
        "pages": iceil(count, page_size),
        "results": results
    }


@app.route(f"{API_PATH}/ads/<int:ad_id>", methods=["PUT"])
@with_session
@with_json(title=str, description=str, price=validate_price, ad_type=ad_types)
@connect(db=MAIN_DB)
def update_ad(db, json, ad_id):
    columns = "title", "description", "price", "ad_type"
    cur = db.cursor()
    cur.execute(
            f"UPDATE ads SET {updlist(columns)} WHERE id = ? AND owner = ?",
            (json.title, json.description, json.price, json.ad_type, ad_id, session["id"]))
    if not cur.rowcount:
        return api_error(401, "Unauthorized")
    return {}


@app.route(f"{API_PATH}/ads", methods=["POST"])
@with_session
@with_json(title=str, description=str, price=validate_price, ad_type=ad_types)
@connect(db=MAIN_DB)
def add_ad(db, json):
    cur = db.cursor()
    cur.execute(
            f"INSERT INTO ads(title, description, price, owner, ad_type) VALUES ({qmarks(5)})",
            (json.title, json.description, json.price, session["id"], json.ad_type))
    return {"ad_id": cur.lastrowid}


@app.route(f"{API_PATH}/ads/photos/<int:ad_id>")
@with_session
@connect(img_db=IMG_DB)
def get_ad_image(img_db, ad_id):
    return get_image(img_db, False, "ad_images", ad_id)


@app.route(f"{API_PATH}/ads/photos/<int:ad_id>", methods=["PUT"])
@with_session
@connect(db=MAIN_DB, img_db=IMG_DB)
def set_ad_image(db, img_db, ad_id):
    if not is_ad_owner(db, session["id"], ad_id):
        return api_error(401, "Unauthorized")
    return set_image(img_db, False, "ad_images", ad_id, 4*MB)


@app.route(f"{API_PATH}/ads/interested/<int:ad_id>", methods=["POST"])
@with_session
@connect(db=MAIN_DB)
def signal_interest(db, ad_id):
    cur = db.cursor()
    cur.execute("SELECT owner, title FROM ads WHERE id = ?", (ad_id,))
    (owner, title) = cur.fetchone()
    if owner == session["id"]:
        return api_error(418, "I'm a teapot")
    try:
        cur.execute("INSERT INTO ads_interested(ad_id, user_id) VALUES (?, ?)", (ad_id, session["id"]))
    except IntegrityError:
        return {}
    create_notification(db, owner, f'An user is interested into your ad: "{title}"', picture_url=f"/saed/api/user_image/{session['id']}")
    return {}


@app.route(f"{API_PATH}/ads/interested/<int:ad_id>", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def revoke_interest(db, ad_id):
    cur = db.cursor()
    cur.execute("SELECT owner, title FROM ads WHERE id = ?", (ad_id,))
    (owner, title) = cur.fetchone()
    cur.execute("DELETE FROM ads_interested WHERE ad_id = ? AND user_id = ?", (ad_id, session["id"]))
    if cur.rowcount:
        create_notification(db, owner, f'An user is not interested anymore into your ad: "{title}"', picture_url=f"/saed/api/user_image/{session['id']}")
    return {}


if __name__ == "__main__":
    app.run()
