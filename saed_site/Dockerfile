FROM agostof/uwsgi-nginx-flask:python3.8

ARG UWSGI_UID=0
ARG UWSGI_GID=0

ENV UWSGI_UID=$UWSGI_UID
ENV UWSGI_GID=$UWSGI_GID

COPY requirements.txt /tmp/
RUN pip install --requirement /tmp/requirements.txt
