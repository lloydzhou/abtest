-- init_worker.lua
function aggregate(red, key)
  local count = 0
  local sum = 0
  local mean = 0
  local s = 0
  local std = 0
  local min = 0
  local max = 0
  local cursor = "0"
  local result = nil
  local data = nil

  -- S(n) = S(n-1) + (x(n) - E(n-1))(x(n) - E(n-))

  repeat
    result = red:zscan(key, cursor, "count", 100)
    cursor, data = unpack(result)

    for i=1, #data, 2 do
      local score = tonumber(data[i + 1])

      count = count + 1
      sum = sum + score
      s = s + 1.0 * (count - 1) / count * (score - mean) * (score - mean)
      mean = mean + 1.0 * (score - mean) / count

      if i == 1 then
        min = score
        max = score
      else
        min = math.min(min, score)
        max = math.max(max, score)
      end
    end
  until cursor == "0"

  std = math.sqrt(s / (count - 1))

  return {
    tostring(count), tostring(sum),
    tostring(min), tostring(max),
    tostring(mean), tostring(std)
  }
end
function calc(penv)
  local red = redis:new()
  -- red:set_timeouts(100, 200, 200)
  red:set_timeout(1000)
  local ok, err = red:connect('127.0.0.1', 6379)
  if not ok then
    ngx.log(ngx.ERR, 'can not connect redis', err)
  end
  red:select(penv == 'production' and 1 or 0) -- 测试环境实验db0,正式环境实验db1
  local versions = red:sort("versions", "by", "*", "get", "#", "get", "version:*->var_name")
  local targets = red:sort("targets", "by", "*", "get", "#", "get", "target:*->var_name")
  for i, version in ipairs(versions) do
    if i % 2 == 1 then
      local version_var_name = versions[i + 1]
      if version_var_name then -- 少数数据有问题，拿不到var_name
        ngx.log(ngx.ERR, penv .. ", version_var_name: " .. version_var_name)
        local status = red:hget("var:" .. version_var_name, "status")
        if status == "running" then -- 只有运行中的实验才计算
          local target_count = 0
          for j, target in ipairs(targets) do
            if j % 2 == 1 then
              local target_var_name = targets[j + 1]
              if target_var_name == version_var_name then -- 只有版本和指标属于同一个实验才计算转化率
                local taggr = aggregate(red, "track:" .. version .. ":" .. target)
                if taggr then
                  local tuv, tpv, tmin, tmax, tmean, tstd = unpack(taggr)
                  red:hmset(
                    "version:" .. version,
                    target .. ":count", tpv,
                    target .. ":user", tuv,
                    target .. ":min", tmin,
                    target .. ":max", tmax,
                    target .. ":mean", tmean,
                    target .. ":std", tstd
                  )
                  target_count = target_count + 1
                  ngx.log(ngx.ERR, penv .. ", set target to version: " .. "version:" .. version .. " : " .. cjson.encode({taggr}))
                end
              end
            end
          end
          if target_count > 0 then -- 指标数量大于0的时候再处理PV和UV
            local aggr = aggregate(red, "uv:" .. version)
            if aggr then
              local uv, pv, min, max, mean, std = unpack(aggr)
              red:hmset(
                "version:" .. version, "pv", pv, "uv", uv,
                "uv:min", min, "uv:max", max, "uv:mean", mean, "uv:std", std
              )
              ngx.log(ngx.ERR, penv .. ", set pv to version: " .. "version:" .. version .. " : " .. cjson.encode({aggr}))
            end
          end
        end
      end
    end
  end
end
local delay = 10
local calc_timer_callback = function(premature)
  if not premature then
    ngx.log(ngx.ERR, 'run calc_timer_callback')
    calc('dev')
    calc('production')
    ngx.log(ngx.ERR, 'run calc end')
  end
end
if 0 == ngx.worker.id() then
  local ok, err = ngx.timer.every(delay, calc_timer_callback)
  if not ok then
    ngx.log(ngx.ERR, 'failed to create timer: ', err)
  end
end

