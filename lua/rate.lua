
local var_name = ARGV[1]

local var_exists = redis.call("sismember", "vars", var_name)
if var_exists == 0 then
    return {-1, "var_name not exists"}
end

local targets = redis.call("smembers", "targets:" .. var_name)

local args = {
    'sort', 'value:' .. var_name, 'by', 'nosort',
    'get', '#',
    'get', 'version:' .. var_name .. ':*->var_name',
    'get', 'version:' .. var_name .. ':*->weight',
    'get', 'version:' .. var_name .. ':*->name',
    'get', 'version:' .. var_name .. ':*->pv',
    'get', 'version:' .. var_name .. ':*->uv',
    'get', 'version:' .. var_name .. ':*->uv:min',
    'get', 'version:' .. var_name .. ':*->uv:max',
    'get', 'version:' .. var_name .. ':*->uv:mean',
    'get', 'version:' .. var_name .. ':*->uv:std',
}
local j, target

for j, target in ipairs(targets) do
    table.insert(args, 'get')
    table.insert(args, 'version:' .. var_name .. ':*->' .. target .. ':count')
    table.insert(args, 'get')
    table.insert(args, 'version:' .. var_name .. ':*->' .. target .. ':user')
    table.insert(args, 'get')
    table.insert(args, 'version:' .. var_name .. ':*->' .. target .. ':min')
    table.insert(args, 'get')
    table.insert(args, 'version:' .. var_name .. ':*->' .. target .. ':max')
    table.insert(args, 'get')
    table.insert(args, 'version:' .. var_name .. ':*->' .. target .. ':mean')
    table.insert(args, 'get')
    table.insert(args, 'version:' .. var_name .. ':*->' .. target .. ':std')
end

local versions = redis.call(unpack(args))

return {versions, targets, args}

