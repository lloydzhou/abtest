local count = 0
local sum = 0
local min = 0
local max = 0
local cursor = "0"
local result = nil
local data = nil

repeat 
    result = redis.call("zscan", KEYS[1], cursor, "count", 100)
    cursor, data = unpack(result)

    for i=1, #data, 2 do
        local score = tonumber(data[i + 1])

        count = count + 1
        sum = sum + score

        if i == 1 then
            min = score
            max = score
        else
            min = math.min(min, score)
            max = math.max(max, score)
        end
    end
until cursor == "0"

return {
    count, sum, min, max
}
