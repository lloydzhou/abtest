# usin kvrocks as base, or redis(redis:alpine3.12)
ARG BASE=apache/kvrocks:nightly-20240602-309ea7b

# 生成一个默认的htpasswd
FROM xmartlabs/htpasswd as htpasswd
RUN htpasswd -nb abadmin abpasswd > /tmp/htpasswd

# 利用openresty里面的luajit编译两个lua脚本
FROM openresty/openresty:alpine-apk as openresty
COPY lua /lua
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf
RUN cd /usr/local/openresty/nginx/ \
  && luajit -bg /lua/init.lua ./init.ljbc \
  && luajit -bg /lua/init_worker.lua ./init_worker.ljbc \
  && luajit -bg /lua/router.lua ../lualib/router.ljbc \
  && luajit -bg /lua/condition.lua ../lualib/condition.ljbc \
  && luajit -bg /lua/api.lua ./api.ljbc


# 打包前端代码
FROM node:16.0.0-alpine3.13 as node

ADD ./package.json /app/
ADD ./yarn.lock /app/
ADD ./src /app/src
ADD ./public /app/public
ADD ./sw-precache-config.js /app/
ADD ./.eslintrc /app/
ADD ./.webpackrc /app/

RUN cd /app && yarn config set strict-ssl false && yarn install && yarn run build && ls -alh dist

# 多阶段打包
FROM ${BASE}

COPY --from=htpasswd /tmp/htpasswd /etc/nginx/htpasswd
COPY --from=openresty/openresty:alpine-apk /usr/lib/libgcc_s.so.1 /usr/lib/libgcc_s.so.1

ENV PATH=$PATH:/usr/local/openresty/luajit/bin:/usr/local/openresty/nginx/sbin:/usr/local/openresty/bin

ENV HTPASSWD=
ENV INTERVAL=60

ADD ./docker-entrypoint.sh /usr/local/bin/

COPY --from=node /app/dist /var/www/html

COPY --from=openresty /usr/local/openresty /usr/local/openresty

# https://github.com/openresty/docker-openresty/blob/master/alpine-apk/Dockerfile
RUN mkdir -p /var/run/openresty \
    && ln -sf /dev/stdout /usr/local/openresty/nginx/logs/access.log \
    && ln -sf /dev/stderr /usr/local/openresty/nginx/logs/error.log

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["--port", "6379"]
