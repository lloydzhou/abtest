FROM xmartlabs/htpasswd as htpasswd
RUN htpasswd -nb abadmin abpasswd > /tmp/htpasswd

FROM redis:alpine3.12

COPY --from=htpasswd /tmp/htpasswd /etc/nginx/htpasswd
COPY --from=openresty/openresty:alpine-apk /usr/local/openresty /usr/local/openresty
COPY --from=openresty/openresty:alpine-apk /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=openresty/openresty:alpine-apk /usr/lib/libgcc_s.so.1 /usr/lib/libgcc_s.so.1

# https://github.com/openresty/docker-openresty/blob/master/alpine-apk/Dockerfile
RUN mkdir -p /var/run/openresty \
    && ln -sf /dev/stdout /usr/local/openresty/nginx/logs/access.log \
    && ln -sf /dev/stderr /usr/local/openresty/nginx/logs/error.log

ENV PATH=$PATH:/usr/local/openresty/luajit/bin:/usr/local/openresty/nginx/sbin:/usr/local/openresty/bin

ENV HTPASSWD=
ENV INTERVAL=60

COPY ab.conf /etc/nginx/conf.d/default.conf
COPY dist /var/www/html
COPY lua /lua
RUN cd /usr/local/openresty/nginx/ \
  && luajit -bg /lua/init.lua ./init.ljbc \
  && luajit -bg /lua/init_worker.lua ./init_worker.ljbc \
  && echo '[[ ! -z "$HTPASSWD" ]] && echo "$HTPASSWD" > /etc/nginx/htpasswd || echo no htpasswd env set && openresty && redis-server' > /start.sh \
  && chmod +x /start.sh \
  && sed -i '1s/^/env INTERVAL;\n/' /usr/local/openresty/nginx/conf/nginx.conf

CMD ["sh", "-c", "/start.sh"]

STOPSIGNAL SIGQUIT

