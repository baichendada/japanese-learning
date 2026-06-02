# 五十音打字练习 — 产品与技术规划

> 版本：2026-06-01  
> 状态：Phase A 已上线；Phase B/C 基础能力建设中

## 1. 产品定位

面向日语初学者的 **沉浸式假名打字练习**：打开即练，通过「假名 → 罗马音 → 发音」建立肌肉记忆。  
不以课程首页为中心，主线是固定关卡 + 渐进解锁；自学、易混淆、错题作为辅助入口。

### 1.1 学习阶段模型

```
认形 → 记音/罗马音 → 辨混淆 → 自动化（速度+随机） → 迁移到词 →（远期）句/文
```

| 阶段 | 用户能力 | 产品代号 |
|------|----------|----------|
| A | 按行认识清音 46 字 | 清音主线（现状） |
| B | 浊/半浊/拗音也会打 | 假名表补全 |
| C | 跨行混合、易混淆稳定 | 复习与专项 |
| D | 常见词能连续输入 | 词关 |
| E | 短句连续输入 | 句关（待定） |
| F | 段落/文章 | 文关（远期） |

---

## 2. 现状与差距

### 2.1 已实现（Phase A）

- 平假名 / 片假名 **清音** 各 10 行 ×（学行 + 复习）= 40 关
- 逐假名罗马音输入、`PracticeSession` 计分、本地进度、导入导出
- 50 音图侧栏（含浊音/半浊/拗音展示 + Tofugu 在线读音）
- 错题复习 / 易混淆 **核心或 UI 部分就绪**

### 2.2 已知问题

| 问题 | 影响 |
|------|------|
| 复习关与学行关 **题组相同** | 几乎无间隔重复效果 |
| 练习中 **未写入错题统计** | 错题面板长期为空 |
| 浊/半浊/拗音 **未进 kanaCatalog** | 无法开进阶关卡 |
| `KanaLine` 按 `level.kanaTexts` 展示 | 打乱顺序后会与 session 不一致 |
| 假名区 **固定 5 列网格** | 长关 / 混合关布局差 |
| 易混淆 **仅展示，不可练** | 专项能力缺失 |

---

## 3. 路线图

### Phase B — 假名表补全（内容 + 少量基建）

**目标**：与 50 音图一致，清音以外的假名都能练。

**新课程**（各独立于「基础」课，解锁：对应脚本基础课全部通关）：

| 课程 | 关卡结构 |
|------|----------|
| 平假名 · 浊音/半浊音 | が/ざ/だ/ば/ぱ 行 + 复习 |
| 平假名 · 拗音 | きゃ系 10 组 + 复习 |
| 片假名 · 浊音/半浊音 | 同上 |
| 片假名 · 拗音 | 同上 |
| 全表总复习 | 清 + 浊 + 半浊 + 拗，打乱 |

**基建依赖**：扩展 `kanaCatalog`（与 `kanaChartCatalog` 对齐）。

---

### Phase C — 复习与专项（保证「不忘、不混」）

**目标**：学过的字以 **累计 + 打乱** 方式再现；易混淆、错题可一键开练。

**主线复习规则**（替换现有「同行复读」）：

| 关类型 | 题组 | 顺序 |
|--------|------|------|
| 学行关 | 本行假名 | 固定（认形） |
| 复习关 | **自课程起点至本行** 全部已学假名 | **打乱** |

**专项**（不挡主线，工具栏入口）：

- **错题关**：按 `mistakeStats` 频次生成 prompt（已有 core）
- **易混淆关**：预置混淆对，合并为打乱 prompt 列表
- （可选）**速度关**：同题组，星级更看 WPM

**基建依赖**：`Level.promptOrder`、`promptBuilder`、KanaLine 跟 session 走、动态网格。

---

### Phase D — 词关（迁移）

**目标**：从单字过渡到真实日语片段。

**新课程「假名词 · 入门」**：

- 片假名外来语：コーヒー、パン、メニュー …
- 平假名高频词：ありがとう、すみません …
- 助词混合：は、を、が、に …

**练习形态（Phase D 仍用现有引擎）**：

- 一个词 = 多个 `PracticePrompt`（逐假名）
- UI 增加 **词边界** 展示（同一词内假名分组，仍逐字输入）
- 暂不支持整词一次输完、空格、汉字

**基建依赖**：`Level.displayMode: 'kana' | 'word'`、`wordGroups?: string[][]`。

---

### Phase E/F — 句 / 文（远期，单独模式）

**不在 Phase B/C/D 实现。** 需要新练习模式：

- 整句/整段 `expectedRomaji` 连续匹配
- 空格、标点、は→wa/ha 等规则
- 多行滚动 UI
- 内容：纯假名短句 → 带振假名 → 汉字（更远）

---

## 4. 产品决策（已拍板）

