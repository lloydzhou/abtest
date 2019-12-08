
-- lua/redis-aggregate.lua
local function aggregate(key)
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
      result = redis.call("zscan", key, cursor, "count", 100)
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

-- 记录日志
local log = {}

local calc = function(env)
  local i, j, version, target

  redis.call("select", env == "production" and 1 or 0)
  local versions = redis.call("smembers", "versions")
  local targets = redis.call("smembers", "targets")
  table.insert(log, env .. ", versions: " .. cjson.encode(versions) .. ", targets: " .. cjson.encode(targets))
  for i, version in ipairs(versions) do
    local version_var_name = redis.call("hget", "version:" .. version, "var_name")
    if version_var_name then
      local status = redis.call("hget", "var:" .. version_var_name, "status")
      if status == "running" then -- 只有运行中的实验才计算
        -- local aggr, aerr = redis.call("evalsha", sha, 1, "uv:" .. version)
        local aggr = aggregate("uv:" .. version)
        if aggr then
          local uv, pv, min, max, mean, std = unpack(aggr)
          redis.call("hmset",
            "version:" .. version, "pv", pv, "uv", uv,
            "uv:min", min, "uv:max", max, "uv:mean", mean, "uv:std", std
          )
          table.insert(log, env .. ", set pv to version: " .. "version:" .. version .. " : " .. cjson.encode({aggr}))
          for j, target in ipairs(targets) do
            local target_var_name = redis.call("hget", "target:" .. target, "var_name")
            if target_var_name == version_var_name then -- 只有版本和指标属于同一个实验才计算转化率
              -- local taggr, taerr = redis.call("evalsha", sha, 1, "track:" .. version .. ":" .. target)
              local taggr = aggregate("track:" .. version .. ":" .. target)
              if taggr then
                local tuv, tpv, tmin, tmax, tmean, tstd = unpack(taggr)
                redis.call("hmset",
                  "version:" .. version,
                  target .. ":count", tpv,
                  target .. ":user", tuv,
                  target .. ":min", tmin,
                  target .. ":max", tmax,
                  target .. ":mean", tmean,
                  target .. ":std", tstd
                )
                table.insert(log, env .. ", set target to version: " .. "version:" .. version .. " : " .. cjson.encode({taggr}))
              end
            end
          end
        end
      end
    end
  end
end

calc(ARGV[1])

return log

