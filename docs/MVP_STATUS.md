# MVP Status

更新时间：2026-06-01

## Summary

Web MVP 已在 `feature/kana-typing-mvp` 分支实现。当前版本优先验证 dazidazi 风格的练习入口：打开网页后读取本地进度，直接进入当前关卡，用户根据假名输入罗马音，并通过即时反馈、结算与解锁继续学习。

## Implemented

- 练习场 UI：顶部仪表盘、中心假名线、提示区、右侧关卡抽屉、右上角工具栏、结算弹窗。
- 键盘流：`Space` 开始练习，输入罗马音推进题目，`Tab` 在结算后重练当前关。
- 关卡内容：当前课程包含 `あ行`、`あ行复习`、`か行`，并按通过结果逐步解锁。
- 假名目录：已收录平假名 `あ/か/さ/た` 行与片假名 `ア` 行，供后续关卡扩展复用。
- 练习核心：`PracticeSession` 处理输入、错误、完成状态与失败状态。
- 评分核心：准确率决定是否通过，速度用于星级。
- 进度核心：本地保存 active course/level、level results、mistake stats 与 settings。
- 导入导出核心：支持 schema 校验、合并最佳关卡结果、合并错题统计。
- 错题复习核心：可从 mistake stats 生成 `review-mistakes` 练习。
- 浏览器适配器：localStorage 进度仓储、文件导入导出端口、Web Audio 服务、浏览器时钟。
- 自动化测试：覆盖 core/app/web/ui/e2e 的主要行为。

## Partial Or Deferred

- 自学、易混淆、错题入口已经在工具栏展示，但内容页和交互流程尚未实现。
- 导入/导出按钮尚未与 `BrowserFilePort` 接线。
- 完整五十音课程、浊音、半浊音、拗音、长音和片假名主线仍待补齐。
- 假名发音目前是占位式 Web Audio 反馈，尚未接入真实语音素材。
- 损坏或不兼容的 localStorage 进度目前会抛出加载错误，下一步应提供自动恢复、重置或导入提示。
- 未来 iOS/App 外壳未进入 MVP，实现重点仍是 Web 与可复用 core。

## Verification

最近一次完整验证目标：

```bash
npm run check
npm run e2e
```

文档更新后至少需要重新运行 `npm run check`，确保类型检查、单元测试和构建仍然通过。

## Reference Documents

- [五十音打字练习 PRD / Design Spec](superpowers/specs/2026-05-31-kana-typing-prd-design.md)
- [Kana Typing MVP Implementation Plan](superpowers/plans/2026-05-31-kana-typing-mvp-implementation.md)
- [Ubiquitous Language](../UBIQUITOUS_LANGUAGE.md)
