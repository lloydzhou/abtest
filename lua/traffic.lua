
local var_name = ARGV[1]

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 0 then
    return {-1, "var_name not exists"}
end

local values = redis.call("zrange", "value:" .. var_name, 0, -1)
local targets = redis.call("smembers", "targets:" .. var_name)

local args = {"sort", "days:" .. var_name, "by", "*", "limit", 0, 100, "get", "#"}
local i, j, value, target

for i, value in ipairs(values) do
    table.insert(args, "get")
    table.insert(args, "day:*->" .. var_name .. ":" .. value .. ":pv")
    for j, target in ipairs(targets) do
        table.insert(args, "get")
        table.insert(args, "day:*->" .. var_name .. ":" .. value .. ":" .. target .. ":pv")
    end
end
table.insert(args, "desc")

local traffic = redis.call(unpack(args))

return {values, targets, traffic, args}

