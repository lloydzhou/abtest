
local layer = ARGV[1]
local weight = tonumber(ARGV[2])
local var_name = ARGV[3]
local name = ARGV[4]
local typ = ARGV[5]
local default = ARGV[6]

local layer_exists = redis.call("sismember", "layers", layer)
if layer_exists == 0 then
    return {-1, "layer not exists"}
end

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 1 then
    return {-1, "var_name exists"}
end

local res = redis.call("sadd", "vars", var_name)
if not res then
    return {-1, "add var_name to vars failed"}
end

local res = redis.call("zadd", "layer:" .. layer, weight, var_name)
if not res then
    return {-1, "add var_name to layer failed"}
end

local time = redis.call("time")
local res = redis.call(
    "hmset", "var:" .. var_name,
    "layer", layer, "name", name,
    "weight", weight, "type", typ, "default", default,
    "status", "init", "created", time[1], "modified", time[1]
)
if not res then
    return {-1, "save var_name failed"}
end

local res = redis.call("zadd", "value:" .. var_name, 100, default)
if not res then
    return {-1, "add default to value list failed"}
end

local res = redis.call("sadd", "versions", var_name .. ":" .. default)
if not res then
    return {-1, "add default value to versions failed"}
end

local res = redis.call(
    "hmset", "version:" .. var_name .. ":" .. default,
    "value", default, "name", "默认版本", "weight", 100,
    "var_name", var_name, "created", time[1], "modified", time[1]
)
if not res then
    return {-1, "save version failed"}
end

return {1, 'add version success'}