| 决策 | 选择 | 理由 |
|------|------|------|
| 片假名与平假名 | **并行两套课**，进阶课各自解锁 | 保持现状，适应不同目标用户 |
| 复习关难度 | **累计 + 打乱** | 间隔重复，防「只会按行背」 |
| 词关优先 | **先片假名外来语** | 日常可见、动机强 |
| 文章模式 | **Phase F**，词关验证后再做 | 规则与工程量大 |
| 打乱随机性 | **每局 start 时 shuffle** | 实现简单；不做固定种子 |

---

## 5. 技术方案 — 基础能力（支撑 B/C/D）

### 5.1 领域模型扩展

```typescript
// levelCatalog.ts
type PromptOrder = 'sequential' | 'shuffled';

interface Level {
  // ...existing
  readonly promptOrder: PromptOrder;  // 默认 sequential
  // Phase D 预留：
  // readonly displayMode?: 'kana' | 'word';
  // readonly wordGroups?: readonly (readonly string[])[];
}
```

虚拟关（错题 / 易混淆）继续使用固定 `LevelId`，不写入 `levelResults` 解锁链（或写入但不参与 unlock）。

### 5.2 Prompt 构建

新模块 `src/core/learning-content/promptBuilder.ts`：

- `buildLevelPrompts(level)`：`kanaTexts` → `PracticePrompt[]`，查 `kanaCatalog`
- `shuffled` 时在 **每次 `createSession`** 时 Fisher-Yates 打乱 prompt 顺序
- UI **必须**按 `session.prompts` 渲染，不得再用 `level.kanaTexts` 顺序

### 5.3 假名目录统一

- `kanaCatalog` 合并 `kanaChartCatalog` 中的浊/半浊/拗音条目
- `Kana.row` 扩展：`ga | za | da | ba | pa | yo`（拗音统一 `yo`）
- `findKanaByText` 覆盖全部可练假名

### 5.4 进度 — 错题写入

新函数 `recordMistake(progress, { kanaText, expectedRomaji, occurredAt })`：

- 在 `KanaTrainer.typeCharacter` 每次 session 新增 mistake 时调用
- 与 `levelResults` 一起在关末 persist

### 5.5 易混淆练习

新模块 `src/core/review/confusionPractice.ts`：

- 与 `reviewPractice` 同模式，固定 `LevelId` + prompts 列表
- `KanaTrainer.startConfusionPractice()`
- `ConfusionPanel` 增加「开始练习」按钮

### 5.6 UI

- `KanaLine`：`session.prompts.map(p => p.kanaText)`，CSS `--kana-count` 动态列
- `KanaHelper`：扩展行 `getKanaRow` 不可用时不展示行表，仅大字卡

### 5.7 关卡目录生成

- `buildCourseLevels`：复习关 `kanaTexts = 累计假名`，`promptOrder = 'shuffled'`
- Phase B 内容：新增 `hiragana-dakuon` 等 course 常量，**后续 PR 批量添加**

### 5.8 测试策略

| 范围 | 要求 |
|------|------|
| `promptBuilder` | sequential / shuffled 长度与内容 |
| `recordMistake` | 合并计数、时间戳更新 |
| `levelCatalog` | 复习关累计、promptOrder |
| `kanaCatalog` | 扩展假名可查 |
| `KanaTrainer` | 错题写入、易混淆开练 |
| 回归 | `npm run check` |

---

## 6. 实施顺序

### 本次（基础能力 Sprint）

1. ✅ 本文档 `docs/plan.md`
2. `promptBuilder` + `Level.promptOrder`
3. 复习关改为 **累计 + shuffled**
4. 扩展 `kanaCatalog`
5. `recordMistake` + Trainer 接线
6. `confusionPractice` + UI
7. `KanaLine` / CSS 修复

### 下一 Sprint（Phase B 内容）

1. 平假名浊/半浊/拗音课程关卡表
2. 片假名对称课程
3. 全表总复习关
4. 解锁规则：基础课通关 → 进阶课

### 再下一 Sprint（Phase D 试点）

1. `displayMode: 'word'` + 词边界 UI
2. 5～10 个片假名词关
3. E2E 覆盖词关

---

## 7. 成功指标

| 阶段 | 可验证结果 |
|------|------------|
| C 完成 | か行复习含あ行字且每局顺序不同；错题面板有数据；易混淆可开练 |
| B 完成 | 全表假名均有对应关卡且可通关 |
| D 完成 | 用户可完成至少一个词关（如 コーヒー） |

---

## 8. 参考

- [PRD / Design Spec](./superpowers/specs/2026-05-31-kana-typing-prd-design.md)
- [MVP Status](./MVP_STATUS.md)
- [Ubiquitous Language](../UBIQUITOUS_LANGUAGE.md)
