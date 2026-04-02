# Supabase Backup

数据库备份已独立到 `~/Documents/06-Back/supabase_bak/`，与项目代码解耦。

## 备份目标

| 数据库 | 环境变量 | 区域 |
|--------|----------|------|
| life-ops | `LIFE_OPS_DB_URL` | ap-northeast-1 |
| yoyo | `YOYO_DB_URL` | ap-south-1 |

数据库结构继续由 `supabase/migrations/` 保存在 Git 中。

## 文件结构

```
~/Documents/06-Back/supabase_bak/
├── .env              # 数据库连接串
├── backup.sh         # 备份脚本
├── backup.log        # launchd 日志
└── dumps/            # 备份文件
    ├── life-ops_YYYYMMDD_HHMMSS.dump
    ├── life-ops_latest.dump
    ├── yoyo_YYYYMMDD_HHMMSS.dump
    └── yoyo_latest.dump
```

## 运行方式

手动运行：

```bash
bash ~/Documents/06-Back/supabase_bak/backup.sh
```

自动运行：macOS launchd 每天中午 12:00 执行。

```bash
# 查看定时任务状态
launchctl list | grep life-ops

# 重新加载
launchctl unload ~/Library/LaunchAgents/com.life-ops.backup-supabase.plist
launchctl load ~/Library/LaunchAgents/com.life-ops.backup-supabase.plist
```

超过 14 天的备份自动清理（可通过 `BACKUP_RETENTION_DAYS` 调整）。

## 恢复示例

```bash
pg_restore --clean --if-exists --no-owner --no-privileges --dbname "$TARGET_DATABASE_URL" ~/Documents/06-Back/supabase_bak/dumps/life-ops_latest.dump
```

## 注意事项

- `pg_dump` 备份的是 PostgreSQL 数据库（结构 + 数据）。
- Supabase Storage 的对象文件不会包含在这里，需要单独导出。
- 如果数据库密码里有 `@`、`:`、`/`、`?`、`#` 这类字符，需要先做 URL 编码。
- 连接串获取位置：Supabase Dashboard → Project Settings → Database → Connection string
- launchd plist 位于 `~/Library/LaunchAgents/com.life-ops.backup-supabase.plist`