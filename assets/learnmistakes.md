⏺ 部署失败总结

错误1：\_config.yml 重复 YAML key

原因：你手动在文件顶部添加了 enable_google_analytics: true 等配置，但这些 key 在文件底部的 # Optional Features 块中已经存在。YAML  
 不允许同一文件出现重复 key，Jekyll 直接报错退出。

教训：在 \_config.yml 中修改设置时，应搜索 key 是否已存在，而不是直接追加。

---

错误2：Prettier 格式检查失败

原因：\_scripts/\*.js 文件有 Jekyll front matter（--- 开头），Prettier 把它当纯 JS 解析，报 SyntaxError。这是上游模板的历史遗留问题，.prettierignore
里漏掉了这些文件。

教训：引入上游文件后需验证 CI 全部通过，不只看 deploy。

---

错误3：Lychee 链接检查失败（之前修复过）

原因：about.md 里有 YOUR_ID 占位符链接，加上 Amazon/CNKI/Unsplash 在 CI 环境下返回 403/SSL 错误。

---

错误总结

┌─────┬───────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────┐  
 │ # │ 错误 │ 根本原因 │  
 ├─────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ 1 │ Deploy 失败：YAMLException: duplicated │ 手动在 \_config.yml 顶部添加了 enable_google_analytics 等字段，但这些 key 在文件底部 # │  
 │ │ mapping key │ Optional Features 块已存在 │  
 ├─────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤  
 │ 2 │ Prettier CI 失败 │ \_scripts/\*.js 文件有 Jekyll front matter (---)，Prettier 当纯 JS 解析报语法错，且 │  
 │ │ │ .prettierignore 没有排除这些文件 │  
 ├─────┼───────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3 │ Lychee 链接检查失败（之前） │ about.md 有 YOUR_ID 占位符链接，Amazon/CNKI/Unsplash 在 CI 环境返回 403/SSL 错误 │  
 └─────┴───────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────┘

---

Pin 卡片宽度问题（刚修复）

原因：blog.md 里写的是 <div class="container featured-posts">，但页面 layout 本身已经有外层 <div class="container mt-5">。两层嵌套 Bootstrap
.container 会导致内层容器打破父级宽度限制，卡片实际宽度等于整个内容区宽度，和下面的 post 标题一样宽。

修复：移除了 container class，改为 <div class="featured-posts">，让卡片正常按 row-cols-2（50% 宽）渲染。同时缩小了卡片标题字体（0.95rem）。

增加Contact-scholar
图标 -google scholar， 或者学术帽子作为图标
https://scholar.google.com/
以后我有schoalr了自行替换
删除底部RSS， general中已经又了
