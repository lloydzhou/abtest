
local layer_exists = redis.call("sismember", "layers", ARGV[1])
if layer_exists == 0 then
    return {-1, "layer not exists"}
end

local var_exists = redis.call("sismember", "vars", ARGV[2])
if var_exists == 0 then
    return {-1, "var_name not exists"}
end

local res = redis.call("hset", "var:" .. ARGV[2], 'weight', ARGV[3])
if res ~= 0 then
    return {-1, "save weight to var failed"}
end

local res = redis.call("zadd", "layer:" .. ARGV[1], ARGV[3], ARGV[2])
if res ~= 0 then
    return {-1, "add var to layer failed"}
end

return {1, 'edit layer success'}



