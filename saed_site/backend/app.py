import os
import re
import imghdr
import sqlite3
from enum import IntEnum
from pathlib import Path
from functools import wraps
from itertools import islice
from contextlib import closing, ExitStack, contextmanager
from collections import namedtuple
from datetime import date, time, datetime, timedelta
from sqlite3 import IntegrityError, PARSE_DECLTYPES

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
DEFAULT_IMAGE_PATH = "default.png"

ad_types = "Locale", "Band", "Musicista", "Strumento"
user_info_columns = "email", "name", "given_name", "family_name", "musician", "instrument_supplier", "club_owner"

KB = 1024
MB = KB**2
GB = KB**3

with open("oauth_data") as f:
    google_client_id, google_client_secret = map(str.strip, f.readline().split(":"))
    google_scopes = [l.strip() for l in f]

AccountType = IntEnum("AccountType", "GOOGLE") #FACEBOOK...


def identity(x):
    return x


def removeprefix(s, prefix):
    if s.startswith(prefix):
        return s[len(prefix):]
    return s


def iceil(n, d):
    return -(n // -d)


def count_slice(it, start, end):
    count = sum(1 for _ in islice(it, start))
    ret = list(islice(it, end-start))
    count += len(ret) + sum(1 for _ in it)
    return count, ret


def api_error(code, msg):
    return {"error": msg, "error_code": str(code)}, code


def modified(cur):
    return bool(cur.rowcount)


def modified_or_error(cur, code, msg):
    if modified(cur):
        return {}
    return api_error(code, msg)


def qmarks(n):
    return ", ".join(("?",) * n)


def updlist(columns):
    return ", ".join(f"{c} = ?" for c in columns)


def qualify_cols(table, columns):
    return (f"{table}.{c}" for c in columns)


def cols_list(columns):
    return ",".join(columns)


class QueryGenerator:
    def __init__(self, db, query_head, params=None):
        self.db = db
        self.query_head = query_head
        self.checks = []
        self.params = [] if params is None else list(params)
        self.query_tail = None

    def add_check(self, check, value, validator=identity):
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


@contextmanager
def binding(f, variable, value):
    try:
        old_value = f.__globals__[variable]
    except KeyError:
        shadowing = False
    else:
        shadowing = True

    f.__globals__[variable] = value

    try:
        yield
    finally:
        if shadowing:
            f.__globals__[variable] = old_value
        else:
            del f.__globals__[variable]


@contextmanager
def bindings(f, **bindings):
    with ExitStack() as stack:
        for variable, value in bindings.items():
            stack.enter_context(binding(f, variable, value))
        yield


def connect(**dbs):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            with ExitStack() as stack:
                for variable, db_path in dbs.items():
                    conn = sqlite3.connect(db_path, detect_types=PARSE_DECLTYPES)
                    stack.enter_context(closing(conn))
                    stack.enter_context(conn)
                    stack.enter_context(binding(f, variable, conn))
                return f(*args, **kwargs)
        return wrapper
    return decorator


def with_session(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            user_id = session["id"]
        except KeyError:
            return api_error(401, "Unauthorized")
        with bindings(f, user_id=user_id):
            return f(*args, **kwargs)
    return wrapper


def parse_bool(s):
    if s.casefold() == "true":
        return True
    if s.casefold() == "false":
        return False
    raise ValueError


price_re = re.compile(r"(?P<units>\d+)(\.(?P<cents>\d\d))?")

def parse_price(s):
    m = price_re.fullmatch(s)
    if not m:
        raise ValueError
    price = int(m.group("units"))*100
    if m.group("cents"):
        price += int(m.group("cents"))
    return price


def price_str(n):
    q, r = divmod(n, 100)
    return f"{q}.{r:02}"


# RFC 5322
email_re = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")

def validate_email(s):
    if not email_re.fullmatch(s):
        raise ValueError
    return s


def is_a(t):
    def is_a_validator(value):
        if not isinstance(value, t):
            raise TypeError
        return value
    return is_a_validator


def is_in(container):
    def is_in_validator(value):
        if not value in container:
            raise ValueError
        return value
    return is_in_validator


def nullable(validator):
    def nullable_validator(value):
        if value is None:
            return None
        return validator(value)
    return nullable_validator


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
                try:
                    setattr(ns, fieldname, validator(value))
                except (ValueError, TypeError):
                    return bad_request
            with bindings(f, json=ns):
                return f(*args, **kwargs)
        return wrapper
    return decorator


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
@with_json(token=is_a(str))
@connect(db=MAIN_DB, img_db=IMG_DB)
def configure_session():
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
def get_user_info():
    cur = db.cursor()
    cur.execute(f"SELECT {cols_list(user_info_columns)} FROM users WHERE id = ?", (user_id,))
    result = cur.fetchone()
    ret = dict(zip(user_info_columns, result))
    for k in "musician", "instrument_supplier", "club_owner":
        ret[k] = bool(ret[k])
    return ret


@app.route(f"{API_PATH}/user_info", methods=["PUT"])
@with_session
@with_json(
        email=validate_email,
        name=is_a(str),
        given_name=nullable(is_a(str)),
        family_name=nullable(is_a(str)),
        musician=is_a(bool),
        instrument_supplier=is_a(bool),
        club_owner=is_a(bool))
@connect(db=MAIN_DB)
def set_user_info():
    cur = db.cursor()
    try:
        cur.execute(
                f"UPDATE users SET {updlist(user_info_columns)} WHERE id = ?",
                (*(getattr(json, c) for c in user_info_columns), user_id))
    except KeyError:
        return api_error(400, "Bad request")
    return {}


def compute_mime(image):
    try:
        return SUPPORTED_IMAGE_TYPES[imghdr.what(None, default_image)]
    except KeyError as e:
        raise ValueError from e


with open(DEFAULT_IMAGE_PATH, "rb") as f:
    default_image = f.read()
default_image_mime = compute_mime(default_image)


def get_image(img_db, with_external_url, table, id_value):
    cur = img_db.cursor()
    cur.execute(f"SELECT image, mime FROM {table} WHERE id = ? AND image IS NOT NULL", (id_value,))
    result = cur.fetchone()
    if result is not None:
        image, mime = result
        return Response(image, mimetype=mime)
    if with_external_url:
        cur.execute(f"SELECT external_url FROM {table} WHERE id = ? AND external_url IS NOT NULL", (id_value,))
        result = cur.fetchone()
        if result is not None:
            (external_url,) = result
            return redirect(external_url)
    return Response(default_image, default_image_mime)


def set_image(img_db, with_external_url, table, id_value, max_size):
    if request.content_length > max_size:
        return api_error(413, "Payload too large")
    new_image = request.get_data(cache=False)
    try:
        mime = compute_mime(new_image)
    except ValueError:
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
def get_any_user_image(user_id):
    return get_image(img_db, True, "profile_pictures", user_id)


@app.route(f"{API_PATH}/user_image")
@with_session
@connect(img_db=IMG_DB)
def get_user_image():
    return get_image(img_db, True, "profile_pictures", user_id)


@app.route(f"{API_PATH}/user_image", methods=["PUT"])
@with_session
@connect(img_db=IMG_DB)
def set_user_image():
    return set_image(img_db, True, "profile_pictures", user_id, 2*MB)


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
def get_notifications():
    earlier_than = request.args.get("earlier_than", None)
    after = request.args.get("after", None)
    query = ["SELECT id, message, action_url, picture_url FROM notifications WHERE user_id = ?"]
    args = [user_id]
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
    ret["price"] = price_str(ret["price"])
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
def get_ad(ad_id):
    cur = db.cursor()
    cur.execute(f"SELECT {cols_list(qualified_cols)} FROM ads JOIN users ON ads.owner = users.id WHERE ads.id = ?", (ad_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    return make_ad_object(db, result, user_id)


@app.route(f"{API_PATH}/ads")
@with_session
@connect(db=MAIN_DB)
def query_ads():
    query = QueryGenerator(db, f"SELECT {cols_list(qualified_cols)} FROM ads JOIN users ON ads.owner = users.id")
    checks = (
        ("price >= ?", "min_price", parse_price),
        ("price <= ?", "max_price", parse_price),
        ("ad_type = ?", "ad_type", is_in(ad_types)),
        ("title LIKE '%'||?||'%'", "title", identity),
        ("description LIKE '%'||?||'%'", "description", identity),
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
    count, records = count_slice(cur, page_off, page_off+page_size)
    results = [
        make_ad_object(db, record, user_id)
        for record in records
    ]
    return {
        "pages": iceil(count, page_size),
        "results": results
    }


@app.route(f"{API_PATH}/ads/<int:ad_id>", methods=["PUT"])
@with_session
@with_json(title=is_a(str), description=is_a(str), price=parse_price, ad_type=is_in(ad_types))
@connect(db=MAIN_DB)
def update_ad(ad_id):
    columns = "title", "description", "price", "ad_type"
    cur = db.cursor()
    cur.execute(
            f"UPDATE ads SET {updlist(columns)} WHERE id = ? AND owner = ?",
            (json.title, json.description, json.price, json.ad_type, ad_id, user_id))
    return modified_or_error(cur, 401, "Unauthorized")


@app.route(f"{API_PATH}/ads/<int:ad_id>", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def delete_ad(ad_id):
    cur = db.cursor()
    cur.execute(f"DELETE FROM ads WHERE id = ? AND owner = ?", (ad_id, user_id))
    return modified_or_error(cur, 401, "Unauthorized")


@app.route(f"{API_PATH}/ads", methods=["POST"])
@with_session
@with_json(title=is_a(str), description=is_a(str), price=parse_price, ad_type=is_in(ad_types))
@connect(db=MAIN_DB)
def add_ad():
    cur = db.cursor()
    cur.execute(
            f"INSERT INTO ads(title, description, price, owner, ad_type) VALUES ({qmarks(5)})",
            (json.title, json.description, json.price, user_id, json.ad_type))
    return {"ad_id": cur.lastrowid}


@app.route(f"{API_PATH}/ads/photos/<int:ad_id>")
@with_session
@connect(img_db=IMG_DB)
def get_ad_image(ad_id):
    return get_image(img_db, False, "ad_images", ad_id)


@app.route(f"{API_PATH}/ads/photos/<int:ad_id>", methods=["PUT"])
@with_session
@connect(db=MAIN_DB, img_db=IMG_DB)
def set_ad_image(ad_id):
    if not is_ad_owner(db, user_id, ad_id):
        return api_error(401, "Unauthorized")
    return set_image(img_db, False, "ad_images", ad_id, 4*MB)


@app.route(f"{API_PATH}/ads/interested/<int:ad_id>", methods=["POST"])
@with_session
@connect(db=MAIN_DB)
def signal_ad_interest(ad_id):
    cur = db.cursor()
    cur.execute("SELECT owner, title FROM ads WHERE id = ?", (ad_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    owner, title = result
    if owner == user_id:
        return api_error(418, "I'm a teapot")
    try:
        cur.execute("INSERT INTO ads_interested(ad_id, user_id) VALUES (?, ?)", (ad_id, user_id))
    except IntegrityError:
        pass
    else:
        create_notification(db, owner, f'An user is interested into your ad: "{title}"', action_url=f"ad;{ad_id}", picture_url=f"/saed/api/user_image/{user_id}")
    return {}


@app.route(f"{API_PATH}/ads/interested/<int:ad_id>", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def revoke_ad_interest(ad_id):
    cur = db.cursor()
    cur.execute("SELECT owner, title FROM ads WHERE id = ?", (ad_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    owner, title = result
    cur.execute("DELETE FROM ads_interested WHERE ad_id = ? AND user_id = ?", (ad_id, user_id))
    if cur.rowcount:
        create_notification(db, owner, f'An user is not interested anymore into your ad: "{title}"', action_url=f"ad;{ad_id}", picture_url=f"/saed/api/user_image/{user_id}")
    return {}


def is_band_owner(db, user_id, band_id):
    cur = db.cursor()
    cur.execute("SELECT NULL FROM bands WHERE id = ? AND owner = ?", (band_id, user_id))
    return bool(cur.fetchone())


def band_member(db, user_id, band_id):
    cur = db.cursor()
    cur.execute("SELECT NULL FROM band_members WHERE band_id = ? AND user_id = ?", (band_id, user_id))
    return bool(cur.fetchone())


def band_info(db, band_id):
    cur = db.cursor()
    cur.execute("SELECT name, description, band_type, owner, seeking FROM bands WHERE id = ?", (band_id,))
    result = cur.fetchone()
    return result


def is_service_owner(db, user_id, service_id):
    cur = db.cursor()
    cur.execute("SELECT NULL FROM band_services WHERE id = ? AND owner = ?", (service_id, user_id))
    return cur.fetchone() is not None


@app.route(f"{API_PATH}/bands", methods=["POST"])
@with_session
@with_json(name=is_a(str), description=is_a(str), band_type=is_a(str), seeking=is_a(bool))
@connect(db=MAIN_DB)
def add_band():
    cur = db.cursor()
    cur.execute(
            f"INSERT INTO bands(name, description, band_type, owner, seeking) VALUES ({qmarks(5)})",
            (json.name, json.description, json.band_type, user_id, json.seeking))
    return {"band_id": cur.lastrowid}


@app.route(f"{API_PATH}/bands/<int:band_id>", methods=["PUT"])
@with_session
@with_json(name=is_a(str), description=is_a(str), band_type=is_a(str), seeking=is_a(bool))
@connect(db=MAIN_DB)
def update_band(band_id):
    cur = db.cursor()
    cur.execute(
            f"UPDATE bands SET name = ?, description = ?, band_type = ?, seeking = ? WHERE id = ? AND owner = ?",
            (json.name, json.description, json.band_type, json.seeking, band_id, user_id))
    return modified_or_error(cur, 401, "Unauthorized")


@app.route(f"{API_PATH}/bands/<int:band_id>/seeking", methods=["PUT"])
@with_session
@with_json(seeking=is_a(bool))
@connect(db=MAIN_DB)
def set_band_seeking(band_id):
    cur = db.cursor()
    cur.execute(
            "UPDATE bands SET seeking = ? WHERE id = ? AND owner = ?",
            (json.seeking, band_id, user_id))
    return modified_or_error(cur, 401, "Unauthorized")


@app.route(f"{API_PATH}/bands/<int:band_id>/join_request", methods=["PUT"])
@with_session
@connect(db=MAIN_DB)
def send_band_join_request(band_id):
    if band_member(db, user_id, band_id):
        return api_error(401, "Unauthorized")
    cur = db.cursor()
    cur.execute("SELECT name, owner, seeking FROM bands WHERE id = ?", (band_id,))
    result = cur.fetchone()
    if result is not None:
        name, owner, seeking = result
    if result is None or not seeking or owner == user_id:
        return api_error(401, "Unauthorized")
    try:
        cur.execute(
                "INSERT INTO band_applicants(user_id, band_id, rejected) VALUES (?, ?, ?)",
                (user_id, band_id, False))
    except IntegrityError:
        pass
    else:
        create_notification(db, owner, f'A musician wants to join your band: "{name}"', action_url=f"band;{band_id}", picture_url=f"/saed/api/bands/images/{band_id}")
    return {}


@app.route(f"{API_PATH}/bands/<int:band_id>/join_request", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def remove_band_join_request(band_id):
    cur = db.cursor()
    cur.execute("DELETE FROM band_applicants WHERE band_id = ? AND user_id = ? AND NOT rejected", (band_id, user_id))
    return modified_or_error(cur, 401, "Unauthorized")


def accept_band_join_request(db, band_id, applicant_id):
    cur = db.cursor()
    cur.execute("DELETE FROM band_applicants WHERE band_id = ? AND user_id = ?", (band_id, applicant_id))
    if not modified(cur):
        return api_error(404, "Not found")
    cur.execute("INSERT INTO band_members(user_id, band_id) VALUES (?, ?)", (applicant_id, band_id))
    band_name, _, _, _, _ = band_info(db, band_id)
    create_notification(db, applicant_id, f'You have been accepted into a band "{band_name}"', action_url=f"band;{band_id}", picture_url=f"/saed/api/bands/images/{band_id}")
    return {}


def reject_band_join_request(db, band_id, applicant_id):
    cur = db.cursor()
    cur.execute(
            "UPDATE band_applicants SET rejected = TRUE WHERE band_id = ? AND user_id = ?",
            (band_id, applicant_id))
    if not modified(cur):
        return api_error(404, "Not found")
    band_name, _, _, _, _ = band_info(db, band_id)
    create_notification(db, applicant_id, f'Your application for the band "{band_name}" has been rejected', action_url=f"band;{band_id}", picture_url=f"/saed/api/bands/images/{band_id}")
    return {}


@app.route(f"{API_PATH}/bands/<int:band_id>/join_requests/<int:applicant_id>", methods=["PUT"])
@with_session
@with_json(accept=is_a(bool))
@connect(db=MAIN_DB)
def update_band_join_request(band_id, applicant_id):
    if not is_band_owner(db, user_id, band_id):
        return api_error(401, "Unauthorized")
    if json.accept:
        return accept_band_join_request(db, band_id, applicant_id)
    return reject_band_join_request(db, band_id, applicant_id)



@app.route(f"{API_PATH}/bands/<int:band_id>", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def delete_band(band_id):
    cur = db.cursor()
    cur.execute("DELETE FROM bands WHERE id = ? AND owner = ?", (band_id, user_id))
    if not modified(cur):
        return api_error(401, "Unauthorized")
    cur.execute("DELETE FROM band_members WHERE band_id = ?", (band_id,))


@app.route(f"{API_PATH}/bands/<int:band_id>/members/<int:member_id>", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def remove_band_member(band_id, member_id):
    if not user_id == member_id and not is_band_owner(db, user_id, band_id):
        return api_error(401, "Unauthorized")
    cur = db.cursor()
    cur.execute("DELETE FROM band_members WHERE band_id = ? AND user_id = ?", (band_id, member_id))
    return modified_or_error(cur, 404, "Not found")


BandRecord = namedtuple("BandRecord", "band_id name description band_type owner seeking owner_name owner_email owner_phone rejected member_id")


def make_band_object(db, record, user_id):
    cur = db.cursor()
    record = BandRecord._make(record)
    is_owner = record.owner == user_id
    is_member = record.member_id is not None
    requested = record.rejected is not None
    ret = {
        "id": record.band_id,
        "name": record.name,
        "description": record.description,
        "band_type": record.band_type,
        "owner": record.owner_name,
        "seeking": bool(record.seeking),
        "rejected": bool(record.rejected),
        "own": is_owner,
        "can_request": record.seeking and not is_owner and not is_member and not requested,
        "contact_info": None,
        "members": None,
        "join_requests": None
    }

    if requested:
        ret["contact_info"] = {
            "email": record.owner_email,
            "phone_number": record.owner_phone
        }

    cur.execute("SELECT bm.user_id, users.name FROM band_members AS bm JOIN users ON bm.user_id = users.id WHERE bm.band_id = ?", (record.band_id,))
    ret["members"] = [
        {"user_id": user_id, "name": user_name}
        for user_id, user_name in cur
    ]

    cur.execute("SELECT ba.user_id, ba.rejected, users.name FROM band_applicants AS ba JOIN users ON ba.user_id = users.id WHERE ba.band_id = ?", (record.band_id,))
    ret["join_requests"] = [
        {"user_id": user_id, "name": user_name, "rejected": rejected}
        for user_id, rejected, user_name in cur
    ]

    return ret


@app.route(f"{API_PATH}/bands/<int:band_id>")
@with_session
@connect(db=MAIN_DB)
def get_band(band_id):
    cur = db.cursor()
    cur.execute("""
        SELECT bands.id, bands.name, bands.description, bands.band_type, bands.owner, bands.seeking,
               users.name, users.email, users.phone_number, ba.rejected, bm.user_id
        FROM bands
             JOIN users ON bands.owner = users.id
             LEFT JOIN band_applicants AS ba ON ba.band_id = bands.id AND ba.user_id = ?
             LEFT JOIN band_members AS bm ON bm.band_id = bands.id AND bm.user_id = ?
        WHERE bands.id = ?
        """, (user_id, user_id, band_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    return make_band_object(db, result, user_id)


@app.route(f"{API_PATH}/bands")
@with_session
@connect(db=MAIN_DB)
def query_bands():
    query = QueryGenerator(db, """
        SELECT bands.id, bands.name, bands.description, bands.band_type, bands.owner, bands.seeking,
               users.name, users.email, users.phone_number, ba.rejected, bm.user_id
        FROM bands
             JOIN users ON bands.owner = users.id
             LEFT JOIN band_applicants AS ba ON ba.band_id = bands.id AND ba.user_id = ?
             LEFT JOIN band_members AS bm ON bm.band_id = bands.id AND bm.user_id = ?
        """, (user_id, user_id))
    checks = (
        ("bands.name LIKE '%'||?||'%'", "name", identity),
        ("bands.description LIKE '%'||?||'%'", "description", identity),
        ("bands.band_type LIKE '%'||?||'%'", "type", identity),
        ("users.name LIKE '%'||?||'%'", "owner", identity)
        ("bands.seeking = ?", "seeking", parse_bool)
    )
    for check, arg, validator in checks:
        try:
            query.add_check(check, request.args[arg], validator)
        except ValueError:
            return api_error(400, "Bad request")
        except KeyError:
            pass
    query.finalize("ORDER BY bands.name COLLATE NOCASE")
    cur = query.execute()
    page = int(request.args.get("page", 0))
    page_size = 10
    page_off = page_size * page
    count, records = count_slice(cur, page_off, page_off+page_size)
    results = [
        make_band_object(db, record, user_id)
        for record in records
    ]
    return {
        "pages": iceil(count, page_size),
        "results": results
    }


@app.route(f"{API_PATH}/bands/images/<int:band_id>")
@with_session
@connect(img_db=IMG_DB)
def get_band_image(band_id):
    return get_image(img_db, False, "band_images", band_id)


@app.route(f"{API_PATH}/bands/images/<int:band_id>", methods=["PUT"])
@with_session
@connect(db=MAIN_DB, img_db=IMG_DB)
def set_band_image(band_id):
    if not is_band_owner(db, user_id, band_id):
        return api_error(401, "Unauthorized")
    return set_image(img_db, False, "band_images", band_id, 4*MB)


@app.route(f"{API_PATH}/band_services", methods=["POST"])
@with_session
@with_json(name=is_a(str), description=is_a(str), band_type=is_a(str), date=date.fromisoformat, start_time=time.fromisoformat, end_time=time.fromisoformat)
@connect(db=MAIN_DB)
def add_band_service():
    cur = db.cursor()
    start_date = datetime.combine(json.date, json.start_time)
    end_date = datetime.combine(json.date, json.end_time)
    if end_date <= start_date:
        end_date += timedelta(days=1)
    cur.execute(
            f"INSERT INTO band_services(owner, name, band_type, description, service_start, service_end) VALUES ({qmarks(6)})",
            (user_id, json.name, json.band_type, json.description, start_date, end_date))
    return {"band_serv_id": cur.lastrowid}


@app.route(f"{API_PATH}/band_services/<int:service_id>", methods=["PUT"])
@with_session
@with_json(name=is_a(str), description=is_a(str), band_type=is_a(str), date=date.fromisoformat, start_time=time.fromisoformat, end_time=time.fromisoformat)
@connect(db=MAIN_DB)
def update_band_service(service_id):
    cur = db.cursor()
    start_date = datetime.combine(json.date, json.start_time)
    end_date = datetime.combine(json.date, json.end_time)
    if end_date <= start_date:
        end_date += timedelta(days=1)
    cur.execute(
            f"UPDATE band_services SET owner = ?, name = ?, band_type = ?, description = ?, service_start = ?, service_end = ? WHERE id = ? AND owner = ?",
            (user_id, json.name, json.band_type, json.description, start_date, end_date, service_id, user_id))
    return modified_or_error(cur, 401, "Unauthorized")


@app.route(f"{API_PATH}/band_services/<int:service_id>", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def delete_band_service(service_id):
    cur = db.cursor()
    cur.execute("DELETE FROM band_services WHERE id = ? AND owner = ?", (service_id, user_id))
    if not modified(cur):
        return api_error(401, "Unauthorized")


BandServiceRecord = namedtuple("BandServiceRecord", "service_id name band_type description start_date end_date owner owner_name owner_email owner_phone interested_user_id")


def make_band_service_object(db, record, user_id):
    record = BandServiceRecord._make(record)
    ret = {
        "band_serv_id": record.service_id,
        "name": record.name,
        "owner": record.owner_name,
        "band_type": record.band_type,
        "description": record.description,
        "date": datetime.fromisoformat(record.start_date).date().isoformat(),
        "start_time": datetime.fromisoformat(record.start_date).time().isoformat(),
        "end_time": datetime.fromisoformat(record.end_date).time().isoformat(),
        "can_edit": record.owner == user_id,
        "contanct_info": None
    }
    if record.interested_user_id is not None:
        ret["contact_info"] = {
            "email": record.owner_email,
            "phone_number": record.owner_phone
        }
    return ret


@app.route(f"{API_PATH}/band_services/<int:service_id>")
@with_session
@connect(db=MAIN_DB)
def get_band_service(service_id):
    cur = db.cursor()
    cur.execute("""
        SELECT bs.id, bs.name, bs.band_type, bs.description, bs.service_start, bs.service_end,
               bs.owner, users.name, users.email, users.phone_number, bsi.user_id
        FROM band_services AS bs
             JOIN users ON bs.owner = users.id
             LEFT JOIN band_services_interested AS bsi ON bsi.band_service_id = bs.id AND bsi.user_id = ?
        WHERE bs.id = ?
        """, (user_id, service_id))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    return make_band_service_object(db, result, user_id)


def start_of_day(s):
    return datetime.combine(date.fromisoformat(s), time.min)


def end_of_day(s):
    return datetime.combine(date.fromisoformat(s), time.max)


@app.route(f"{API_PATH}/band_services")
@with_session
@connect(db=MAIN_DB)
def query_band_service():
    query = QueryGenerator(db, """
        SELECT bs.id, bs.name, bs.band_type, bs.description, bs.service_start, bs.service_end,
               bs.owner, users.name, users.email, users.phone_number, bsi.user_id
        FROM band_services AS bs
             JOIN users ON bs.owner = users.id
             LEFT JOIN band_services_interested AS bsi ON bsi.band_service_id = bs.id AND bsi.user_id = ?
        """, (user_id,))
    checks = (
        ("bs.name LIKE '%'||?||'%'", "name", identity),
        ("bs.description LIKE '%'||?||'%'", "description", identity),
        ("bs.band_type LIKE '%'||?||'%'", "type", identity),
        ("users.name LIKE '%'||?||'%'", "owner", identity),
        ("bs.service_start >= ?", "min_date", start_of_day),
        ("bs.service_start <= ?", "max_date", end_of_day),
    )
    for check, arg, validator in checks:
        try:
            query.add_check(check, request.args[arg], validator)
        except ValueError:
            return api_error(400, "Bad request")
        except KeyError:
            pass
    query.finalize("ORDER BY bs.service_start")
    cur = query.execute()
    page = int(request.args.get("page", 0))
    page_size = 10
    page_off = page_size * page
    count, records = count_slice(cur, page_off, page_off+page_size)
    results = [
        make_band_service_object(db, record, user_id)
        for record in records
    ]
    return {
        "pages": iceil(count, page_size),
        "results": results
    }


@app.route(f"{API_PATH}/band_services/interested/<int:service_id>", methods=["POST"])
@with_session
@connect(db=MAIN_DB)
def signal_service_interest(service_id):
    cur = db.cursor()
    cur.execute("SELECT owner, title FROM band_services WHERE id = ?", (service_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    owner, title = result
    if owner == user_id:
        return api_error(418, "I'm a teapot")
    try:
        cur.execute("INSERT INTO band_services_interested(band_service_id, user_id) VALUES (?, ?)", (service_id, user_id))
    except IntegrityError:
        pass
    else:
        create_notification(db, owner, f'An user is interested into your service: "{title}"', action_url=f"band_service;{service_id}", picture_url=f"/saed/api/band_services/images/{user_id}")
    return {}


@app.route(f"{API_PATH}/band_services/interested/<int:service_id>", methods=["DELETE"])
@with_session
@connect(db=MAIN_DB)
def revoke_service_interest(service_id):
    cur = db.cursor()
    cur.execute("SELECT owner, title FROM band_services WHERE id = ?", (service_id,))
    result = cur.fetchone()
    if result is None:
        return api_error(404, "Not found")
    owner, title = result
    cur.execute("DELETE FROM band_services_interested WHERE band_service_id = ? AND user_id = ?", (service_id, user_id))
    if cur.rowcount:
        create_notification(db, owner, f'An user is not interested anymore into your service: "{title}"', action_url=f"band_service;{service_id}", picture_url=f"/saed/api/band_service/images/{user_id}")
    return {}


@app.route(f"{API_PATH}/band_services/images/<int:service_id>")
@with_session
@connect(img_db=IMG_DB)
def get_band_service_image(service_id):
    return get_image(img_db, False, "band_service_images", service_id)


@app.route(f"{API_PATH}/band_services/images/<int:service_id>", methods=["PUT"])
@with_session
@connect(db=MAIN_DB, img_db=IMG_DB)
def set_band_service_image(service_id):
    if not is_service_owner(db, user_id, service_id):
        return api_error(401, "Unauthorized")
    return set_image(img_db, False, "band_service_images", service_id, 4*MB)


if __name__ == "__main__":
    app.run()
