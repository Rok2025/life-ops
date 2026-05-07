# 命令中心实施方案

## 目标

命令中心用于集中展示日常高频命令。页面以「高频启用」为默认视图，尽量在一页里展示更多命令；每条命令只保留命令文本、一句话介绍和复制操作。

## 信息架构

- 路由：`/commands`
- 一级导航：`命令`
- 默认分类：`高频启用`
- 其它分类：用于查询和快速过滤，不承担复杂说明
- 系统配置：新增「命令」分组，包含「命令分类」和「命令模板」

## 数据模型

命令不复用 `system_configs`，原因是命令需要分类、排序、高频、复制次数、最近复制时间等字段。

### command_categories

- `name`：分类名称
- `slug`：分类标识
- `description`：简短说明
- `sort_order`：排序
- `is_active`：是否启用
- `is_default`：是否默认进入

### command_templates

- `category_id`：所属分类
- `command_text`：命令文本
- `summary`：一句话说明
- `tags`：标签
- `is_favorite`：是否高频
- `is_active`：是否启用
- `sort_order`：排序
- `copy_count` / `last_copied_at`：复制统计

## 前端实现

### 命令速查页

`apps/web/src/features/command-center` 负责命令中心：

- `CommandCenterPage`：页面容器、搜索、分类筛选
- `CommandCard`：紧凑展示命令、简介和复制按钮
- `commandsApi`：Supabase 数据访问
- `useCommands`：React Query hooks 和 mutations

展示规则：

- 默认展示 `is_default = true` 的分类，seed 中为「高频启用」
- 支持「全部」和分类切换
- 搜索匹配命令、简介、分类名和标签
- 只展示启用分类下的启用命令
- 点击复制后写入剪贴板，并更新复制统计

### 系统配置

在 `apps/web/src/features/system-config` 中新增命令配置入口：

- 命令分类：新增、编辑、删除、启用/停用、设置默认分类
- 命令模板：新增、编辑、删除、启用/停用、设置高频、排序

删除分类时，如果分类下已有命令，数据库外键会阻止删除；使用者应先移动或删除该分类下命令。

## 初始数据

seed 会写入 20+ 条命令，覆盖：

- `.zshrc` 中已有的 `smart`、`smartui`、`audit`、`cst`、`life`、`openclaw`
- Life OPS 常用开发命令
- `rok ctx` / `rok project` / `rok ui` 常用命令
- Git 发布和 Supabase 常用命令

后续所有命令都可以在系统配置中动态维护。
