
-- ARGV: var_name, user_id
-- RETURN {1, {type, test, layer, value}}

local var_name = ARGV[1]
local user_id = ARGV[2]

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 0 then
    return {-1, "var_name not exists"}
end

local value = redis.call("hget", "user:value:" .. var_name, user_id)
local res = redis.call("hmget", "var:" .. var_name, "type", "name", "layer", "status", "weight", "default")
local typ, test, layer, status, layer_weight, default = unpack(res)

if not value then
    if not layer then
        return {-1, "layer not exists"} 
    end
    layer_weight = tonumber(layer_weight)
    if layer_weight <= 0 then
        return {-1, "test weight is zero"} 
    end
    local weights = redis.call(
        "sort", "value:" .. var_name,
        "by", "version:" .. var_name .. ":*->created",
        "get", "#", "get", "version:" .. var_name .. ":*->weight"
    )
    local i, v, val, weight
    local time = redis.call("TIME")
    
    math.randomseed(tonumber(time[1]))
    local random, real_weight = math.random(), 0
    for i, v in ipairs(weights) do
        if i % 2 == 1 then
            val = v
        else
            weight = tonumber(v)
            if weight > 0 then
                real_weight = real_weight + weight * layer_weight / 10000
                if random <= real_weight then
                    value = val
                    redis.call("hset", "user:value:" .. var_name, user_id, value)
                    break
                end
            end
        end
    end
end

if not value then
    value = default
end

redis.call("zincrby", "uv:" .. var_name .. ":" .. value, 1, user_id)

return {1, {typ, test, layer, value}}

