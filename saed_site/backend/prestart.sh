#!/bin/sh

sed "s/{uid}/$UWSGI_UID/;s/{gid}/$UWSGI_GID/" uwsgi.ini.template > uwsgi.ini
