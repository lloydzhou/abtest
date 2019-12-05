
build:
	docker build -t ab -f docker/Dockerfile docker

init-redis:
	docker-compose exec redis redis-cli script load "$$(cat lua/redis-aggregate.lua)"
	docker-compose exec redis redis-cli script load "$$(cat lua/add-layer.lua)"
	docker-compose exec redis redis-cli script load "$$(cat lua/add-test.lua)"
	docker-compose exec redis redis-cli script load "$$(cat lua/add-target.lua)"
	docker-compose exec redis redis-cli script load "$$(cat lua/layer-weight.lua)"
	docker-compose exec redis redis-cli script load "$$(cat lua/test-weight.lua)"
	docker-compose exec redis redis-cli script load "$$(cat lua/get-var.lua)"
	docker-compose exec redis redis-cli script load "$$(cat lua/track.lua)"


