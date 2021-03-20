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
  local red = connect_redis()
  local sha = get_sha_by_script_name('get-var')
  local hash = murmurhash2(var_name .. ":" .. user_id)
  local res, err = red:evalsha(sha, 0, var_name, user_id, ngx.today(), hash)
  if err then
    response(200, -1, err)
  else
    local code, data = unpack(res)
    if code == 1 then
      local type, test, layer, value = unpack(data)
      response(200, 0, "success", {
        type=type, test=test, layer=layer, value=value,
        hash=hash,
      })
    else
      response(200, code, data)
    end
  end
  close_redis(red)
end)

r:post('/ab/track', function(params)
  ngx.req.read_body()
  local user_id = get_user_id()
  local data = ngx.req.get_body_data()
  if data then
    local params = cjson.decode(data)
    local sha = get_sha_by_script_name('track')
    local args = {user_id, ngx.today()}
    for target, inc in pairs(params) do
      table.insert(args, target)
      table.insert(args, inc)
    end
    local red = connect_redis()
    local res, err = red:evalsha(sha, 2, unpack(args))
    close_redis(red)
    response(200, 0, "success")
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

