
local weights = {
    {30, 1},
    {40, 2},
    {30, 3},
}

local total = 0
local i, item
for i, item in ipairs(weights) do
    total = total + item[1]
end

local result = {}

local time = redis.call("TIME")
math.randomseed(tonumber(time[1]))

for i = 1,ARGV[1], 1 do
    local random = math.random(1, total)
    local j, t = 1, 0
    for j = 1, #weights, 1 do
        t = t + weights[j][1]
        if random < t then 
            table.insert(result, {random, weights[j][2]})
            break
        end
    end
end

local stats = {}
for i=1, #result, 1 do
    if not stats[result[i][2]] then
        stats[result[i][2]] = 0
    end
    stats[result[i][2]] = stats[result[i][2]] + 1
end

return {result, stats}

