-- 记录指标信息
-- 参数不固定，但是最后一个参数是user_id
-- 格式是[target1] [inc1] [target2] [inc2] user_id

local user_id = ARGV[#ARGV]
local target, inc, i, v
local count, success = 0, 0
local time = redis.call("TIME")
local today = time[1] - (time[1] % 86400)
for i, v in ipairs(ARGV) do
    if i % 2 == 1 then
        target = v
    else
        inc = tonumber(v)
        if inc > 0 then
            count = count + 1
            local target_exists = redis.call("sismember", "targets", target)
            if target_exists == 1 then
                local var_name = redis.call("hget", "target:" .. target, "var_name")
                if var_name then
                    local value = redis.call("hget", "user:value:" .. var_name, user_id)
                    if value then
                        local key = "track:" .. var_name .. ":" .. value .. ":" .. target
                        -- 1. 在实验级别增加当天的日期；
                        -- 2. 在实验的hashset上以指标为target自增pv和uv
                        redis.call("sadd", "days:" .. var_name, today)
                        redis.call("hincrby", "day:" .. today, var_name .. ":" .. value .. ":" .. target .. ":pv", 1)
                        redis.call("zincrby", key, inc, user_id)
                        success = success + 1
                    end
                end
            end
        end
    end
end


return {1, {success, count}}

