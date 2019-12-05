
local exists = redis.call("sismember", "layers", ARGV[1])
if exists == 1 then
    return {-1, "layer exists"}
end
return {redis.call("sadd", "layers", ARGV[1]), "add layer success"}

