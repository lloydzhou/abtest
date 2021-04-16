local router = require 'router'
local r = router.new()

ngx.req.read_body()

r:get('/ab/layers', function(params)
  local red = connect_redis()
  local res, err = red:smembers("layers")
  if err then
    close_redis(red)
    return response(500, 1, 'get layers failed')
  end
  close_redis(red)
  response(200, 0, "success", {layers=res})
end)

r:post('/ab/layer/add', function(params)
  local layer_name = arg('layer')
  evalscript('add-layer', 0, layer_name)
end)

r:post('/ab/layer/weight', function(params)
  local layer_name = arg('layer')
  local var_name = arg('var')
  local weight = tonumber(arg('weight'))
  -- TODO sum(weight) = 100
  if weight < 0 or  weight > 100 then
    return response(400, 1, 'weight is not validate')
  end
  evalscript('layer-weight', 0, layer_name, var_name, weight)
end)

r:get('/ab/tests', function(params)
  local red = connect_redis()
  -- sort vars by nosort get # get *->name get *->layer get *->type get *->status get *->default
  local res, err = red:sort(
    "vars", 'by', 'var:*->modified',
    'get', '#', 'get', 'var:*->name',
    'get', 'var:*->layer', 'get', 'var:*->type', 'get', 'var:*->status',
    'get', 'var:*->default', 'get', 'var:*->created', 'get', 'var:*->modified',
    'get', 'var:*->weight',
    'DESC'
  )
  if err then
    close_redis(red)
    return response(500, 1, 'get test failed')
  end
  close_redis(red)
  response(200, 0, "success", {tests=res})
end)


r:post('/ab/test/action', function(params)
  local var_name = arg('var')
  local action = arg('action')
  if action == 'running' or action == 'stoped' or action == 'deleted' then
    local red = connect_redis()
    local res, err = red:sismember("vars", var_name)
    if err or res == 0 then
      close_redis(red)
      return response(404, 1, 'var_name: ' .. var_name .. ' not exists, edit var failed.')
    end
    if action == "deleted" then
      return evalscript('remove-test', 0, var_name)
    else
      local res, err = red:hmset('var:' .. var_name, 'status', action, 'modified', ngx.time())
      if err then
        close_redis(red)
        return response(500, 1, 'set var failed, var_name: ' .. var_name)
      end
    end
    close_redis(red)
  end
  response(200, 0, 'edit test success')
end)

r:post('/ab/test/add', function(params)
  local layer_name = arg('layer')
  local layer_weight = tonumber(arg('layer_weight'))
  if layer_weight < 0 or  layer_weight > 100 then
    return response(400, 1, 'layer_weight is not validate')
  end
  local var_name = arg('var')
  local test_name = arg('test_name')
  local type = arg('type')
  local default = arg('default')

  evalscript('add-test', 0, layer_name, layer_weight, var_name, test_name, type, default)
end)

r:post('/ab/test/weight', function(params)
  local var_name = arg('var')
  local value = arg('val')
  local name = arg('name', value)
  local weight = tonumber(arg('weight'))
  if weight < 0 or  weight > 100 then
    return response(400, 1, 'weight is not validate')
  end

  evalscript('test-weight', 0, var_name, value, weight, name)
end)

r:get('/ab/test/traffic', function(params)
  local var_name = arg('var')
  local red = connect_redis()
  local sha = get_sha_by_script_name('traffic')
  local res, err = red:evalsha(sha, 0, var_name)
  local values, targets, traffic, args = unpack(res)
  close_redis(red)
  response(200, 0, "success", {
    values=values,
    targets=targets,
    traffic=traffic,
    args=args,
  })
end)

r:get('/ab/test/rate', function(params)
  local var_name = arg('var')
  local red = connect_redis()
  local sha = get_sha_by_script_name('rate')
  local res, err = red:evalsha(sha, 0, var_name)
  local versions, targets, args = unpack(res)
  close_redis(red)
  response(200, 0, "success", {
    versions=versions,
    targets=targets,
  })
end)

r:get('/ab/versions', function(params)
  local red = connect_redis()
  local res, err = red:sort(
    'versions', 'by', 'nosort',
    'get', '#', 'get', 'version:*->var_name', 'get', 'version:*->name',
    'get', 'version:*->value', 'get', 'version:*->weight',
    'get', 'version:*->pv', 'get', 'version:*->uv',
    'get', 'version:*->created', 'get', 'version:*->modified'
  )
  if err then
    close_redis(red)
    return response(500, 1, 'get target failed')
  end
  close_redis(red)
  response(200, 0, "success", {
    versions=res,
  })
end)

r:get('/ab/attrs', function(params)
  local red = connect_redis()
  local res, err = red:sort(
    'user_attr_set', 'by', 'user_attr_name:*->created',
    'get', '#', 'get', 'user_attr_name:*->name',
    'get', 'user_attr_name:*->type',
    'get', 'user_attr_name:*->created',
    'get', 'user_attr_name:*->modified'
  )
  if err then
    close_redis(red)
    return response(500, 1, 'get attributes failed')
  end
  close_redis(red)
  response(200, 0, "success", {
    attributes=res,
  })
end)

r:post('/ab/attrs', function(params)
  local attr_name = arg('attr_name')
  local name = arg('name')
  local type = arg('type')
  evalscript('save-attribute', 0, attr_name, name, type)
end)

r:delete('/ab/attrs', function(params)
  local attr_name = arg('attr_name')
  evalscript('remove-attribute', 0, attr_name)
end)

