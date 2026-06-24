#!/bin/sh
set -e

[ ! -z "$HTPASSWD" ] && echo "$HTPASSWD" > /etc/nginx/htpasswd || echo no htpasswd env set

# 重新编译 lua 源文件为 ljbc 字节码（开发时使用挂载的 /lua 目录）
if [ -d /lua ]; then
  echo "compiling lua scripts from /lua ..."
  cd /usr/local/openresty/nginx/
  luajit -bg /lua/init.lua ./init.ljbc
  luajit -bg /lua/init_worker.lua ./init_worker.ljbc
  luajit -bg /lua/router.lua ../lualib/router.ljbc
  luajit -bg /lua/condition.lua ../lualib/condition.ljbc
  luajit -bg /lua/api.lua ./api.ljbc
  echo "lua scripts compiled."
  cd /
fi

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

