local condition = require 'condition'
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
    'get', 'var:*->condition',
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
  local condition = params.condition

  evalscript('add-test', 0, layer_name, layer_weight, var_name, test_name, type, default, condition)
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

r:get('/ab/users', function(params)
  local attr_name = params.attr_name
  local page = tonumber(params.page or 1)
  local red = connect_redis()
  local res, err = red:sort(
    'user_attr:' .. attr_name, 'by', 'user_attr:*->created',
    'get', '#', 'get', 'user_attr:*->name',
    'get', 'user_attr:*->modified'
  )
  if err then
    close_redis(red)
    return response(500, 1, 'get users failed')
  end
  close_redis(red)
  response(200, 0, "success", {
    users=res,
  })
end)

r:get('/ab/user/:user_id', function(params)
  local user_id = params.user_id
  local red = connect_redis()
  local res, err = red:hgetall('user_attr:' .. user_id)
  if err then
    close_redis(red)
    return response(500, 1, 'get user info failed')
  end
  close_redis(red)
  response(200, 0, "success", {
    user=res,
  })
end)

r:post('/ab/user/:user_id', function(params)
  local user_id = params.user_id
  local red = connect_redis()

  local time = ngx.time()
  local created = time
  local res, err = red:hget("user_attr:" .. user_id, "created")
  if not err and res ~= ngx.null then
      created = res
  end

  params['created'] = created
  params['modified'] = time

  local args = {'user_attr:' .. user_id}
  for key, value in pairs(params) do
    local res, err = red:zadd('user_attr:' .. key, time, user_id)
    if err then
      close_redis(red)
      return response(500, 1, 'set user attribute failed')
    end
    table.insert(args, key)
    table.insert(args, value)
  end

  local res, err = red:hmset(unpack(args))
  if err then
    close_redis(red)
    return response(500, 1, 'set user info failed')
  end
  close_redis(red)
  response(200, 0, "success")
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
    return response(500, -1, 'get var_name failed: ' .. var_name)
  end
  if var_exists == 0 then
      close_redis(red)
      return response(500, -1, "var_name not exists: " .. var_name)
  end

  local value, err = red:hget("user:value:" .. var_name, user_id)
  if err then
    close_redis(red)
    return response(500, -1, 'get user value failed: ' .. var_name)
  end
  local res, err = red:hmget("var:" .. var_name, "type", "name", "layer", "status", "weight", "default", "condition")
  if err then
    close_redis(red)
    return response(500, -1, 'get var attribute failed: ' .. var_name)
  end
  local typ, test, layer, status, layer_weight, default, conditionstr = unpack(res)

  layer_weight = tonumber(layer_weight)
  if not layer then
      close_redis(red)
      return response(500, -1, "layer not exists")
  end
  if layer_weight <= 0 then
      -- return {-1, "test weight is zero"}
      -- 流量层分配流量为0，返回默认值，不记录pv等信息
      close_redis(red)
      return response(200, 0, "success", {
          type=typ, test=test, layer=layer, value=default, hash=hash,
      })
  end

  if value == ngx.null then
      -- 找不到已经进入实验的记录，先判断属性，再计算流量
      local status, c = pcall(condition.new, conditionstr)
      if status == false then
          -- status == false代表解析失败
          close_redis(red)
          return response(200, 0, "success", {
              type=typ, test=test, layer=layer, value=default, hash=hash,
          })
      else
          local res, err = red:hgetall('user_attr:' .. user_id)
          if err then
            close_redis(red)
            return response(500, 1, 'get user info failed')
          end
          local user_info = {}
          local i, v, var
          for i, v in ipairs(res) do
              if i % 2 == 1 then
                  var = v
              else
                  user_info[var] = v
              end
          end
          -- 解析成功的时候，如果验证是false也直接返回
          local status, valid = pcall(condition.valid, c, user_info)
          -- ngx.log(ngx.ERR, "status", status, "valid", valid, user_id, c, cjson.encode(user_info))
          if status == false or valid == false then
              close_redis(red)
              return response(200, 0, "success", {
                  type=typ, test=test, layer=layer, value=default, hash=hash,
                  status=status, valid=valid,
                  -- user_info=user_info,
                  condition=conditionstr,
              })
          end
          ngx.log(ngx.ERR, "status", status, "valid", valid, user_id, c, cjson.encode(user_info))
      end

      -- [推荐改进] 使用浮点数映射取代取模，消除 Modulo Bias
      -- 1. 将 32 位 hash 值映射到 [0, 1) 区间的浮点数
      local hash_float = (tonumber(hash) / 4294967295.0)
      -- 2. 将浮点数映射到 [0, 10000) 的整数空间
      local hash_weight = math.floor(hash_float * 10000)

      local start_weight = 0
      local layer_weights, err = red:sort(
          "layer:" .. layer,
          "by", "var:*->created",
          "get", "#", "get", "var:*->weight"
      )
      if err then
        close_redis(red)
        return response(500, -1, "get layer weights failed: " .. layer)
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
      -- [修正] 1. 统一使用左闭右开区间 [start, end)，不再需要对 0 进行特殊处理。
      local end_weight = start_weight + layer_weight * 100
      if hash_weight >= start_weight and hash_weight < end_weight then
          local weights, err = red:sort(
              "value:" .. var_name,
              "by", "version:" .. var_name .. ":*->created",
              "get", "#", "get", "version:" .. var_name .. ":*->weight"
          )

          if err then
            close_redis(red)
            return response(500, -1, "get weights failed: " .. var_name)
          end

          -- [修正] 2. 隔离两层随机分配。将 hash_weight 映射到实验自身的流量区间 [0, layer_weight * 100) 内。
          local version_hash_weight = hash_weight - start_weight
          local version_start_weight = 0

          for i, v in ipairs(weights) do
              if i % 2 == 1 then
                  val = v
              else
                  weight = tonumber(v)
                  if weight > 0 then
                      -- [修正] 3. 版本区间的计算与 layer_weight 和 start_weight 完全解耦。
                      local version_end_weight = version_start_weight + weight * layer_weight
                      if version_hash_weight >= version_start_weight and version_hash_weight < version_end_weight then
                          value = val
                          red:hset("user:value:" .. var_name, user_id, value)
                          break
                      end
                      version_start_weight = version_end_weight
                  end
              end
          end
      else
          -- 流量层内不在实验对应的流量范围，使用默认值
          close_redis(red)
          return response(200, 0, "success", {
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
  return response(200, 0, "success", {
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
    local skip = {}
    local red = connect_redis()
    for target, inc in pairs(params) do
        if inc > 0 then
            count = count + 1
            local target_exists, err = red:sismember("targets", target)
            if not err and target_exists == 1 then
                local var_name, err = red:hget("target:" .. target, "var_name")
                if not err and var_name then
                    local value, err = red:hget("user:value:" .. var_name, user_id)
                    if not err and value == ngx.null then
                        -- 尝试使用备份的值
                        local bvalue, err = red:hget("user:value:" .. var_name .. ":backup", user_id)
                        if not err and bvalue ~= ngx.null then
                            value = bvalue
                        end
                    end
                    if not err and value ~= ngx.null then
                        local key = var_name .. ":" .. value .. ":" .. target
                        -- 1. 在实验级别增加当天的日期；
                        -- 2. 在实验的hashset上以指标为target自增pv和uv
                        red:sadd("days:" .. var_name, today)
                        red:hincrby("day:" .. today, key .. ":pv", 1)
                        red:zincrby("track:" .. key, inc, user_id)
                        success = success + 1
                        table.insert(skip, {target=target, inc=inc, user_id=user_id})
                    else
                        table.insert(skip, {target=target, inc=inc, user_id=user_id, err="version"})
                    end
                else
                    table.insert(skip, {target=target, inc=inc, user_id=user_id, err="var_name"})
                end
            else
                table.insert(skip, {target=target, inc=inc, user_id=user_id, err="target_exists"})
            end
        end
    end
    close_redis(red)
    response(200, 0, "success", {count=count, success=success, data=skip})
  end
end)

local post_args = {}
if ngx.req.get_headers()['Content-Type'] == 'application/json' then
  post_args = cjson.decode(ngx.req.get_body_data())
else
  post_args = ngx.req.get_post_args()
end
local ok, errmsg = r:execute(
  ngx.var.request_method,
  ngx.var.uri,
  ngx.req.get_uri_args(),  -- all these parameters
  post_args -- will be merged in order
)

if not ok then
  response(404, 0, "not found")
  ngx.log(ngx.ERR, errmsg)
end

