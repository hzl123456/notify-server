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

`notifications.yml` 配置全天每 10 分钟触发，并在原定发送时间额外触发一次。
平台实际触发可能稀疏：2026-10-10、11 的记录只有约每 2 ～ 5 小时一次。
旧的 30 分钟窗口错过了午安、生日和晚安，例如 10 月 11 日 19:36 启动时离晚安还早，
下一次启动已是次日 00:46，因此整晚都没有消息。

每次启动检查每一类消息最近一次到期的计划，并准备未来 4 小时内的消息。
发送记录决定哪些计划已经完成；一次触发会处理所有待补发的类型。
提前启动的 runner 先安装依赖，再等待到北京时间的设定时刻执行发送脚本；
不会因为提前启动就丢弃午安、生日或晚安。多个消息各自执行，某一类型等待或失败不会阻塞其他类型。
等待任务最长运行 270 分钟，低于 [GitHub 托管任务的 6 小时上限](https://docs.github.com/en/actions/reference/limits)。

不设夜间截止或延迟上限。晚上也可以补发午安，跨过午夜仍可以补发前一天的晚安。
发送端只检查是否已到计划时间；去重键始终使用原计划的北京时间日期，跨午夜不会变成第二次发送。
如果没有在提前准备期间启动 runner，最近到期的消息会在后续任务启动时补发。
一次检查只回看每类最近一次到期计划，不集中重发多天历史积压；GitHub 完全停止触发时仍不能保证送达。

同一计划日期、同一种消息串行执行，发送成功后保存按北京时间计划日期、消息类型区分的发送记录，保留 7 天。
准备前和等待结束后都会查询记录，已发送则跳过。查询失败时停止发送；企业微信返回失败也不会记为成功。
一组消息只要有部分发送成功，就记录当天已发送，避免重新发送整组内容。
发送记录被手动删除或保存失败时，后续检查可能再次发送。
旧的四个工作流保留手动发送入口；手动发送不受计划时间和每天去重限制。
在 `Scheduled notifications` 的手动运行入口勾选 `dry_run`，可以运行调度回放、类型检查和构建，
不会等待或发送微信。验证模式也会显示当前可准备的消息计划。

需在仓库 Secrets 中配置 `WX_COMPANY_ID`、`WX_APP_ID`、`WX_APP_SECRET`、`TIAN_API_KEY`。
这些修复必须合入默认分支 `master` 后，线上定时任务才会生效。

## 常在线设备准时发送

如果需要稳定在指定时间收到消息，应在常在线的服务器或 NAS 上直接执行脚本，
避免把准点发送交给 GitHub 的调度队列。先设置上述四个环境变量或 `.env`，安装依赖，
在设备的定时任务中分别运行：

```sh
TZ=Asia/Shanghai ENFORCE_SCHEDULE=true MESSAGE_TYPE=goodMorning pnpm start
TZ=Asia/Shanghai ENFORCE_SCHEDULE=true MESSAGE_TYPE=goodAfternoon pnpm start
TZ=Asia/Shanghai ENFORCE_SCHEDULE=true MESSAGE_TYPE=birthday pnpm start
TZ=Asia/Shanghai ENFORCE_SCHEDULE=true MESSAGE_TYPE=goodEvening pnpm start
```

设备的调度器也必须按 `Asia/Shanghai` 配置这四个时间；`TZ` 只控制脚本内部日期。
迁移完成后，在 GitHub 停用 `Scheduled notifications` 工作流，避免两个来源重复发送。

## 开发验证

```sh
pnpm install --frozen-lockfile
pnpm test --run
pnpm build
```

测试使用模拟发送和模拟时钟，不调用真实微信或内容接口。
包含 10 月 10、11 日真实触发时间的回放，检查四类消息均能被准备和发送，
以及多消息重叠、等待到设定时刻、夜间补发、跨午夜去重等情况。
