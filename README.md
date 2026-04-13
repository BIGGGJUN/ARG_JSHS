# Minecraft Advancement ARG 템플릿 사용 가이드 (리디자인 버전)

이 템플릿은 **마인크래프트 업적 / 제작대 UI 감성**을 섞은 온라인 방탈출 / ARG 뼈대입니다.

## 핵심 특징

- 로비는 닫힌 틀을 열어 해금된 문제만 보는 업적 트리 화면으로 구성됩니다.
- 카테고리는 순차 해금, 카테고리 내부 문제도 순차 해금되며 잠긴 문제는 로비에 보이지 않습니다.
- 문제 수는 `js/game-data.js` 배열만 수정하면 자동 반영됩니다.
- 각 문제는 독립 HTML 페이지입니다.
- 총 소요 시간만 저장/표시합니다.
- 힌트는 오답 `3 / 7 / 12`회에서 각각 **해금만** 되고, 사용자가 눌러야 열립니다.
- 로고는 `assets/branding/logo-placeholder.png` 파일만 교체하면 됩니다.
- 클릭/정답/오답/해금/토스트/BGM이 공통 스크립트로 연결되어 있습니다.

## 가장 많이 수정하는 파일

### 1) 문제 구조 / 카테고리 구조

`js/game-data.js`

여기서 아래 정보를 한 번에 관리합니다.

- 카테고리 순서
- 카테고리 잠금 조건
- 문제 개수
- 문제 제목 / 설명
- 문제 HTML 경로
- 정답 배열
- 힌트 3단계
- 아이콘 / 프레임 타입
- 카테고리 배경 / 색상
- 오디오 경로

문제 수를 늘리거나 줄여도 로비 UI는 자동으로 맞춰집니다.

업적 트리 위치를 수동으로 조절하고 싶다면 각 문제 객체에 아래처럼 `treePosition`을 넣으면 됩니다. 넣지 않으면 선행 관계 기준으로 자동 배치됩니다.

```js
treePosition: { col: 2, row: 1 }
```

### 2) 새 문제 추가하기

1. `pages/카테고리명/새문제.html` 파일을 만듭니다.
2. 파일 상단에 `window.CURRENT_QUESTION_ID = '새문제ID';` 를 넣습니다.
3. `js/game-data.js`의 해당 카테고리 `questions` 배열에 새 객체를 추가합니다.
4. `file`, `acceptedAnswers`, `hints`, `prerequisiteIds`, `icon` 등을 채웁니다.

예시:

```js
{
  id: 'story-3',
  title: '새 문제',
  shortTitle: 'NEW',
  description: '설명',
  file: 'pages/story/q3.html',
  icon: ASSETS.icons.bookshelf,
  frameType: 'task',
  acceptedAnswers: ['BOOKSHELF'],
  prerequisiteIds: ['story-2'],
  hints: ['힌트1', '힌트2', '힌트3']
}
```

### 3) 해금 규칙 바꾸기

#### 카테고리 해금

`unlockAfterCategoryId`

- `null` → 처음부터 열림
- `'story'` → `story` 카테고리를 모두 해결해야 열림

#### 문제 해금

`prerequisiteIds`

- `[]` → 카테고리 열리면 바로 열림
- `['story-1']` → 해당 문제 해결 후 해금
- `['story-1', 'story-2']` → 둘 다 해결해야 해금

### 4) 정답 판정 바꾸기

정답은 공백을 정리하고 대소문자를 무시해 비교합니다.

```js
acceptedAnswers: ['CLOCK', '시계']
```

처럼 여러 개를 넣을 수 있습니다.

### 5) 로고 교체하기

아래 파일을 원하는 이미지로 바꾸면 됩니다.

```text
assets/branding/logo-placeholder.png
```

같은 파일명을 유지하면 추가 수정 없이 바로 반영됩니다.

### 6) 사운드 / 배경음 바꾸기

`js/game-data.js`의 `audio.sounds` 항목만 바꾸면 됩니다.

- `click`
- `hover`
- `wrong`
- `success`
- `unlock`
- `toast`
- `bgm`

현재는 Minecraft 관련 원본 음원 URL + 로컬 fallback WAV 구조로 되어 있습니다.

## 유지보수 포인트

- 로비 디자인: `index.html`, `css/lobby.css`, `js/render-lobby.js`
- 문제 공통 로직: `js/question-page.js`
- 저장 / 해금 / 시간: `js/state.js`
- 문제 데이터 설정: `js/game-data.js`
- 개별 퍼즐 본문: `pages/.../*.html`
- 공통 이펙트: `js/audio.js`, `js/effects.js`

## 저장 방식

브라우저 `localStorage`에 아래 정보가 저장됩니다.

- 총 소요 시간
- 문제별 오답 횟수
- 문제 해결 여부
- 본 힌트 단계
- 오디오 ON/OFF 상태

## 추천 배포 방식

정적 호스팅(GitHub Pages, Netlify, Cloudflare Pages 등)에 올리면 가장 안정적입니다.
로컬 테스트는 파일을 직접 열어도 되지만, 외부 폰트/사운드 로딩까지 보려면 간단한 로컬 서버를 쓰는 편이 좋습니다.
# ARG_JSHS
