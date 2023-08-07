# Hawkeye

鹰眼（Hawkeye）是美国漫威漫画旗下超级英雄，初次登场于《悬疑故事》（Tales of Suspense）第57期（1964年9月），由斯坦·李和唐·海克联合创造。本名克林顿·弗朗西斯·巴顿（Clinton Francis Barton），小名克林特（Clint），曾化名为歌利亚（Goliath）与浪人（Ronin），是个在马戏团长大的孤儿，师从剑客（Swordsman）和捷射（Trick Shot），天赋异常，小时候便获得“鹰眼“和“世界最佳狙击手”的称号，因在某次演出时看到钢铁侠救人的一幕后，决定利用自己的能力成为超级英雄，后加入复仇者联盟，成为其中重要的一员。

![](https://img1.3lian.com/2015/a1/31/d/190.jpg)

# AB测试项目（替换testin）

## 总体设计
1. 数据持久化到redis里面
3. 大量使用redis-lua脚本（基本每一个接口都是使用redis-lua脚本实现，提升性能的同时，能利用redis-lua脚本的原子性达到类似事务的效果）

## 接口
1. 获取变量接口（需要返回现在配置的层+实验+实验变量，以获取从属的实验版本）
2. 回传指标接口，直接存redis，需要在redis里面使用hashset存储对应的实验，以及实验指标，还有指标的值
3. 增加一个接口直接输出对应实验的统计指标，开始的时候只要求有一个简单的列表就好了（TODO）


## client
```
// 获取AB测试的变量值
export const getABTestValue = (name, defaultValue) => {
  return request(`/ab/var?name=${name}`, {
    headers: {
      'X-User-Id': getUserId(),
      'X-Env': getEnv(),
    },
  })
    .then(({ data }) => {
      if (data.code === 0) {
        if (data.type === 'number') {
          return parseInt(data.value, 10)
        }
        return data.value
      }
      return defaultValue
    })
    .catch((e) => {
      return defaultValue
    })
}

// 发送AB测试的指标
export const postABTestTarget = (targets) => {
  return request(`/ab/track`, {
    method: 'POST',
    body: targets,
    headers: {
      'X-User-Id': getUserId(),
      'X-Env': getEnv(),
    },
  })
}

```

