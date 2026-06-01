# Ubiquitous Language

## Learning content

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Kana** | A Japanese syllabary character that the learner must recognize and type as romaji. | Japanese letter, symbol |
| **Hiragana** | The kana script used for the hiragana training course. | 平假名 mode |
| **Katakana** | The kana script used for the katakana training course. | 片假名 mode |
| **Romaji** | The Latin-letter input expected for a kana. | Pinyin, roman spelling |
| **Kana Row** | A five-sound group such as `か き く け こ` used as a learning unit. | line, group |
| **Confusion Pair** | Two or more kana that learners commonly confuse by shape, sound, or romaji. | similar kana, hard pair |

## Training flow

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Course** | A sequence of levels for one training scope, such as hiragana basics or katakana basics. | training scheme, mode |
| **Level** | A fixed training unit with its own kana set, pass rule, and unlock state. | stage, checkpoint |
| **Level Set** | The fixed kana included in a level. | generated content, random content |
| **Practice Session** | One attempt at a level from start to pass, fail, or reset. | run, test |
| **Prompt** | The current kana item or kana sequence the learner is typing. | question, problem |
| **Attempt** | The learner's submitted romaji input for a prompt. | answer, typing result |
| **Mistake** | A failed input event associated with a kana and expected romaji. | wrong answer, typo |
| **Review Practice** | A focused practice session generated from mistakes or confusion pairs. | remedial test |

## Progress and scoring

| Term | Definition | Aliases to avoid |
| --- | --- | --- |
| **Progress** | The learner's local saved state across courses, levels, scores, mistakes, and settings. | save data, record |
| **Level Result** | The best known outcome for one level, including accuracy, speed, stars, and pass state. | score row |
| **Accuracy** | The percentage of prompts or input units completed correctly in a practice session. | correctness |
| **Speed** | The rate of completed kana over elapsed time. | WPM, CPM |
| **Star Rating** | A non-blocking performance grade based on speed after the pass accuracy is met. | grade |
| **Unlock Rule** | The condition that makes a level available. | gate, prerequisite |

## Relationships

- A **Course** contains many **Levels**.
- A **Level** has exactly one **Level Set**.
- A **Practice Session** attempts exactly one **Level**.
- A **Prompt** belongs to one **Practice Session**.
- A **Mistake** records the **Kana**, expected **Romaji**, and actual input from an **Attempt**.
- **Progress** stores many **Level Results**.
- **Review Practice** uses **Mistakes** and **Confusion Pairs**, but does not block the main **Course**.

## Example dialogue

> **Dev:** "When the learner opens the app, do we choose a random kana?"

> **Domain expert:** "No. We load the active **Course** and active **Level** from **Progress**, then present prompts from that level's **Level Set**."

> **Dev:** "So a wrong `si` for `し` creates a **Mistake** against the kana `し` and expected **Romaji** `shi`?"

> **Domain expert:** "Exactly. That **Mistake** can later feed **Review Practice**, but it does not change the original **Level Set**."

## Flagged ambiguities

- "关卡内容" should mean **Level Set**, not generated random content.
- "错题" should mean **Mistakes** and derived **Review Practice**, not a separate main course.
- "速度" should mean **Speed** measured in kana per minute, not keyboard WPM.

## Implementation notes

- `Progress.levelResults` and `Progress.mistakeStats` are arrays in persisted schema version `1`; merge behavior lives in the progress/import-export core rather than in UI adapters.
- `Review Practice` currently uses the branded level id `review-mistakes` and is generated from accumulated `MistakeStat` entries.
- `Practice Session.status === "passed"` means the prompt sequence reached a terminal completion state. The app-level trainer maps the scored result to `passed` or `failed` according to the level pass accuracy.
- The toolbar terms **Self Study**, **Confusion Pair**, **Review Practice**, **Export**, and **Import** are visible in UI, but several of those flows remain follow-up product slices rather than completed bounded contexts in the web shell.
