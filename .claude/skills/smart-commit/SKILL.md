---
name: smart-commit
description: 커밋, 푸시, PR 생성/업데이트. "커밋해줘", "변경사항 올려줘", "PR 만들어줘", "push 해줘" 등의 요청에 사용
allowed-tools: Read, Bash(git:*), Bash(gh:*)
---

# Smart Commit & PR

> **참고:** 커밋 컨벤션은 `CLAUDE.md`를 따릅니다.
> **언어:** 모든 결과 보고 및 PR 본문은 **한글**로 작성합니다.

## 0. 브랜치 전략 준수 확인 (필수!)

**직접 push 금지 브랜치**: `main`, `dev`

| 현재 브랜치 | push 가능? | 조치 |
|------------|-----------|------|
| `main` | 금지 | "main에 직접 push할 수 없습니다. feature 브랜치를 생성하세요." 안내 후 중단 |
| `dev` | 금지 | "dev에 직접 push할 수 없습니다. feature 브랜치를 생성하세요." 안내 후 중단 |
| `feature/*`, `fix/*`, `hotfix/*` | 허용 | 계속 진행 |

## 1. 현재 상태 및 변경사항 확인

```bash
git status
git diff --stat
git diff --staged --stat
```

- 변경사항이 없으면 "커밋할 내용이 없습니다" 안내 후 3단계로 건너뛰기

## 2. 스테이징 및 커밋

**변경사항이 있는 경우에만 실행**:

```bash
git add .
git commit -m "<type>(<scope>): <한글 설명>"
git push origin $CURRENT_BRANCH
```

**커밋 메시지 규칙**:
- `feat`: 새 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `test`: 테스트 추가
- `docs`: 문서 변경
- `chore`: 설정/빌드 변경

**금지 사항**:
- 커밋 메시지에 AI/Claude 관련 문구 포함 금지

## 3. Target Branch 결정

> ⚠️ **중요**: 이 프로젝트의 모든 PR은 **`dev`** 브랜치로 생성합니다.

| 현재 브랜치 패턴 | Target Branch |
|----------------|---------------|
| `feature/*` | **`dev`** |
| `fix/*` | **`dev`** |
| `hotfix/*` | **`dev`** |
| 기타 | **`dev`** |

🔴 **main 브랜치로 PR 생성 금지** - dev → main 머지는 릴리즈 담당자만 수행

## 4. PR 존재 여부 확인

```bash
PR_URL=$(gh pr view --json url,state --jq 'select(.state == "OPEN") | .url' 2>/dev/null || echo "")
```

- URL 있음 → PR 업데이트
- 비어있음 → PR 신규 생성

## 4-A. PR 신규 생성

1. 브랜치명에서 이슈 번호 추출
2. PR 본문 작성 (한글)
3. `gh pr create --base $TARGET_BRANCH`

## 4-B. 기존 PR 업데이트

1. 변경 내역 분석
2. `gh pr edit` 로 본문 업데이트

## 5. 최종 보고

| 항목 | 값 |
|------|-----|
| 브랜치 | `$CURRENT_BRANCH` |
| 커밋 | O / X |
| PR 상태 | 신규 생성 / 업데이트 / 변경없음 |
| PR URL | `<URL>` |
