#!/bin/sh
set -e

[ ! -z "$HTPASSWD" ] && echo "$HTPASSWD" > /etc/nginx/htpasswd || echo no htpasswd env set

openresty

# first arg is `-f` or `--some-option`
# or first arg is `something.conf`
if [ "${1#-}" != "$1" ] || [ "${1%.conf}" != "$1" ]; then
    if [ -f $(which kvrocks) ]; then
        kvrocks -c /var/lib/kvrocks/kvrocks.conf --dir /data --pidfile /var/run/kvrocks/kvrocks.pid --bind 0.0.0.0 --port 6379 "$@"
    else
	    set -- redis-server "$@"
    fi
else
    echo start "$@"
    "$@"
fi

