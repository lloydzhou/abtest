
local exists = redis.call("sismember", "layers", ARGV[1])
if exists == 0 then
    return 0
end
return redis.call("sadd", "layers", ARGV[1])

