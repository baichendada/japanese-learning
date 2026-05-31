# Kana Typing MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MVP web app for kana typing practice with a DDD-shaped reusable core, strict TDD, local progress, import/export, audio ports, and a dazidazi-inspired practice UI.

**Architecture:** Use a web-first shell around a platform-neutral domain core. The `src/core` layer contains learning content, practice, progress, and review bounded contexts with no React, DOM, localStorage, file, or audio dependencies. The `src/web` layer implements browser adapters, and `src/ui` renders React components against application services.

**Tech Stack:** Vite, React, TypeScript, Vitest, React Testing Library, Playwright, localStorage, Web Audio API.

---

## Constraints

- MVP is web-only.
- Future iOS/App direction is intentionally undecided.
- The core must be reusable by future Capacitor, React Native, or native shells.
- All production behavior must be implemented through TDD: RED, verify failure, GREEN, verify pass, refactor.
- Configuration and generated scaffolding are allowed before behavior tests; domain/application behavior is not.
- UI may use component tests and Playwright tests, but domain behavior must be tested through public TypeScript APIs.

## Domain Boundaries

Use the terms from `UBIQUITOUS_LANGUAGE.md`.

```text
src/core/
  shared/             # branded IDs, clock, result helpers, shared types
  learning-content/   # Kana, Romaji, Kana Row, Course, Level, Level Set
  practice/           # Practice Session, Prompt, Attempt, Mistake, scoring inputs
  progress/           # Progress, Level Result, Unlock Rule, import/export merge
  review/             # Review Practice from Mistakes and Confusion Pairs
src/app/              # application services coordinating core + ports
src/web/              # browser adapters: localStorage, files, audio, clock
src/ui/               # React components and styles
tests/
  core/
  app/
  web/
  ui/
  e2e/
```

## File Responsibilities

Create these files during the plan:

```text
package.json                         # scripts and dependencies
index.html                           # Vite entry
tsconfig.json                        # TypeScript app config
tsconfig.node.json                   # TypeScript config for tooling
vite.config.ts                       # Vite + Vitest config
playwright.config.ts                 # browser flow test config
src/main.tsx                         # React entry
src/ui/App.tsx                       # app shell
src/ui/styles.css                    # global visual system
src/core/shared/ids.ts               # branded IDs and constructors
src/core/shared/clock.ts             # Clock port
src/core/learning-content/model.ts   # Kana, Course, Level domain types
src/core/learning-content/kanaCatalog.ts
src/core/learning-content/levelCatalog.ts
src/core/practice/model.ts
src/core/practice/practiceSession.ts
src/core/practice/scoring.ts
src/core/progress/model.ts
src/core/progress/progress.ts
src/core/progress/importExport.ts
src/core/review/reviewPractice.ts
src/app/ports.ts
src/app/KanaTrainer.ts
src/web/adapters/BrowserClock.ts
src/web/adapters/LocalStorageProgressRepository.ts
src/web/adapters/BrowserFilePort.ts
src/web/adapters/WebAudioService.ts
src/ui/components/Dashboard.tsx
src/ui/components/KanaLine.tsx
src/ui/components/KanaHelper.tsx
src/ui/components/LevelDrawer.tsx
src/ui/components/TopToolbar.tsx
src/ui/components/ResultDialog.tsx
tests/core/learning-content/kanaCatalog.test.ts
tests/core/learning-content/levelCatalog.test.ts
tests/core/practice/practiceSession.test.ts
tests/core/practice/scoring.test.ts
tests/core/progress/progress.test.ts
tests/core/progress/importExport.test.ts
tests/core/review/reviewPractice.test.ts
tests/app/KanaTrainer.test.ts
tests/web/LocalStorageProgressRepository.test.ts
tests/ui/practicePage.test.tsx
tests/e2e/practice.spec.ts
```

---

### Task 1: Tooling Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `playwright.config.ts`
- Create: `src/main.tsx`
- Create: `src/ui/App.tsx`
- Create: `src/ui/styles.css`
- Modify: `.gitignore`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "japanese-learning",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest",
    "test:run": "vitest run",
    "e2e": "playwright test",
    "check": "npm run test:run && npm run build"
  },
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "vite": "latest",
    "typescript": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "@playwright/test": "latest",
    "@testing-library/jest-dom": "latest",
    "@testing-library/react": "latest",
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "jsdom": "latest",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run:

```powershell
npm install
```

Expected: exit code 0 and `package-lock.json` created.

- [ ] **Step 3: Create Vite and TypeScript config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests", "vite.config.ts", "playwright.config.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

Create `tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts", "playwright.config.ts"]
}
```

Create `vite.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    css: true,
  },
});
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 4: Create minimal app shell**

Create `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>五十音打字练习</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Create `src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './ui/App';
import './ui/styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

Create `src/ui/App.tsx`:

```tsx
export function App() {
  return (
    <main className="app-shell">
      <h1>kana50.com</h1>
      <p>五十音打字练习</p>
    </main>
  );
}
```

Create `src/ui/styles.css`:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  background: #f8f8f8;
  color: #222;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
}
```

- [ ] **Step 5: Update ignored files**

Ensure `.gitignore` includes:

```text
node_modules/
dist/
playwright-report/
test-results/
.playwright-cli/
.superpowers/
output/
```

- [ ] **Step 6: Verify scaffold**

Run:

```powershell
npm run build
```

Expected: exit code 0 and `dist/` created.

- [ ] **Step 7: Commit scaffold**

Run:

```powershell
git add package.json package-lock.json index.html tsconfig.json tsconfig.node.json vite.config.ts playwright.config.ts src .gitignore
git commit -m "chore: scaffold vite react app"
```

Expected: commit created.

---

### Task 2: Shared Types and Learning Content

**Files:**
- Create: `src/core/shared/ids.ts`
- Create: `src/core/learning-content/model.ts`
- Create: `src/core/learning-content/kanaCatalog.ts`
- Test: `tests/core/learning-content/kanaCatalog.test.ts`

- [ ] **Step 1: RED - write kana catalog behavior test**

Create `tests/core/learning-content/kanaCatalog.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { findKanaByText, getKanaRow } from '../../../src/core/learning-content/kanaCatalog';

describe('kana catalog', () => {
  test('knows special romaji for hiragana shi chi and tsu', () => {
    expect(findKanaByText('し')?.romaji).toBe('shi');
    expect(findKanaByText('ち')?.romaji).toBe('chi');
    expect(findKanaByText('つ')?.romaji).toBe('tsu');
  });

  test('returns the ka row as a stable learning unit', () => {
    expect(getKanaRow('hiragana', 'ka').map((kana) => kana.text)).toEqual([
      'か',
      'き',
      'く',
      'け',
      'こ',
    ]);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/core/learning-content/kanaCatalog.test.ts
```

Expected: FAIL because `src/core/learning-content/kanaCatalog` does not exist.

- [ ] **Step 3: GREEN - create shared IDs and kana catalog**

Create `src/core/shared/ids.ts`:

