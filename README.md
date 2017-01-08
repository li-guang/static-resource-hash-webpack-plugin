# static-resource-hash-webpack-plugin
基于WebPack HTML/CSS/JS/Image Hash功能。实现逻辑为 当所有文件生成后，通过查找文件引用来更新Hash后的文件名。不支持动态路径引用。

## 使用说明

== 在WebPack中使用时，要将此模块放置在最后，因为模块的执行是在最终生成的文件中进行的。 ==
== 依赖crypto及glob ==

第一步，引用模块：
```javascript
var StaticResHashPlugin = require('static-resource-hash-webpack-plugin')
```

第二步，加入到**webpack plugins**中：
```javascript
new StaticResHashPlugin({
  log: true,
  hashLength: 8,
  destRoot: 'dist',
  hashFiles: ['/img/**/*', '/components/**/*.html', '/fonts/**/*', '/*.js', '/404.html', '/css/*.css' ],
  hostFiles: ['/**/*.js', '/**/*.html', '/css/*.css']
})
```
- **log** 默认值为false，不输出Log信息
- **hashLength** Hash值的长度，默认为8位，一般无需指定
- **destRoot** 执行此Hash操作的目录，应该为输出目录
- **hashFiles** 执行Hash操作的文件，即需要对哪些文件进行Hash重命名操作
- **hostFiles** 在哪些文件里面查找文件引用，并执行替换

