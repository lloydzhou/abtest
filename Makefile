ABADMIN?=abadmin
ABPASSWD?=abpasswd

INTERVAL?=60

build:
	docker build -t hawkeye:ab -f docker/Dockerfile .

passwd:
	docker run --rm -it xmartlabs/htpasswd $(ABADMIN) $(ABPASSWD)

run:
	# echo "$$(docker run --rm -it xmartlabs/htpasswd $(ABADMIN) $(ABPASSWD) )"
	docker run -it -e INTERVAL=$(INTERVAL) -e HTPASSWD="$$(docker run --rm -it xmartlabs/htpasswd $(ABADMIN) $(ABPASSWD) )" -v `pwd`/data:/data/:rw -p 80:80 -p 63791:6379 hawkeye:ab

