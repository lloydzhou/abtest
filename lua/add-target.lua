
local var_name = ARGV[1]
local target_name = ARGV[2]

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 0 then
    return {-1, "var_name not exists"}
end

local target_exists = redis.call("sismember", "targets", target_name)
if target_exists == 1 then
    return {-1, "target_name already exists"}
end

local res = redis.call("sadd", "targets", target_name)
if not res then
    return {-1, "add target to targets failed"}
end

local res = redis.call("sadd", "targets:" .. var_name, target_name)
if not res then
    return {-1, "add target to targets:var_name failed"}
end

local time = redis.call("time")
local res = redis.call(
    "hmset", "target:" .. target_name,
    "var_name", var_name, "created", time[1], "modified", time[1]
)
if not res then
    return {-1, "save target failed"}
end

return {1, 'add target success'}

