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
    price INTEGER NOT NULL,
    owner INTEGER NOT NULL REFERENCES users(id),
    ad_type TEXT NOT NULL
);

CREATE TABLE ads_interested (
    ad_id INTEGER REFERENCES ads(id),
    user_id INTEGER REFERENCES users(id),
    PRIMARY KEY (ad_id, user_id)
);

CREATE TABLE bands (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    band_type TEXT NOT NULL,
    owner INTEGER NOT NULL REFERENCES users(id),
    seeking BOOL NOT NULL
);

CREATE TABLE band_members (
    user_id INTEGER REFERENCES users(id),
    band_id INTEGER REFERENCES bands(id),
    PRIMARY KEY (user_id, band_id)
);

CREATE TABLE band_applicants (
    user_id INTEGER REFERENCES users(id),
    band_id INTEGER REFERENCES bands(id),
    rejected BOOL NOT NULL,
    PRIMARY KEY (user_id, band_id)
);

CREATE TABLE band_services (
    id INTEGER PRIMARY KEY,
    owner INTEGER NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    band_type TEXT NOT NULL,
    description TEXT NOT NULL,
    service_start DATETIME NOT NULL,
    service_end DATETIME NOT NULL
);

CREATE TABLE band_services_interested (
    band_service_id INTEGER REFERENCES band_services(id),
    user_id INTEGER REFERENCES users(id),
    PRIMARY KEY (band_service_id, user_id)
);
