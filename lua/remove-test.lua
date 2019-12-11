
local var_name = ARGV[1]
local i, j, value, target

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 0 then
    return {-1, "test not exists"}
end

local res = redis.call("hmget", "var:" .. var_name, "layer", "status")
local layer, status = unpack(res)
if not layer or not status then
    return {-1, "can not get layer and status for var_name: " .. var_name}
end

if status ~= "stoped" then
    return {-1, "can not remove var_name when status not stoped"}
end

-- 删除当前层下面的实验
redis.call("zrem", "layer:" .. layer, var_name)

-- 删除全局的var_name
redis.call("srem", "vars", var_name)

-- 删除var_name
redis.call("del", "var:" .. var_name)

-- 删除user value
redis.call("del", "user:value:" .. var_name)

-- 删除流量统计数据
redis.call("del", "days:" .. var_name)

-- 找到对应的value(版本)，删除全局的版本以及存储这个实验版本的key
local targets = redis.call("smembers", "targets:" .. var_name)
for j, target in ipairs(targets) do
    redis.call("srem", "targets", target)
    redis.call("del", "target:" .. target)
end
redis.call("del", "targets:" .. var_name)

-- 找到对应的value(版本)，删除全局的版本以及存储这个实验版本的key
local values = redis.call("zrange", "value:" .. var_name, 0, -1)
for i, value in ipairs(values) do
    redis.call("srem", "versions", var_name .. ":" .. value)
    redis.call("del", "version:" .. var_name .. ":" .. value)
    redis.call("del", "uv:" .. var_name .. ":" .. value)
    for j, target in ipairs(targets) do
        redis.call("del", "track:" .. var_name .. ":" .. value .. ":" .. target)
    end
end
redis.call("del", "value:" .. var_name)

return {1, 'remove var_name success'}