r:get('/ab/targets', function(params)
  local red = connect_redis()
  local res, err = red:sort(
    'targets', 'by', 'nosort',
    'get', '#', 'get', 'target:*->var_name',
    'get', 'target:*->count', 'get', 'target:*->rate'
  )
  if err then
    close_redis(red)
    return response(500, 1, 'get target failed')
  end
  close_redis(red)
  response(200, 0, "success", {
    targets=res,
  })
end)

r:post('/ab/target/add', function(params)
  local var_name = arg('var')
  local target_name = arg('target')
  evalscript('add-target', 0, var_name, target_name)
end)


r:options('/ab/var', function(params)
  set_headers()
  ngx.exit(ngx.HTTP_OK)
end)

r:get('/ab/var', function(params)
  local user_id = get_user_id()
  local var_name = arg('name')
  local hash = murmurhash2(var_name .. ":" .. user_id)
  local red = connect_redis()

  local var_exists, err = red:sismember("vars", var_name)
  if err then
    close_redis(red)
    return response(500, -1, 'get var_name failed', var_name)
  end
  if var_exists == 0 then
      close_redis(red)
      return response(500, -1, "var_name not exists", var_name)
  end

  local value, err = red:hget("user:value:" .. var_name, user_id)
  if err then
    close_redis(red)
    return response(500, -1, 'get user value failed', var_name)
  end
  local res, err = red:hmget("var:" .. var_name, "type", "name", "layer", "status", "weight", "default")
  if err then
    close_redis(red)
    return response(500, -1, 'get var attribute failed', var_name)
  end
  local typ, test, layer, status, layer_weight, default = unpack(res)

  layer_weight = tonumber(layer_weight)
  if not layer then
      close_redis(red)
      return response(500, -1, "layer not exists")
  end
  if layer_weight <= 0 then
      -- return {-1, "test weight is zero"}
      -- 流量层分配流量为0，返回默认值，不记录pv等信息
      close_redis(red)
      return response(200, 1, "success", {
          type=typ, test=test, layer=layer, value=default, hash=hash,
      })
  end

  if value == ngx.null then
      local hash_weight, start_weight = (tonumber(hash) % 10000), 0
      local layer_weights, err = red:sort(
          "layer:" .. layer,
          "by", "var:*->created",
          "get", "#", "get", "var:*->weight"
      )
      if err then
        close_redis(red)
        return response(500, -1, "get layer weights failed", layer)
      end
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
      -- 之前只考虑了半开半闭的区间，但是忽略了为0这个点
      if (start_weight < hash_weight and hash_weight <= start_weight + layer_weight * 100) or (0 == start_weight and 0 == hash_weight) then
          local weights, err = red:sort(
              "value:" .. var_name,
              "by", "version:" .. var_name .. ":*->created",
              "get", "#", "get", "version:" .. var_name .. ":*->weight"
          )

          if err then
            close_redis(red)
            return response(500, -1, "get weights failed", var_name)
          end
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
                          red:hset("user:value:" .. var_name, user_id, value)
                          break
                      end
                  end
              end
          end
      else
          -- 流量层内不在实验对应的流量范围，使用默认值
          close_redis(red)
          return response(200, 1, "success", {
              type=typ, test=test, layer=layer, value=default, hash=hash,
          })
      end
  end

  if value == ngx.null then
      value = default
  end

  local version = var_name .. ":" .. value
  -- 1. 在实验级别增加当天的日期；
  -- 2. 在实验的hashset上以版本为key自增pv和uv
  local today = ngx.today()
  red:sadd("days:" .. var_name, today)
  red:hincrby("day:" .. today, var_name .. ":" .. value .. ":pv", 1)
  -- 3. 实验pv按用户自增
  red:zincrby("uv:" .. version, 1, user_id)

  close_redis(red)
  return response(200, 1, "success", {
      type=typ, test=test, layer=layer, value=value, hash=hash,
  })
end)

r:post('/ab/track', function(params)
  ngx.req.read_body()
  local user_id = get_user_id()
  local today = ngx.today()
  local data = ngx.req.get_body_data()
  if data then
    local params = cjson.decode(data)
    local count, success = 0, 0
    local red = connect_redis()
    for target, inc in pairs(params) do
        if inc > 0 then
            count = count + 1
            local target_exists, err = red:sismember("targets", target)
            if not err and target_exists == 1 then
                local var_name, err = red:hget("target:" .. target, "var_name")
                if not err and var_name then
                    local value, err = red:hget("user:value:" .. var_name, user_id)
                    if value then
                        local key = "track:" .. var_name .. ":" .. value .. ":" .. target
                        -- 1. 在实验级别增加当天的日期；
                        -- 2. 在实验的hashset上以指标为target自增pv和uv
                        red:sadd("days:" .. var_name, today)
                        red:hincrby("day:" .. today, var_name .. ":" .. value .. ":" .. target .. ":pv", 1)
                        red:zincrby(key, inc, user_id)
                        success = success + 1
                    end
                end
            end
        end
    end
    close_redis(red)
    response(200, 0, "success", {count=count, success=success})
  end
end)

local ok, errmsg = r:execute(
  ngx.var.request_method,
  ngx.var.uri,
  ngx.req.get_uri_args(),  -- all these parameters
  ngx.req.get_post_args(), -- will be merged in order
  {version = '1.0'}         -- into a single "params" table
)

if not ok then
  response(404, 0, "not found")
  ngx.log(ngx.ERR, errmsg)
end

