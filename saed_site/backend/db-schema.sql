CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    account_type TINYINT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    given_name TEXT,
    family_name TEXT,
    phone_number TEXT,
    musician BOOL NOT NULL,
    instrument_supplier BOOL NOT NULL,
    club_owner BOOL NOT NULL,
    UNIQUE (account_type, email) ON CONFLICT ROLLBACK
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    message TEXT NOT NULL,
    action_url TEXT,
    picture_url TEXT
);

CREATE TABLE ads (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price TEXT NOT NULL,
    owner INTEGER NOT NULL REFERENCES users(id),
    ad_type TEXT NOT NULL
);

CREATE TABLE ads_interested (
    ad_id INTEGER,
    user_id INTEGER,
    PRIMARY KEY (ad_id, user_id)
);
