
local var_name = ARGV[1]
local value = ARGV[2]
local weight = ARGV[3]
local name = ARGV[4]

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 0 then
    return {-1, "test not exists"}
end

local res = redis.call("zadd", "value:" .. var_name, weight, value)
if res ~= 0 then
    return {-1, "add version to test failed"}
end

local res = redis.call("sadd", "versions", var_name .. ":" .. value)
if res ~= 0 then
    return {-1, "add version to versions failed"}
end

local time = redis.call("time")
local res = redis.call(
    "hmset", "version:" .. var_name .. ":" .. value,
    "value", value, "name", name, "weight", weight,
    "var_name", var_name, "modified", time[1]
)
if not res then
    return {-1, "save weight to version failed"}
end

local res = redis.call("del", "user:value:" .. var_name)
if res ~= 0 then
    return {-1, "remove user value failed"}
end

return {1, 'edit version success'}