```ts
export type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

export type KanaId = Brand<string, 'KanaId'>;
export type CourseId = Brand<string, 'CourseId'>;
export type LevelId = Brand<string, 'LevelId'>;

export function kanaId(value: string): KanaId {
  return value as KanaId;
}

export function courseId(value: string): CourseId {
  return value as CourseId;
}

export function levelId(value: string): LevelId {
  return value as LevelId;
}
```

Create `src/core/learning-content/model.ts`:

```ts
import type { KanaId } from '../shared/ids';

export type KanaScript = 'hiragana' | 'katakana';

export type KanaRowName =
  | 'a'
  | 'ka'
  | 'sa'
  | 'ta'
  | 'na'
  | 'ha'
  | 'ma'
  | 'ya'
  | 'ra'
  | 'wa';

export interface Kana {
  id: KanaId;
  script: KanaScript;
  row: KanaRowName;
  text: string;
  romaji: string;
}
```

Create `src/core/learning-content/kanaCatalog.ts`:

```ts
import { kanaId } from '../shared/ids';
import type { Kana, KanaRowName, KanaScript } from './model';

export const kanaCatalog: readonly Kana[] = [
  { id: kanaId('hiragana-a'), script: 'hiragana', row: 'a', text: 'あ', romaji: 'a' },
  { id: kanaId('hiragana-i'), script: 'hiragana', row: 'a', text: 'い', romaji: 'i' },
  { id: kanaId('hiragana-u'), script: 'hiragana', row: 'a', text: 'う', romaji: 'u' },
  { id: kanaId('hiragana-e'), script: 'hiragana', row: 'a', text: 'え', romaji: 'e' },
  { id: kanaId('hiragana-o'), script: 'hiragana', row: 'a', text: 'お', romaji: 'o' },
  { id: kanaId('hiragana-ka'), script: 'hiragana', row: 'ka', text: 'か', romaji: 'ka' },
  { id: kanaId('hiragana-ki'), script: 'hiragana', row: 'ka', text: 'き', romaji: 'ki' },
  { id: kanaId('hiragana-ku'), script: 'hiragana', row: 'ka', text: 'く', romaji: 'ku' },
  { id: kanaId('hiragana-ke'), script: 'hiragana', row: 'ka', text: 'け', romaji: 'ke' },
  { id: kanaId('hiragana-ko'), script: 'hiragana', row: 'ka', text: 'こ', romaji: 'ko' },
  { id: kanaId('hiragana-sa'), script: 'hiragana', row: 'sa', text: 'さ', romaji: 'sa' },
  { id: kanaId('hiragana-shi'), script: 'hiragana', row: 'sa', text: 'し', romaji: 'shi' },
  { id: kanaId('hiragana-su'), script: 'hiragana', row: 'sa', text: 'す', romaji: 'su' },
  { id: kanaId('hiragana-se'), script: 'hiragana', row: 'sa', text: 'せ', romaji: 'se' },
  { id: kanaId('hiragana-so'), script: 'hiragana', row: 'sa', text: 'そ', romaji: 'so' },
  { id: kanaId('hiragana-ta'), script: 'hiragana', row: 'ta', text: 'た', romaji: 'ta' },
  { id: kanaId('hiragana-chi'), script: 'hiragana', row: 'ta', text: 'ち', romaji: 'chi' },
  { id: kanaId('hiragana-tsu'), script: 'hiragana', row: 'ta', text: 'つ', romaji: 'tsu' },
  { id: kanaId('hiragana-te'), script: 'hiragana', row: 'ta', text: 'て', romaji: 'te' },
  { id: kanaId('hiragana-to'), script: 'hiragana', row: 'ta', text: 'と', romaji: 'to' },
  { id: kanaId('katakana-a'), script: 'katakana', row: 'a', text: 'ア', romaji: 'a' },
  { id: kanaId('katakana-i'), script: 'katakana', row: 'a', text: 'イ', romaji: 'i' },
  { id: kanaId('katakana-u'), script: 'katakana', row: 'a', text: 'ウ', romaji: 'u' },
  { id: kanaId('katakana-e'), script: 'katakana', row: 'a', text: 'エ', romaji: 'e' },
  { id: kanaId('katakana-o'), script: 'katakana', row: 'a', text: 'オ', romaji: 'o' },
] as const;

export function findKanaByText(text: string): Kana | undefined {
  return kanaCatalog.find((kana) => kana.text === text);
}

export function getKanaRow(script: KanaScript, row: KanaRowName): Kana[] {
  return kanaCatalog.filter((kana) => kana.script === script && kana.row === row);
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/core/learning-content/kanaCatalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Refactor catalog only if tests stay green**

If the catalog grows beyond the rows needed by current tests, keep the public functions unchanged and add kana rows in the same `Kana` shape. Then run:

```powershell
npm run test:run -- tests/core/learning-content/kanaCatalog.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/core/shared/ids.ts src/core/learning-content tests/core/learning-content/kanaCatalog.test.ts
git commit -m "feat: add kana catalog"
```

Expected: commit created.

---

### Task 3: Level Catalog and Unlock Rules

**Files:**
- Create: `src/core/learning-content/levelCatalog.ts`
- Test: `tests/core/learning-content/levelCatalog.test.ts`

- [ ] **Step 1: RED - write level catalog tests**

Create `tests/core/learning-content/levelCatalog.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { getCourse, getLevelById } from '../../../src/core/learning-content/levelCatalog';

