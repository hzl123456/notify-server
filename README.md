# 微信定时消息

所有通知按北京时间（`Asia/Shanghai`）发送，时间统一配置在
[`config/notifications.json`](config/notifications.json)：

| 消息           | 时间  |
| -------------- | ----- |
| 早安           | 07:45 |
| 午安           | 10:58 |
| 生日提醒       | 14:58 |
| 睡前故事和新闻 | 21:58 |

## GitHub Actions 自动发送

GitHub 的 `schedule` 可能延迟甚至丢失，不能保证准点。运行记录中，2026-10-08
原定 21:58 的晚安任务在次日 03:35:39 才启动，03:36:08 完成。
[GitHub 官方说明](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)。

`notifications.yml` 全天每 10 分钟检查当前北京时间，并在原定发送时间额外检查一次。
即使触发延迟，也只发送当前窗口内的消息，不补发之前时段的内容。
自动消息最多允许延后 30 分钟，超过窗口直接跳过，因此不会在凌晨补发睡前故事。
如果窗口内没有任何任务启动，当天这条消息会缺失。

统一工作流串行执行，发送成功后保存按北京时间日期、消息类型区分的发送记录，保留 7 天。
下一次检查先查询记录，已发送则跳过。查询失败时停止发送；企业微信返回失败也不会记为成功。
一组消息只要有部分发送成功，就记录当天已发送，避免重新发送整组内容。
发送记录被手动删除或保存失败时，后续检查可能再次发送。
旧的四个工作流保留手动发送入口；手动发送不受时间窗口和每天去重限制。

需在仓库 Secrets 中配置 `WX_COMPANY_ID`、`WX_APP_ID`、`WX_APP_SECRET`、`TIAN_API_KEY`。
这些修复必须合入默认分支 `master` 后，线上定时任务才会生效。

## 常在线设备准时发送

如果需要稳定在指定时间收到消息，应在常在线的服务器或 NAS 上直接执行脚本，
避免把准点发送交给 GitHub 的调度队列。先设置上述四个环境变量或 `.env`，安装依赖，
在设备的定时任务中分别运行：

```sh
TZ=Asia/Shanghai ENFORCE_SEND_WINDOW=true MESSAGE_TYPE=goodMorning pnpm start
TZ=Asia/Shanghai ENFORCE_SEND_WINDOW=true MESSAGE_TYPE=goodAfternoon pnpm start
TZ=Asia/Shanghai ENFORCE_SEND_WINDOW=true MESSAGE_TYPE=birthday pnpm start
TZ=Asia/Shanghai ENFORCE_SEND_WINDOW=true MESSAGE_TYPE=goodEvening pnpm start
```

设备的调度器也必须按 `Asia/Shanghai` 配置这四个时间；`TZ` 只控制脚本内部日期。
迁移完成后，在 GitHub 停用 `Scheduled notifications` 工作流，避免两个来源重复发送。

## 开发验证

```sh
pnpm install --frozen-lockfile
pnpm test --run
pnpm build
```

测试使用模拟发送，不调用真实微信或内容接口。
