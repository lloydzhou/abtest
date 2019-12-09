
-- ARGV: var_name, user_id
-- RETURN {1, {type, test, layer, value}}

local var_name = ARGV[1]
local user_id = ARGV[2]
local today = ARGV[3]
local hash = ARGV[4]

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 0 then
    return {-1, "var_name not exists"}
end

-- local time = redis.call("TIME")
local value = redis.call("hget", "user:value:" .. var_name, user_id)
local res = redis.call("hmget", "var:" .. var_name, "type", "name", "layer", "status", "weight", "default")
local typ, test, layer, status, layer_weight, default = unpack(res)

layer_weight = tonumber(layer_weight)
if not layer then
    return {-1, "layer not exists"}
end
if layer_weight <= 0 then
    -- return {-1, "test weight is zero"}
    -- 流量层分配流量为0，返回默认值，不记录pv等信息
    return {1, {typ, test, layer, default}}
end

if not value then
    local hash_weight, start_weight = (tonumber(hash) % 100) / 100, 0
    local layer_weights = redis.call(
        "sort", "layer:" .. layer,
        "by", "var:*->created",
        "get", "#", "get", "var:*->weight"
    )
    local i, v, var, val, weight
    for i, v in ipairs(layer_weights) do
        if i % 2 == 1 then
            var = v
        else
            if var == var_name then
                break -- 找到对应的实验就退出
            else
                start_weight = start_weight + tonumber(v)
            end
        end
    end
    if start_weight < hash_weight and hash_weight <= start_weight + layer_weight then
        local weights = redis.call(
            "sort", "value:" .. var_name,
            "by", "version:" .. var_name .. ":*->created",
            "get", "#", "get", "version:" .. var_name .. ":*->weight"
        )

        local real_weight = start_weight
        for i, v in ipairs(weights) do
            if i % 2 == 1 then
                val = v
            else
                weight = tonumber(v)
                if weight > 0 then
                    real_weight = real_weight + weight * layer_weight / 100
                    if random <= real_weight then
                        value = val
                        redis.call("hset", "user:value:" .. var_name, user_id, value)
                        break
                    end
                end
            end
        end
    else
        -- 流量层内不在实验对应的流量范围，使用默认值
        return {1, {typ, test, layer, default}}
    end
end

if not value then
    value = default
end

local version = var_name .. ":" .. value
-- 1. 在实验级别增加当天的日期；
-- 2. 在实验的hashset上以版本为key自增pv和uv
redis.call("sadd", "days:" .. var_name, today)
redis.call("hincrby", "day:" .. today, var_name .. ":" .. value .. ":pv", 1)
-- 3. 实验pv按用户自增
redis.call("zincrby", "uv:" .. version, 1, user_id)

return {1, {typ, test, layer, value}}


