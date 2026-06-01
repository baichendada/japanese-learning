# Japanese Learning

五十音打字练习网页。它把学习入口做成类似打字网站的练习场：屏幕给出假名，学习者输入对应罗马音，通过即时反馈、错误统计和本地进度逐步记住发音。

当前仓库的 Web MVP 已实现，核心目标是先验证“假名 -> 罗马音 -> 发音记忆”的练习体验，并为未来 iOS/App 外壳保留可复用的领域核心。

## 当前状态

- 已完成练习优先的网页体验：打开页面后加载本地进度并进入当前关卡。
- 已完成固定关卡与逐步解锁：当前主线包含 `あ行`、`あ行复习`、`か行`。
- 已完成本地进度、分数结算、错误记录、导入导出合并的核心逻辑。
- 已完成 DDD 风格的可复用 core：`src/core` 不依赖 React、DOM、localStorage、文件系统或音频 API。
- 已完成自动化验证：Vitest 覆盖 core/app/web/ui，Playwright 覆盖主要浏览器练习流程。

更细的实现快照见 [docs/MVP_STATUS.md](docs/MVP_STATUS.md)。

## 主要体验

- 第一屏就是练习场，不做营销页或课程首页。
- 中心展示当前关卡的假名序列，用户输入罗马音。
- 每次按键播放打字机音效；题目完成后进入下一个假名。
- 顶部仪表盘展示状态、用时、准确率、错误数和速度。
- `Space` 开始练习，`Tab` 可在结算弹窗中重练当前关。
- 右侧关卡抽屉支持查看当前课程关卡与解锁状态。
- 右上角保留自学、易混淆、错题、导入、导出、设置等工具入口。

## 快速开始

```bash
npm install
npm run dev
```

开发服务器默认绑定到 `127.0.0.1`。启动后打开：

```text
http://127.0.0.1:5173/
```

常用验证命令：

```bash
npm run check
npm run e2e
```

## 架构

```text
src/core/
  shared/             # branded ids, clock
  learning-content/   # kana catalog, course, level
  practice/           # practice session and scoring
  progress/           # local progress, unlock, import/export merge
  review/             # mistake-based review practice
src/app/              # application service and ports
src/web/              # browser adapters
src/ui/               # React components and styles
tests/
  core/
  app/
  web/
  ui/
  e2e/
```

边界约束：

- `src/core` 只表达领域概念和规则，不能读取浏览器 API。
- `src/app` 负责协调 core 与 ports，不直接绑定具体 UI。
- `src/web` 放 localStorage、文件导入导出、Web Audio、浏览器时钟等适配器。
- `src/ui` 只处理 React 组件、键盘交互和视觉状态。

## 开发约定

- 新行为遵守 TDD：先写失败测试，再实现，再重构。
- 领域行为优先写 `tests/core` 或 `tests/app`。
- 浏览器适配器写 `tests/web`。
- 用户主流程写 `tests/ui` 和 `tests/e2e`。
- 依赖安装使用项目内 `.npmrc` 配置的 npm 镜像。

## 已知限制

- 右上角工具入口已经展示，但自学内容、易混淆练习、错题 UI、导入导出 UI 接线还属于后续切片。
- `BrowserFilePort` 和导入导出合并规则已经存在，但还没有接入工具栏交互。
- 当前关卡目录不是完整五十音路径，还需要补齐平假名、片假名、浊音、拗音等内容。
- 当前音频是 Web Audio 生成的按键音/占位音，尚未接入真实假名发音素材。
- 损坏或不兼容的本地进度目前会暴露加载错误，后续应改成可恢复的重置/导入提示。
