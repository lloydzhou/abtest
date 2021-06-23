local condition = require 'condition'

function tprint (tbl, indent)
  if not indent then indent = 0 end
  for k, v in pairs(tbl) do
    formatting = string.rep("  ", indent) .. k .. ": "
    if type(v) == "table" then
      print(formatting)
      tprint(v, indent+1)
    elseif type(v) == 'boolean' then
      print(formatting .. tostring(v))      
    else
      print(formatting .. v)
    end
  end
end

local c = condition.new('EQ(user_id,0001)')
print('eq ----------' .. tostring(c))

local str = 'NOT(AND(NOT(AND(EQ(name,aasdas),EQ(user_id,0001),NOT(AND(NOT(OR())))))))'
local c, r = parse(str)
print(c, r)
print('c-------------', c)

local d = {a=1, b=2, c=3, d=4}

print(d)
local a = 'a'
print(d.a, d.b, d.c, d['a'], d[a], d[3])

local o = {name='aasdas', user_id='0001'}
local r = condition.valid(c, o)
print(r)
tprint(c)

