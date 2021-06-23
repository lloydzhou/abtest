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

local condition = {}
local mt = {
    __index = {
    },
    __tostring = function(self)
      local result = {self.op, '('}
      for j, i in ipairs(self.target) do
        if i ~= nil then
          table.insert(result, tostring(i))
          if j < #self.target then
            table.insert(result, ',')
          end
        end
      end
      table.insert(result, ')')
      return table.concat(result)
    end
}

function parse(str)
  local op = str:match('^([A-Z]+)')
  if op then
    local targetstr = str:sub(#op + 2, #str)
    if targetstr == '' then
      return condition.new(op, ''), ''
    end
    local target, remain = parse(targetstr)
    if not target.op and remain:sub(1, 1) == ',' then
      return condition.new(op, table.unpack(target)), remain
    end
    if target.op then
      target = {target}
    end
    while remain:sub(1, 1) == ',' do
      local t, r = parse(remain:sub(2, #remain))
      target[#target + 1] = t
      remain = r
    end
    return condition.new(op, table.unpack(target)), remain:sub(2, #remain)
  else
    local r = str:find(')')
    if r == nil then
      return condition.new('unkown', ''), str
    end
    local p = str:sub(1, r - 1)
    local remain = str:sub(r + 1, #str)
    local i = p:find(',')
    if i then
      local target = {}
      for i in p:gmatch('([^,]+)') do table.insert(target, i) end
      return target, remain
    else
      if not p then return {}, remain end
      return {p}, remain
    end
  end
end

condition.new = function(op, ...)
  local target = {...}
  if #target == 0 then
    local t, r = parse(op)
    op = t.op
    target = t.target
  end
  if #target == 1 and not target[1] then
    target = {}
  end
  return setmetatable({ op=op, target=target }, mt)
end

condition.valid = function(self, obj)
  local op = self.op
  if 'NOT' == op then
    return not condition.valid(self.target[1], obj)
  end
  if 'AND' == op then
    for i, c in ipairs(self.target) do
      if c.op then
        local r = condition.valid(c, obj)
        if not r then
          return false
        end
      end
    end
    return true
  end
  if 'OR' == op then
    for i, c in ipairs(self.target) do
      if c.op then
        local r = condition.valid(c, obj)
        if r then
          return true
        end
      end
    end
    return false
  end
  local attribute = self.target[1]
  local value = obj[attribute]
  if 'ISNULL' == op then return value == nil end
  if 'ISNOTNULL' == op then return value ~= nil end
  local target = self.target[2]
  if 'EQ' == op then return value == target end
  if 'LT' == op then return value < target end
  if 'GT' == op then return value > target end
  if 'LE' == op then return value <= target end
  if 'GE' == op then return value >= target end
  if 'NE' == op then return value ~= target end
  -- if 'LIKE' == op then return value == target end
  -- print(self, obj)
  -- tprint(obj, 8)
  return true
end

return condition

