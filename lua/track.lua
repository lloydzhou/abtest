

local user_id = ARGV[#ARGV]
local target, inc, i, v
local count, success = 0, 0
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
                        redis.call("zincrby", key, inc, user_id)
                        success = success + 1
                    end
                end
            end
        end
    end
end

return {1, {success, count}}