describe('level catalog', () => {
  test('starts hiragana basics with a row then a review level', () => {
    const course = getCourse('hiragana-basic');

    expect(course.name).toBe('平假名 - 基础');
    expect(course.levels[0].name).toBe('あ行');
    expect(course.levels[0].kanaTexts).toEqual(['あ', 'い', 'う', 'え', 'お']);
    expect(course.levels[1].name).toBe('あ行复习');
  });

  test('describes unlock rule from previous level', () => {
    const level = getLevelById('hiragana-ka');

    expect(level?.unlock).toEqual({
      type: 'previous-level-passed',
      previousLevelId: 'hiragana-a-review',
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/core/learning-content/levelCatalog.test.ts
```

Expected: FAIL because `levelCatalog` does not exist.

- [ ] **Step 3: GREEN - create course and level catalog**

Create `src/core/learning-content/levelCatalog.ts`:

```ts
import { courseId, levelId } from '../shared/ids';
import type { CourseId, LevelId } from '../shared/ids';

export type UnlockRule =
  | { type: 'always' }
  | { type: 'previous-level-passed'; previousLevelId: string };

export interface Level {
  id: LevelId;
  courseId: CourseId;
  name: string;
  kanaTexts: readonly string[];
  passAccuracy: number;
  maxMistakes: number;
  unlock: UnlockRule;
}

export interface Course {
  id: CourseId;
  name: string;
  levels: readonly Level[];
}

const hiraganaBasic: Course = {
  id: courseId('hiragana-basic'),
  name: '平假名 - 基础',
  levels: [
    {
      id: levelId('hiragana-a'),
      courseId: courseId('hiragana-basic'),
      name: 'あ行',
      kanaTexts: ['あ', 'い', 'う', 'え', 'お'],
      passAccuracy: 0.9,
      maxMistakes: 4,
      unlock: { type: 'always' },
    },
    {
      id: levelId('hiragana-a-review'),
      courseId: courseId('hiragana-basic'),
      name: 'あ行复习',
      kanaTexts: ['あ', 'う', 'い', 'え', 'お'],
      passAccuracy: 0.9,
      maxMistakes: 4,
      unlock: { type: 'previous-level-passed', previousLevelId: 'hiragana-a' },
    },
    {
      id: levelId('hiragana-ka'),
      courseId: courseId('hiragana-basic'),
      name: 'か行',
      kanaTexts: ['か', 'き', 'く', 'け', 'こ'],
      passAccuracy: 0.9,
      maxMistakes: 4,
      unlock: { type: 'previous-level-passed', previousLevelId: 'hiragana-a-review' },
    },
  ],
};

export const courses: readonly Course[] = [hiraganaBasic];

export function getCourse(id: string): Course {
  const course = courses.find((candidate) => candidate.id === id);
  if (!course) {
    throw new Error(`Unknown course: ${id}`);
  }
  return course;
}

export function getLevelById(id: string): Level | undefined {
  return courses.flatMap((course) => course.levels).find((level) => level.id === id);
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/core/learning-content/levelCatalog.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/core/learning-content/levelCatalog.ts tests/core/learning-content/levelCatalog.test.ts
git commit -m "feat: add level catalog"
```

Expected: commit created.

---

### Task 4: Practice Session Engine

**Files:**
- Create: `src/core/practice/model.ts`
- Create: `src/core/practice/practiceSession.ts`
- Test: `tests/core/practice/practiceSession.test.ts`

- [ ] **Step 1: RED - write behavior tests for input and mistakes**

Create `tests/core/practice/practiceSession.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { createPracticeSession } from '../../../src/core/practice/practiceSession';

describe('practice session', () => {
  test('completes kana when romaji characters are typed in order', () => {
    let session = createPracticeSession({
      levelId: 'hiragana-ka',
      prompts: [{ kanaText: 'け', romaji: 'ke' }],
      maxMistakes: 4,
      startedAt: 1000,
    });

    session = session.typeCharacter('k', 1100);
    expect(session.currentInput).toBe('k');
    expect(session.status).toBe('running');

    session = session.typeCharacter('e', 1200);
    expect(session.status).toBe('passed');
    expect(session.completedPrompts).toBe(1);
  });

  test('records a mistake when the typed character does not match expected romaji', () => {
    const session = createPracticeSession({
      levelId: 'hiragana-sa',
      prompts: [{ kanaText: 'し', romaji: 'shi' }],
      maxMistakes: 4,
      startedAt: 1000,
    }).typeCharacter('s', 1100).typeCharacter('i', 1200);

    expect(session.mistakes).toEqual([
      {
        kanaText: 'し',
        expectedRomaji: 'shi',
        actualInput: 'si',
        occurredAt: 1200,
      },
    ]);
    expect(session.status).toBe('running');
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/core/practice/practiceSession.test.ts
```

Expected: FAIL because `practiceSession` does not exist.

- [ ] **Step 3: GREEN - implement immutable practice session**

Create `src/core/practice/model.ts`:

```ts
export type PracticeStatus = 'ready' | 'running' | 'passed' | 'failed';

export interface PracticePrompt {
  kanaText: string;
  romaji: string;
}

export interface Mistake {
  kanaText: string;
  expectedRomaji: string;
  actualInput: string;
  occurredAt: number;
}

export interface PracticeSessionState {
  levelId: string;
  prompts: readonly PracticePrompt[];
  currentPromptIndex: number;
  currentInput: string;
  mistakes: readonly Mistake[];
  maxMistakes: number;
  startedAt: number;
  endedAt?: number;
  status: PracticeStatus;
  completedPrompts: number;
}
```

Create `src/core/practice/practiceSession.ts`:

```ts
import type { Mistake, PracticePrompt, PracticeSessionState } from './model';

interface CreatePracticeSessionInput {
  levelId: string;
  prompts: readonly PracticePrompt[];
  maxMistakes: number;
  startedAt: number;
}

export interface PracticeSession extends PracticeSessionState {
  typeCharacter(character: string, occurredAt: number): PracticeSession;
  reset(startedAt: number): PracticeSession;
}

export function createPracticeSession(input: CreatePracticeSessionInput): PracticeSession {
  return wrap({
    levelId: input.levelId,
    prompts: input.prompts,
    currentPromptIndex: 0,
    currentInput: '',
    mistakes: [],
    maxMistakes: input.maxMistakes,
    startedAt: input.startedAt,
    status: 'ready',
    completedPrompts: 0,
  });
}

function wrap(state: PracticeSessionState): PracticeSession {
  return {
    ...state,
    typeCharacter(character, occurredAt) {
      return typeCharacter(state, character, occurredAt);
    },
    reset(startedAt) {
      return createPracticeSession({
        levelId: state.levelId,
        prompts: state.prompts,
        maxMistakes: state.maxMistakes,
        startedAt,
      });
    },
  };
}

function typeCharacter(
  state: PracticeSessionState,
  character: string,
  occurredAt: number,
): PracticeSession {
  if (state.status === 'passed' || state.status === 'failed') {
    return wrap(state);
  }

  const prompt = state.prompts[state.currentPromptIndex];
  const nextInput = state.currentInput + character.toLowerCase();
  const expectedPrefix = prompt.romaji.slice(0, nextInput.length);

  if (nextInput !== expectedPrefix) {
    const mistake: Mistake = {
      kanaText: prompt.kanaText,
      expectedRomaji: prompt.romaji,
      actualInput: nextInput,
      occurredAt,
    };
    const mistakes = [...state.mistakes, mistake];
    return wrap({
      ...state,
      status: mistakes.length >= state.maxMistakes ? 'failed' : 'running',
      currentInput: '',
      mistakes,
      endedAt: mistakes.length >= state.maxMistakes ? occurredAt : state.endedAt,
    });
  }

  if (nextInput === prompt.romaji) {
    const completedPrompts = state.completedPrompts + 1;
    const nextPromptIndex = state.currentPromptIndex + 1;
    const passed = completedPrompts === state.prompts.length;
    return wrap({
      ...state,
      status: passed ? 'passed' : 'running',
      currentInput: '',
      currentPromptIndex: passed ? state.currentPromptIndex : nextPromptIndex,
      completedPrompts,
      endedAt: passed ? occurredAt : state.endedAt,
    });
  }

  return wrap({
    ...state,
    status: 'running',
    currentInput: nextInput,
  });
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/core/practice/practiceSession.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/core/practice tests/core/practice/practiceSession.test.ts
git commit -m "feat: add practice session engine"
```

Expected: commit created.

---

### Task 5: Scoring

**Files:**
- Create: `src/core/practice/scoring.ts`
- Test: `tests/core/practice/scoring.test.ts`

- [ ] **Step 1: RED - write scoring behavior tests**

Create `tests/core/practice/scoring.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { scorePracticeSession } from '../../../src/core/practice/scoring';

describe('practice scoring', () => {
  test('passes when accuracy reaches the level threshold', () => {
    const result = scorePracticeSession({
      completedPrompts: 20,
      mistakeCount: 2,
      startedAt: 0,
      endedAt: 60_000,
      passAccuracy: 0.9,
    });

    expect(result.accuracy).toBe(0.9);
    expect(result.passed).toBe(true);
  });

  test('speed affects stars but not pass state', () => {
    const slow = scorePracticeSession({
      completedPrompts: 20,
      mistakeCount: 0,
      startedAt: 0,
      endedAt: 120_000,
      passAccuracy: 0.9,
    });
    const fast = scorePracticeSession({
      completedPrompts: 20,
      mistakeCount: 0,
      startedAt: 0,
      endedAt: 30_000,
      passAccuracy: 0.9,
    });

    expect(slow.passed).toBe(true);
    expect(fast.passed).toBe(true);
    expect(slow.stars).toBe(2);
    expect(fast.stars).toBe(3);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/core/practice/scoring.test.ts
```

Expected: FAIL because `scoring` does not exist.

- [ ] **Step 3: GREEN - implement scoring**

Create `src/core/practice/scoring.ts`:

```ts
export interface ScorePracticeSessionInput {
  completedPrompts: number;
  mistakeCount: number;
  startedAt: number;
  endedAt: number;
  passAccuracy: number;
}

export interface PracticeScore {
  accuracy: number;
  kanaPerMinute: number;
  passed: boolean;
  stars: 0 | 1 | 2 | 3;
}

export function scorePracticeSession(input: ScorePracticeSessionInput): PracticeScore {
  const attempts = input.completedPrompts + input.mistakeCount;
  const accuracy = attempts === 0 ? 0 : input.completedPrompts / attempts;
  const elapsedMinutes = Math.max((input.endedAt - input.startedAt) / 60_000, 1 / 60);
  const kanaPerMinute = input.completedPrompts / elapsedMinutes;
  const passed = accuracy >= input.passAccuracy;

  return {
    accuracy: Number(accuracy.toFixed(3)),
    kanaPerMinute: Number(kanaPerMinute.toFixed(1)),
    passed,
    stars: passed ? starRating(kanaPerMinute) : 0,
  };
}

function starRating(kanaPerMinute: number): 1 | 2 | 3 {
  if (kanaPerMinute >= 40) return 3;
  if (kanaPerMinute >= 10) return 2;
  return 1;
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/core/practice/scoring.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/core/practice/scoring.ts tests/core/practice/scoring.test.ts
git commit -m "feat: add practice scoring"
```

Expected: commit created.

---

### Task 6: Progress Aggregate and Unlocking

**Files:**
- Create: `src/core/progress/model.ts`
- Create: `src/core/progress/progress.ts`
- Test: `tests/core/progress/progress.test.ts`

- [ ] **Step 1: RED - write progress behavior tests**

Create `tests/core/progress/progress.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { createEmptyProgress, recordLevelResult, isLevelUnlocked } from '../../../src/core/progress/progress';

describe('progress', () => {
  test('unlocks the next level after the previous level is passed', () => {
    const progress = recordLevelResult(createEmptyProgress(), {
      levelId: 'hiragana-a',
      courseId: 'hiragana-basic',
      passed: true,
      accuracy: 0.95,
      kanaPerMinute: 18,
      stars: 2,
      completedAt: 1000,
    });

    expect(
      isLevelUnlocked(progress, {
        type: 'previous-level-passed',
        previousLevelId: 'hiragana-a',
      }),
    ).toBe(true);
  });

  test('keeps the better result for the same level', () => {
    const first = recordLevelResult(createEmptyProgress(), {
      levelId: 'hiragana-a',
      courseId: 'hiragana-basic',
      passed: true,
      accuracy: 0.9,
      kanaPerMinute: 12,
      stars: 1,
      completedAt: 1000,
    });
    const second = recordLevelResult(first, {
      levelId: 'hiragana-a',
      courseId: 'hiragana-basic',
      passed: true,
      accuracy: 0.96,
      kanaPerMinute: 40,
      stars: 3,
      completedAt: 2000,
    });

    expect(second.levelResults['hiragana-a'].stars).toBe(3);
    expect(second.activeLevelId).toBe('hiragana-a');
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/core/progress/progress.test.ts
```

Expected: FAIL because `progress` does not exist.

- [ ] **Step 3: GREEN - implement progress aggregate**

Create `src/core/progress/model.ts`:

```ts
export interface LevelResult {
  levelId: string;
  courseId: string;
  passed: boolean;
  accuracy: number;
  kanaPerMinute: number;
  stars: 0 | 1 | 2 | 3;
  completedAt: number;
}

export interface MistakeStat {
  kanaText: string;
  expectedRomaji: string;
  count: number;
  lastMistakeAt: number;
}

export interface ProgressSettings {
  keySoundEnabled: boolean;
  kanaSoundEnabled: boolean;
  helperVisible: boolean;
}

export interface ProgressState {
  schemaVersion: 1;
  activeCourseId: string;
  activeLevelId: string;
  levelResults: Record<string, LevelResult>;
  mistakeStats: Record<string, MistakeStat>;
  settings: ProgressSettings;
}
```

Create `src/core/progress/progress.ts`:

```ts
import type { UnlockRule } from '../learning-content/levelCatalog';
import type { LevelResult, ProgressState } from './model';

export function createEmptyProgress(): ProgressState {
  return {
    schemaVersion: 1,
    activeCourseId: 'hiragana-basic',
    activeLevelId: 'hiragana-a',
    levelResults: {},
    mistakeStats: {},
    settings: {
      keySoundEnabled: true,
      kanaSoundEnabled: true,
      helperVisible: true,
    },
  };
}

export function recordLevelResult(
  progress: ProgressState,
  result: LevelResult,
): ProgressState {
  const current = progress.levelResults[result.levelId];
  const better = !current || result.stars > current.stars || result.accuracy > current.accuracy;
  return {
    ...progress,
    activeCourseId: result.courseId,
    activeLevelId: result.levelId,
    levelResults: {
      ...progress.levelResults,
      [result.levelId]: better ? result : current,
    },
  };
}

export function isLevelUnlocked(progress: ProgressState, rule: UnlockRule): boolean {
  if (rule.type === 'always') return true;
  return progress.levelResults[rule.previousLevelId]?.passed === true;
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/core/progress/progress.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/core/progress tests/core/progress/progress.test.ts
git commit -m "feat: add progress aggregate"
```

Expected: commit created.

---

### Task 7: Import and Export Merge

**Files:**
- Create: `src/core/progress/importExport.ts`
- Test: `tests/core/progress/importExport.test.ts`

- [ ] **Step 1: RED - write import/export tests**

Create `tests/core/progress/importExport.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { createEmptyProgress } from '../../../src/core/progress/progress';
import { mergeProgress, parseProgressBackup, previewProgressImport } from '../../../src/core/progress/importExport';

describe('progress import and export', () => {
  test('previews imported backup before replacing local progress', () => {
    const imported = {
      ...createEmptyProgress(),
      activeLevelId: 'hiragana-ka',
      levelResults: {
        'hiragana-a': {
          levelId: 'hiragana-a',
          courseId: 'hiragana-basic',
          passed: true,
          accuracy: 1,
          kanaPerMinute: 30,
          stars: 3,
          completedAt: 1000,
        },
      },
    };

    const preview = previewProgressImport(createEmptyProgress(), imported);

    expect(preview.importedLevelCount).toBe(1);
    expect(preview.importedActiveLevelId).toBe('hiragana-ka');
  });

  test('merges better level results and mistake counts', () => {
    const local = createEmptyProgress();
    const imported = parseProgressBackup(
      JSON.stringify({
        ...createEmptyProgress(),
        levelResults: {
          'hiragana-a': {
            levelId: 'hiragana-a',
            courseId: 'hiragana-basic',
            passed: true,
            accuracy: 0.98,
            kanaPerMinute: 45,
            stars: 3,
            completedAt: 1000,
          },
        },
        mistakeStats: {
          'し:shi': {
            kanaText: 'し',
            expectedRomaji: 'shi',
            count: 2,
            lastMistakeAt: 1200,
          },
        },
      }),
    );

    const merged = mergeProgress(local, imported);

    expect(merged.levelResults['hiragana-a'].stars).toBe(3);
    expect(merged.mistakeStats['し:shi'].count).toBe(2);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/core/progress/importExport.test.ts
```

Expected: FAIL because `importExport` does not exist.

- [ ] **Step 3: GREEN - implement import preview and merge**

Create `src/core/progress/importExport.ts`:

```ts
import type { LevelResult, MistakeStat, ProgressState } from './model';

export interface ProgressImportPreview {
  importedLevelCount: number;
  importedMistakeCount: number;
  importedActiveLevelId: string;
}

export function parseProgressBackup(json: string): ProgressState {
  const parsed = JSON.parse(json) as ProgressState;
  if (parsed.schemaVersion !== 1) {
    throw new Error('Unsupported progress backup version');
  }
  if (!parsed.activeCourseId || !parsed.activeLevelId) {
    throw new Error('Invalid progress backup');
  }
  return parsed;
}

export function previewProgressImport(
  _local: ProgressState,
  imported: ProgressState,
): ProgressImportPreview {
  return {
    importedLevelCount: Object.keys(imported.levelResults).length,
    importedMistakeCount: Object.keys(imported.mistakeStats).length,
    importedActiveLevelId: imported.activeLevelId,
  };
}

export function mergeProgress(local: ProgressState, imported: ProgressState): ProgressState {
  return {
    ...local,
    activeCourseId: imported.activeCourseId,
    activeLevelId: imported.activeLevelId,
    levelResults: mergeLevelResults(local.levelResults, imported.levelResults),
    mistakeStats: mergeMistakes(local.mistakeStats, imported.mistakeStats),
    settings: imported.settings,
  };
}

function mergeLevelResults(
  local: Record<string, LevelResult>,
  imported: Record<string, LevelResult>,
): Record<string, LevelResult> {
  const merged = { ...local };
  for (const [levelId, importedResult] of Object.entries(imported)) {
    const localResult = merged[levelId];
    const importedIsBetter =
      !localResult ||
      importedResult.stars > localResult.stars ||
      importedResult.accuracy > localResult.accuracy ||
      importedResult.kanaPerMinute > localResult.kanaPerMinute;
    if (importedIsBetter) {
      merged[levelId] = importedResult;
    }
  }
  return merged;
}

function mergeMistakes(
  local: Record<string, MistakeStat>,
  imported: Record<string, MistakeStat>,
): Record<string, MistakeStat> {
  const merged = { ...local };
  for (const [key, importedStat] of Object.entries(imported)) {
    const localStat = merged[key];
    merged[key] = localStat
      ? {
          ...localStat,
          count: localStat.count + importedStat.count,
          lastMistakeAt: Math.max(localStat.lastMistakeAt, importedStat.lastMistakeAt),
        }
      : importedStat;
  }
  return merged;
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/core/progress/importExport.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/core/progress/importExport.ts tests/core/progress/importExport.test.ts
git commit -m "feat: add progress import merge"
```

Expected: commit created.

---

### Task 8: Review Practice

**Files:**
- Create: `src/core/review/reviewPractice.ts`
- Test: `tests/core/review/reviewPractice.test.ts`

- [ ] **Step 1: RED - write review generation tests**

Create `tests/core/review/reviewPractice.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { createReviewPractice } from '../../../src/core/review/reviewPractice';

describe('review practice', () => {
  test('creates prompts from mistake stats without changing main level content', () => {
    const review = createReviewPractice({
      mistakeStats: {
        'し:shi': { kanaText: 'し', expectedRomaji: 'shi', count: 3, lastMistakeAt: 1000 },
        'け:ke': { kanaText: 'け', expectedRomaji: 'ke', count: 1, lastMistakeAt: 900 },
      },
      maxPrompts: 2,
    });

    expect(review.levelId).toBe('review-mistakes');
    expect(review.prompts.map((prompt) => prompt.kanaText)).toEqual(['し', 'け']);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/core/review/reviewPractice.test.ts
```

Expected: FAIL because `reviewPractice` does not exist.

- [ ] **Step 3: GREEN - implement review prompt generation**

Create `src/core/review/reviewPractice.ts`:

```ts
import type { PracticePrompt } from '../practice/model';
import type { MistakeStat } from '../progress/model';

export interface CreateReviewPracticeInput {
  mistakeStats: Record<string, MistakeStat>;
  maxPrompts: number;
}

export interface ReviewPractice {
  levelId: 'review-mistakes';
  prompts: PracticePrompt[];
}

export function createReviewPractice(input: CreateReviewPracticeInput): ReviewPractice {
  const prompts = Object.values(input.mistakeStats)
    .sort((left, right) => right.count - left.count || right.lastMistakeAt - left.lastMistakeAt)
    .slice(0, input.maxPrompts)
    .map((mistake) => ({
      kanaText: mistake.kanaText,
      romaji: mistake.expectedRomaji,
    }));

  return {
    levelId: 'review-mistakes',
    prompts,
  };
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/core/review/reviewPractice.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/core/review tests/core/review/reviewPractice.test.ts
git commit -m "feat: add review practice generation"
```

Expected: commit created.

---

### Task 9: Browser Ports and Adapters

**Files:**
- Create: `src/app/ports.ts`
- Create: `src/core/shared/clock.ts`
- Create: `src/web/adapters/BrowserClock.ts`
- Create: `src/web/adapters/LocalStorageProgressRepository.ts`
- Create: `src/web/adapters/BrowserFilePort.ts`
- Create: `src/web/adapters/WebAudioService.ts`
- Test: `tests/web/LocalStorageProgressRepository.test.ts`

- [ ] **Step 1: RED - write localStorage repository behavior test**

Create `tests/web/LocalStorageProgressRepository.test.ts`:

```ts
import { beforeEach, describe, expect, test } from 'vitest';
import { createEmptyProgress } from '../../src/core/progress/progress';
import { LocalStorageProgressRepository } from '../../src/web/adapters/LocalStorageProgressRepository';

describe('LocalStorageProgressRepository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('returns empty progress when no saved progress exists', async () => {
    const repo = new LocalStorageProgressRepository('kana-progress-test');

    await expect(repo.load()).resolves.toEqual(createEmptyProgress());
  });

  test('saves and loads progress', async () => {
    const repo = new LocalStorageProgressRepository('kana-progress-test');
    const progress = { ...createEmptyProgress(), activeLevelId: 'hiragana-ka' };

    await repo.save(progress);

    await expect(repo.load()).resolves.toEqual(progress);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/web/LocalStorageProgressRepository.test.ts
```

Expected: FAIL because `LocalStorageProgressRepository` does not exist.

- [ ] **Step 3: GREEN - define ports and browser adapters**

Create `src/app/ports.ts`:

```ts
import type { ProgressState } from '../core/progress/model';

export interface ProgressRepository {
  load(): Promise<ProgressState>;
  save(progress: ProgressState): Promise<void>;
}

export interface AudioService {
  playKey(): Promise<void>;
  playKana(kanaText: string): Promise<void>;
  replayCurrent(): Promise<void>;
}

export interface FilePort {
  exportJson(data: unknown, filename: string): Promise<void>;
  importJson(): Promise<unknown>;
}
```

Create `src/core/shared/clock.ts`:

```ts
export interface Clock {
  now(): number;
}
```

Create `src/web/adapters/BrowserClock.ts`:

```ts
import type { Clock } from '../../core/shared/clock';

export class BrowserClock implements Clock {
  now(): number {
    return Date.now();
  }
}
```

Create `src/web/adapters/LocalStorageProgressRepository.ts`:

```ts
import type { ProgressRepository } from '../../app/ports';
import type { ProgressState } from '../../core/progress/model';
import { createEmptyProgress } from '../../core/progress/progress';
import { parseProgressBackup } from '../../core/progress/importExport';

export class LocalStorageProgressRepository implements ProgressRepository {
  constructor(private readonly key = 'kana50-progress') {}

  async load(): Promise<ProgressState> {
    const raw = localStorage.getItem(this.key);
    return raw ? parseProgressBackup(raw) : createEmptyProgress();
  }

  async save(progress: ProgressState): Promise<void> {
    localStorage.setItem(this.key, JSON.stringify(progress));
  }
}
```

Create `src/web/adapters/BrowserFilePort.ts`:

```ts
import type { FilePort } from '../../app/ports';

export class BrowserFilePort implements FilePort {
  async exportJson(data: unknown, filename: string): Promise<void> {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async importJson(): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        resolve(JSON.parse(await file.text()));
      };
      input.click();
    });
  }
}
```

Create `src/web/adapters/WebAudioService.ts`:

```ts
import type { AudioService } from '../../app/ports';

export class WebAudioService implements AudioService {
  private lastKanaText = '';

  async playKey(): Promise<void> {
    await this.beep(220, 0.025);
  }

  async playKana(kanaText: string): Promise<void> {
    this.lastKanaText = kanaText;
  }

  async replayCurrent(): Promise<void> {
    if (this.lastKanaText) {
      await this.playKana(this.lastKanaText);
    }
  }

  private async beep(frequency: number, durationSeconds: number): Promise<void> {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + durationSeconds);
    await context.close();
  }
}
```

If TypeScript reports `webkitAudioContext` missing, create `src/web/audioTypes.d.ts`:

```ts
interface Window {
  webkitAudioContext?: typeof AudioContext;
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/web/LocalStorageProgressRepository.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/app/ports.ts src/core/shared/clock.ts src/web tests/web/LocalStorageProgressRepository.test.ts
git commit -m "feat: add browser adapters"
```

Expected: commit created.

---

### Task 10: Application Service

**Files:**
- Create: `src/app/KanaTrainer.ts`
- Test: `tests/app/KanaTrainer.test.ts`

- [ ] **Step 1: RED - write app service behavior test**

Create `tests/app/KanaTrainer.test.ts`:

```ts
import { describe, expect, test, vi } from 'vitest';
import type { AudioService, ProgressRepository } from '../../src/app/ports';
import { KanaTrainer } from '../../src/app/KanaTrainer';
import { createEmptyProgress } from '../../src/core/progress/progress';

describe('KanaTrainer', () => {
  test('loads progress and starts the active level', async () => {
    const repo: ProgressRepository = {
      load: vi.fn(async () => createEmptyProgress()),
      save: vi.fn(async () => undefined),
    };
    const audio: AudioService = {
      playKey: vi.fn(async () => undefined),
      playKana: vi.fn(async () => undefined),
      replayCurrent: vi.fn(async () => undefined),
    };
    const trainer = new KanaTrainer(repo, audio, { now: () => 1000 });

    const state = await trainer.load();

    expect(state.progress.activeLevelId).toBe('hiragana-a');
    expect(state.session.status).toBe('ready');
    expect(state.currentLevel.name).toBe('あ行');
  });

  test('plays key audio when typing', async () => {
    const repo: ProgressRepository = {
      load: vi.fn(async () => createEmptyProgress()),
      save: vi.fn(async () => undefined),
    };
    const audio: AudioService = {
      playKey: vi.fn(async () => undefined),
      playKana: vi.fn(async () => undefined),
      replayCurrent: vi.fn(async () => undefined),
    };
    const trainer = new KanaTrainer(repo, audio, { now: () => 1000 });

    await trainer.load();
    await trainer.typeCharacter('a');

    expect(audio.playKey).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/app/KanaTrainer.test.ts
```

Expected: FAIL because `KanaTrainer` does not exist.

- [ ] **Step 3: GREEN - implement application service**

Create `src/app/KanaTrainer.ts`:

```ts
import type { AudioService, ProgressRepository } from './ports';
import type { Clock } from '../core/shared/clock';
import type { Level } from '../core/learning-content/levelCatalog';
import { findKanaByText } from '../core/learning-content/kanaCatalog';
import { getLevelById } from '../core/learning-content/levelCatalog';
import type { ProgressState } from '../core/progress/model';
import { createPracticeSession, type PracticeSession } from '../core/practice/practiceSession';

export interface KanaTrainerState {
  progress: ProgressState;
  currentLevel: Level;
  session: PracticeSession;
}

export class KanaTrainer {
  private state?: KanaTrainerState;

  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly audioService: AudioService,
    private readonly clock: Clock,
  ) {}

  async load(): Promise<KanaTrainerState> {
    const progress = await this.progressRepository.load();
    const currentLevel = requireLevel(progress.activeLevelId);
    const session = createPracticeSession({
      levelId: currentLevel.id,
      prompts: currentLevel.kanaTexts.map((kanaText) => {
        const kana = findKanaByText(kanaText);
        if (!kana) throw new Error(`Unknown kana: ${kanaText}`);
        return { kanaText, romaji: kana.romaji };
      }),
      maxMistakes: currentLevel.maxMistakes,
      startedAt: this.clock.now(),
    });
    this.state = { progress, currentLevel, session };
    return this.state;
  }

  async typeCharacter(character: string): Promise<KanaTrainerState> {
    if (!this.state) {
      await this.load();
    }
    await this.audioService.playKey();
    const current = this.state as KanaTrainerState;
    this.state = {
      ...current,
      session: current.session.typeCharacter(character, this.clock.now()),
    };
    return this.state;
  }
}

function requireLevel(levelId: string): Level {
  const level = getLevelById(levelId);
  if (!level) {
    throw new Error(`Unknown active level: ${levelId}`);
  }
  return level;
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/app/KanaTrainer.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/app/KanaTrainer.ts tests/app/KanaTrainer.test.ts
git commit -m "feat: add kana trainer service"
```

Expected: commit created.

---

### Task 11: React Practice UI

**Files:**
- Modify: `src/ui/App.tsx`
- Modify: `src/ui/styles.css`
- Create: `src/ui/components/Dashboard.tsx`
- Create: `src/ui/components/KanaLine.tsx`
- Create: `src/ui/components/KanaHelper.tsx`
- Create: `src/ui/components/LevelDrawer.tsx`
- Create: `src/ui/components/TopToolbar.tsx`
- Create: `src/ui/components/ResultDialog.tsx`
- Test: `tests/ui/practicePage.test.tsx`

- [ ] **Step 1: RED - write practice page component test**

Create `tests/ui/practicePage.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import { App } from '../../src/ui/App';

describe('practice page', () => {
  test('opens directly into the active kana practice level', async () => {
    render(<App />);

    expect(await screen.findByText('kana50.com')).toBeInTheDocument();
    expect(await screen.findByText('预备')).toBeInTheDocument();
    expect(await screen.findByText('あ行')).toBeInTheDocument();
    expect(await screen.findByText('点击或按空格开始输入')).toBeInTheDocument();
  });

  test('shows level drawer when switching levels', async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole('button', { name: '切换关卡' }));

    expect(await screen.findByText('关卡列表')).toBeInTheDocument();
    expect(await screen.findByText('平假名 - 基础')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run test:run -- tests/ui/practicePage.test.tsx
```

Expected: FAIL because `App` still renders only scaffold text.

- [ ] **Step 3: GREEN - implement minimal UI composition**

Create `src/ui/components/Dashboard.tsx`:

```tsx
interface DashboardProps {
  status: string;
  elapsedSeconds: number;
  accuracy: number;
  mistakes: number;
  maxMistakes: number;
  kanaPerMinute: number;
}

export function Dashboard(props: DashboardProps) {
  return (
    <div className="dashboard" aria-label="练习状态">
      <span>{props.status}</span>
      <span>{props.elapsedSeconds}s</span>
      <span>{(props.accuracy * 100).toFixed(1)}%</span>
      <span>
        {props.mistakes}/{props.maxMistakes}
      </span>
      <span>{props.kanaPerMinute.toFixed(1)}假名/分钟</span>
    </div>
  );
}
```

Create `src/ui/components/TopToolbar.tsx`:

```tsx
export function TopToolbar() {
  return (
    <nav className="top-toolbar" aria-label="工具入口">
      <button>自学</button>
      <button>易混淆</button>
      <button>错题</button>
      <button>导出</button>
      <button>导入</button>
      <button>设置</button>
      <button>全屏</button>
    </nav>
  );
}
```

Create `src/ui/components/KanaLine.tsx`:

```tsx
interface KanaLineProps {
  kanaTexts: readonly string[];
  currentIndex: number;
  started: boolean;
}

export function KanaLine({ kanaTexts, currentIndex, started }: KanaLineProps) {
  return (
    <div className={started ? 'kana-line' : 'kana-line kana-line--blurred'} aria-label="当前关卡内容">
      {kanaTexts.map((kana, index) => (
        <span className={index === currentIndex ? 'kana-line__current' : undefined} key={`${kana}-${index}`}>
          {kana}
        </span>
      ))}
    </div>
  );
}
```

Create `src/ui/components/KanaHelper.tsx`:

```tsx
interface KanaHelperProps {
  kanaText: string;
  romaji: string;
  rowItems: readonly { kanaText: string; romaji: string }[];
}

export function KanaHelper({ kanaText, romaji, rowItems }: KanaHelperProps) {
  const [head, ...tail] = romaji.split('');
  return (
    <section className="kana-helper" aria-label="假名提示">
      <div className="kana-helper__big">{kanaText}</div>
      <div className="kana-helper__formula">
        罗马音提示：<strong>{[head, tail.join('')].filter(Boolean).join(' + ')} = {romaji}</strong>
      </div>
      <div className="kana-helper__row">
        {rowItems.map((item) => (
          <span className={item.kanaText === kanaText ? 'active' : undefined} key={item.kanaText}>
            {item.kanaText} {item.romaji}
          </span>
        ))}
      </div>
    </section>
  );
}
```

Create `src/ui/components/LevelDrawer.tsx`:

```tsx
import type { Course } from '../../core/learning-content/levelCatalog';

interface LevelDrawerProps {
  course: Course;
  activeLevelId: string;
}

export function LevelDrawer({ course, activeLevelId }: LevelDrawerProps) {
  return (
    <aside className="level-drawer" aria-label="关卡列表">
      <header>
        <strong>{course.name}</strong>
        <span>关卡列表</span>
      </header>
      {course.levels.map((level, index) => (
        <article className={level.id === activeLevelId ? 'level-card active' : 'level-card'} key={level.id}>
          <strong>
            {index + 1}/{course.levels.length} {level.name}
          </strong>
          <p>{level.kanaTexts.join(' ')}</p>
          <button disabled={level.id !== activeLevelId}>进入训练</button>
        </article>
      ))}
    </aside>
  );
}
```

Create `src/ui/components/ResultDialog.tsx`:

```tsx
interface ResultDialogProps {
  status: 'ready' | 'running' | 'passed' | 'failed';
}

export function ResultDialog({ status }: ResultDialogProps) {
  if (status !== 'passed' && status !== 'failed') return null;

  return (
    <dialog open className="result-dialog">
      <strong>{status === 'passed' ? '通关成功' : '本关失败'}</strong>
      <button>重练</button>
    </dialog>
  );
}
```

Modify `src/ui/App.tsx`:

```tsx
import { useMemo, useState } from 'react';
import { getCourse } from '../core/learning-content/levelCatalog';
import { findKanaByText, getKanaRow } from '../core/learning-content/kanaCatalog';
import { Dashboard } from './components/Dashboard';
import { KanaHelper } from './components/KanaHelper';
import { KanaLine } from './components/KanaLine';
import { LevelDrawer } from './components/LevelDrawer';
import { ResultDialog } from './components/ResultDialog';
import { TopToolbar } from './components/TopToolbar';

export function App() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const course = getCourse('hiragana-basic');
  const level = course.levels[0];
  const firstKana = findKanaByText(level.kanaTexts[0]);
  const rowItems = useMemo(
    () =>
      getKanaRow('hiragana', 'a').map((kana) => ({
        kanaText: kana.text,
        romaji: kana.romaji,
      })),
    [],
  );

  if (!firstKana) {
    throw new Error('First kana is missing from catalog');
  }

  return (
    <div className="practice-layout">
      <h1 className="brand">kana50.com</h1>
      <TopToolbar />
      <Dashboard status="预备" elapsedSeconds={0} accuracy={0} mistakes={0} maxMistakes={level.maxMistakes} kanaPerMinute={0} />
      <main className="practice-stage">
        <KanaLine kanaTexts={level.kanaTexts} currentIndex={0} started={false} />
        <p>点击或按空格开始输入</p>
        <KanaHelper kanaText={firstKana.text} romaji={firstKana.romaji} rowItems={rowItems} />
        <h2>
          {level.name}
          <button aria-label="切换关卡" onClick={() => setDrawerOpen((open) => !open)}>
            ↪
          </button>
        </h2>
      </main>
      {drawerOpen ? <LevelDrawer course={course} activeLevelId={level.id} /> : null}
      <ResultDialog status="ready" />
    </div>
  );
}
```

Replace `src/ui/styles.css` with:

```css
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: Arial, "Microsoft YaHei", sans-serif;
  background: #fff;
  color: #222;
}

button {
  font: inherit;
}

.practice-layout {
  min-height: 100vh;
  padding-top: 88px;
}

.brand {
  position: fixed;
  top: 10px;
  left: 18px;
  margin: 0;
  font-size: 22px;
}

.top-toolbar {
  position: fixed;
  top: 8px;
  right: 16px;
  display: flex;
  gap: 8px;
}

.top-toolbar button {
  border: 0;
  background: transparent;
  cursor: pointer;
}

.dashboard {
  position: fixed;
  top: 54px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 18px;
}

.practice-stage {
  width: min(720px, calc(100vw - 48px));
  margin: 0 auto;
  text-align: center;
}

.kana-line {
  display: flex;
  justify-content: center;
  gap: 18px;
  min-height: 58px;
  font-size: 38px;
  color: #777;
}

.kana-line--blurred {
  filter: blur(2px);
}

.kana-line__current {
  color: #111;
  border-bottom: 3px solid #111;
}

.kana-helper {
  margin: 36px auto 16px;
  width: min(620px, 100%);
  border: 1px solid #d8d8d8;
  border-radius: 6px;
  padding: 16px;
}

.kana-helper__big {
  display: inline-grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border: 2px solid #222;
  border-radius: 8px;
  font-size: 44px;
  font-weight: 700;
}

.kana-helper__formula {
  margin-top: 12px;
}

.kana-helper__row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 14px;
}

.kana-helper__row span {
  border: 1px solid #d0d0d0;
  border-radius: 5px;
  padding: 8px 4px;
}

.kana-helper__row .active {
  background: #222;
  color: #fff;
}

.level-drawer {
  position: fixed;
  top: 64px;
  right: 12px;
  bottom: 12px;
  width: 390px;
  overflow: auto;
}

.level-drawer header,
.level-card {
  border: 1px solid #d3d3d3;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.14);
}

.level-drawer header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.level-card {
  margin-bottom: 8px;
}

.level-card.active {
  border-color: #222;
}

.result-dialog {
  border: 1px solid #ddd;
  border-radius: 8px;
}
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run test:run -- tests/ui/practicePage.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add src/ui tests/ui/practicePage.test.tsx
git commit -m "feat: add practice page shell"
```

Expected: commit created.

---

### Task 12: Keyboard Flow and E2E Smoke

**Files:**
- Modify: `src/ui/App.tsx`
- Test: `tests/e2e/practice.spec.ts`

- [ ] **Step 1: RED - write Playwright flow test**

Create `tests/e2e/practice.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test('learner can open practice, start with space, switch levels, and see kana helper', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('kana50.com')).toBeVisible();
  await expect(page.getByText('点击或按空格开始输入')).toBeVisible();
  await expect(page.getByLabel('假名提示')).toContainText('あ');

  await page.keyboard.press('Space');

  await expect(page.getByLabel('练习状态')).toContainText('运行中');

  await page.getByRole('button', { name: '切换关卡' }).click();

  await expect(page.getByLabel('关卡列表')).toBeVisible();
  await expect(page.getByText('平假名 - 基础')).toBeVisible();
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm run e2e -- tests/e2e/practice.spec.ts
```

Expected: FAIL because Space does not start the session.

- [ ] **Step 3: GREEN - wire Space and Tab behavior**

Modify `src/ui/App.tsx` by adding state and keyboard handling:

```tsx
import { useEffect, useMemo, useState } from 'react';
```

Inside `App`:

```tsx
const [started, setStarted] = useState(false);

useEffect(() => {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      event.preventDefault();
      setStarted(true);
    }
    if (event.code === 'Tab') {
      event.preventDefault();
      setStarted(false);
    }
  };
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, []);
```

Pass `started` into `Dashboard` and `KanaLine`:

```tsx
<Dashboard
  status={started ? '运行中' : '预备'}
  elapsedSeconds={0}
  accuracy={0}
  mistakes={0}
  maxMistakes={level.maxMistakes}
  kanaPerMinute={0}
/>
<KanaLine kanaTexts={level.kanaTexts} currentIndex={0} started={started} />
```

- [ ] **Step 4: Verify GREEN**

Run:

```powershell
npm run e2e -- tests/e2e/practice.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Run full verification**

Run:

```powershell
npm run check
npm run e2e
```

Expected: both commands exit 0.

- [ ] **Step 6: Commit**

Run:

```powershell
git add src/ui/App.tsx tests/e2e/practice.spec.ts
git commit -m "feat: add keyboard practice flow"
```

Expected: commit created.

---

## Self-Review

Spec coverage:

- First screen and dazidazi-style practice UI: Task 11 and Task 12.
- Top dashboard: Task 11.
- Kana line and helper: Task 11.
- Level switcher: Task 3 and Task 11.
- Fixed level sets: Task 3.
- TDD domain core: Tasks 2 through 8.
- Audio rules as ports: Task 9, with richer kana pronunciation assets left behind the `AudioService` interface.
- Local progress: Task 6 and Task 9.
- Import/export preview and merge: Task 7.
- Review practice from mistakes: Task 8.
- Browser flow test: Task 12.
- Future iOS/app optionality: preserved by keeping `src/core` free of browser and React dependencies.

Placeholder scan:

- This plan intentionally avoids unresolved placeholder terms and unspecified implementation steps.
- Every production behavior task starts with a failing test and a concrete expected failure.
- Configuration-only scaffold is isolated in Task 1 before domain behavior begins.

Type consistency:

- `LevelId`, `CourseId`, and `KanaId` are branded strings from `src/core/shared/ids.ts`.
- `Level` and `Course` come from `src/core/learning-content/levelCatalog.ts`.
- `PracticeSession` exposes `typeCharacter()` and `reset()` consistently in app and tests.
- `ProgressState` is schema version 1 across progress, import/export, and browser storage.
