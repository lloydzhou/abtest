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
        "weight", weight, "type", typ, "default", default,
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
  ]],
  ['get-var'] = [[
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
        local hash_weight, start_weight = (tonumber(hash) % 10000), 0
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
                    start_weight = start_weight + tonumber(v) * 100
                end
            end
        end
        if start_weight < hash_weight and hash_weight <= start_weight + layer_weight * 100 then
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
                        real_weight = real_weight + weight * layer_weight
                        if hash_weight <= real_weight then
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
  ]],
  ['track'] = [[
    -- 记录指标信息
    -- 参数不固定，但是最后一个参数是user_id
    -- 格式是key1: user_id, key2: date [target1] [inc1] [target2] [inc2]
    
    local user_id = KEYS[1]
    local today = KEYS[2]
    
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
    
    return {values, targets, traffic, args}
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
  ]]
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
    ngx.log(ngx.ERR, "load script", script_name, res)
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

