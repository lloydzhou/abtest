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
    result = redis.call("zscan", KEYS[1], cursor, "count", 100)
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

