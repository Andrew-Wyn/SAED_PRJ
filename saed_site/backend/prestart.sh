#!/bin/sh

sed -i "s/{uid}/$UWSGI_UID/;s/{gid}/$UWSGI_GID/" uwsgi.ini
