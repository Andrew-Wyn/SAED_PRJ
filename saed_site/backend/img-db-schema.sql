CREATE TABLE profile_pictures (
    id INTEGER PRIMARY KEY,
    external_url TEXT,
    image BLOB,
    mime TEXT
);

CREATE TABLE ad_images (
    id INTEGER PRIMARY KEY,
    image BLOB,
    mime TEXT
);

CREATE TABLE band_images (
    id INTEGER PRIMARY KEY,
    image BLOB,
    mime TEXT
);

CREATE TABLE band_service_images (
    id INTEGER PRIMARY KEY,
    image BLOB,
    mime TEXT
);
