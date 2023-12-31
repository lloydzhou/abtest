-- init.lua
local ffi = require "ffi"
ffi.cdef[[
  typedef unsigned char u_char;
  uint32_t ngx_murmur_hash2(u_char *data, size_t len);
]]
murmurhash2 = function(value)
  return tonumber(ffi.C.ngx_murmur_hash2(ffi.cast('uint8_t *', value), #value))
end
cjson = require "cjson"
cjson.encode_empty_table_as_object(false)
redis = require "resty.redis"
set_headers = function()
  ngx.header['Content-Type'] = 'application/json; charset=utf8'
  local origin = ngx.req.get_headers()['Origin']
  if origin then
    ngx.header['Access-Control-Allow-Origin'] = origin
    ngx.header['Access-Control-Allow-Credentials'] = 'true'
    ngx.header['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT, DELETE'
    ngx.header['Access-Control-Allow-Headers'] = 'X-Session-Id, X-Version, X-Env, X-User-Id'
  end
end
response = function(status, code, message, data)
  data = data or {}
  data["code"] = code
  data["msg"] = message
  -- ngx.log(ngx.ERR, "write data: ", ngx.headers_sent, status, cjson.encode(data))
  local value = ngx.headers_sent
  if value then
    ngx.log(ngx.ERR, "headers_sent, skip write data: ", status, cjson.encode(data))
    return
  end
  ngx.status = status
  set_headers()
  ngx.print(cjson.encode(data))
  ngx.eof()
end
connect_redis = function(penv)
  local red = redis:new()
  -- red:set_timeouts(100, 200, 200)
  red:set_timeout(1000)
  local ok, err = red:connect('127.0.0.1', 6379)
  if not ok then
    response(500, 1, 'can not connect redis')
  end
  red:select((penv or env()) == 'production' and 1 or 0) -- 测试环境实验db0,正式环境实验db1
  return red
end

local scripts = {
  ['add-layer'] = [[
    local exists = redis.call("sismember", "layers", ARGV[1])
    if exists == 1 then
        return {-1, "layer exists"}
    end
    return {redis.call("sadd", "layers", ARGV[1]), "add layer success"}
  ]],
  ['add-test'] = [[
    local layer = ARGV[1]
    local weight = tonumber(ARGV[2])
    local var_name = ARGV[3]
    local name = ARGV[4]
    local typ = ARGV[5]
    local default = ARGV[6]
    local condition = ARGV[7]
    
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
        "weight", weight, "type", typ, "default", default, "condition", condition,
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
  ]],
  ['add-target'] = [[
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
  ]],
  ['layer-weight'] = [[
    local layer_exists = redis.call("sismember", "layers", ARGV[1])
    if layer_exists == 0 then
        return {-1, "layer not exists"}
    end

    local var_exists = redis.call("sismember", "vars", ARGV[2])
    if var_exists == 0 then
        return {-1, "var_name not exists"}
    end

    local res = redis.call("hset", "var:" .. ARGV[2], 'weight', ARGV[3])
    if res ~= 0 then
        return {-1, "save weight to var failed"}
    end

    local res = redis.call("zadd", "layer:" .. ARGV[1], ARGV[3], ARGV[2])
    if res ~= 0 then
        return {-1, "add var to layer failed"}
    end

    return {1, 'edit layer success'}
  ]],
  ['test-weight'] = [[
    local var_name = ARGV[1]
    local value = ARGV[2]
    local weight = ARGV[3]
    local name = ARGV[4]

    local var_exists = redis.call("sismember", "vars", var_name)
    if var_exists == 0 then
        return {-1, "test not exists"}
    end

    local res = redis.call("zadd", "value:" .. var_name, weight, value)
    if not res then
        return {-1, "add version to test failed"}
    end

    local res = redis.call("sadd", "versions", var_name .. ":" .. value)
    if not res then
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

    -- backup old user value
    local key = "user:value:" .. var_name
    local backup_key = key .. ":backup"
    local cursor = "0"
    local result = nil
    local data = nil
    local args = nil
    repeat
        result = redis.call("hscan", key, cursor, "count", 50)
        cursor, data = unpack(result)
        args = {"hmset", backup_key}
        for i=1, #data, 2 do
            table.insert(args, data[i])
            table.insert(args, data[i + 1])
        end
        redis.call(unpack(args))
    until cursor == "0"

    local res = redis.call("del", key)
    if res ~= 0 then
        return {-1, "remove user value failed"}
    end

    return {1, 'edit version success'}
  ]],
  ['traffic'] = [[
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

    return {values, targets, traffic}
  ]],
  ['rate'] = [[
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
  ]],
  ['remove-test'] = [[
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
    redis.call("del", "user:value:" .. var_name .. ":backup")

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
  ]],
  ['save-attribute'] = [[
    local attr_name = ARGV[1]
    local name = ARGV[2]
    local type = ARGV[3]

    local time = redis.call("time")
    local res = redis.call("zadd", "user_attr_set", time[1], attr_name)
    if not res then
        return {-1, "add attr_name to attributes failed"}
    end

    local created = time[1]
    local res = redis.call("hget", "user_attr_name:" .. attr_name, "created")
    -- return {-1, "res" .. tostring(res)}
    if res then
        created = res
    end

    local res = redis.call(
        "hmset", "user_attr_name:" .. attr_name,
        "attribute", attr_name, "name", name, "type", type,
        "created", created, "modified", time[1]
    )
    if not res then
        return {-1, "save attribute failed"}
    end

    return {1, 'add attribute success'}
  ]],
  ['remove-attribute'] = [[
    local attr_name = ARGV[1]

    local res = redis.call("del", "user_attr_name:" .. attr_name)
    if not res then
        return {-1, "remove attr_name failed"}
    end

    local res = redis.call("zrem", "user_attr_set", attr_name)
    if not res then
        return {-1, "remove attr_name from attributes failed"}
    end

    return {1, 'remove attribute success'}
  ]],
}
local script_sha = {}
get_sha_by_script_name = function(script_name)
  if not script_sha[script_name] then
    local red = connect_redis()
    local res, err = red:script("load", scripts[script_name])
    if err then
      response(500, -1, 'err to load script' .. err)
    end
    script_sha[script_name] = res
    ngx.log(ngx.INFO, "load script", script_name, res)
  end
  local sha = script_sha[script_name]
  return sha
end
evalscript = function(script_name, ...)
  return evalsha(get_sha_by_script_name(script_name), ...)
end
evalsha = function(...)
  local red = connect_redis()
  local res, err = red:evalsha(...)
  if err then
    response(500, -1, err)
  else
    local code, msg = unpack(res)
    if code == 1 then
      response(200, 0, msg)
    else
      response(500, code, msg)
    end
  end
  close_redis(red)
end
close_redis = function(red)
  local ok, err = red:set_keepalive(10000, 100)
  if not ok then
    response(500, 1, 'failed to set keepalive: ' .. err)
  end
end
arg = function(name, default)
  local var = ngx.var['arg_' .. name]
  if not var or var == '' then
    local header = ngx.req.get_headers()[name]
    if not header or header == '' then
      if default then
        return default
      end
      response(400, 1, name .. ' is required')
    end
    return header
  end
  return ngx.unescape_uri(var)
end
env = function()
  return ngx.req.get_headers()['X-Env']
end
get_user_id = function()
  local user_id = ngx.req.get_headers()['X-User-Id']
  if user_id and user_id ~= '' then
    return user_id
  end
  local sid = ngx.req.get_headers()['X-Session-Id']
  if not sid or sid == '' then
    return response(400, -1, 'session_id is required')
  end
  local session_server = env() == 'production' and '10.0.0.32' or '10.0.0.17'
  local red = redis:new()
  red:set_timeouts(100, 200, 200)
  local ok, err = red:connect(session_server, 6379)
  if not ok then
    return response(500, 1, 'can not connect redis')
  end
  red:select(1)
  local res, err = red:get("carol:sid:" .. sid)
  if not res then
    ngx.log(ngx.ERR, "failed to get carol_user_id: ", err)
    return response(403, -1, 'can not get user_id')
  end
  if type(res) == "string" then
    local carol_user_id = cjson.decode(res)['user_id']
    if carol_user_id then
      return carol_user_id
    end
  end
  return response(400, -1, 'can not get user_id')
end

