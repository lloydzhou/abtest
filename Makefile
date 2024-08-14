ABADMIN?=abadmin
ABPASSWD?=abpasswd
# Change base Docker image from Alpine to Debian
# https://github.com/apache/kvrocks/pull/2348/files
BASE?=apache/kvrocks:nightly-20240602-309ea7b
TAG?=hawkeye:ab

INTERVAL?=60

build:
	docker build --build-arg BASE=$(BASE) -t $(TAG) -f docker/Dockerfile .

dist/index.js:
	yarn run build

passwd:
	docker run --rm -it xmartlabs/htpasswd $(ABADMIN) $(ABPASSWD)

run:
	# echo "$$(docker run --rm -it xmartlabs/htpasswd $(ABADMIN) $(ABPASSWD) )"
	docker run -it -e INTERVAL=$(INTERVAL) -e HTPASSWD="$$(docker run --rm -it xmartlabs/htpasswd $(ABADMIN) $(ABPASSWD) )" -v `pwd`/data:/data/:rw -p 80:80 -p 63791:6379 hawkeye:ab

