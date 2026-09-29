# WILDCARD* — 사이트

한 화면: **도시**. 스크롤 없음, 진입 애니메이션 없음. 사진 오른쪽 아래의 **1980년대 벽돌폰**(사진의 빛으로 렌더, 20° 틀어짐)을 누르면 영화 클립처럼 검은 바 → TV 노이즈(1.5초, 소리) → 영상이 신호를 잡듯 들어옴(소리 + 음원) → 마지막 프레임 위의 질문 →
흰 바탕의 매킨토시 → 화면으로 다가가 **베젤이 보이는 거리**에서 멈춤 → 그 화면 안에 영화의 오프닝 문장 → **READY FOR A REBIRTH?** + 픽셀 빨간약/파란약.
빨간약 = 코드비가 확대된 화면 위에서 시작해 매킨토시 전체로 줌아웃하는 동안 점점 굵어지고, 열마다 마지막 줄기가 검정으로 씻겨 내려가며 줄기가 하나씩 줄어든다 → 1초 컬러바 → **C.I.A 터미널**(기록을 찾거나 발급 — 아래 「기록」) → 흰 **/record**. 파란약 = 파란 404, 새로고침 전까지 먹통. **되돌아가기는 없다**(브라우저 뒤로가기만 도시로).
`/apply` 는 FORM W*–01, 카드 신청 폼 — 같은 터미널 안에서(아래 「FORM W*–01」).
갤러리(GALLERY)는 코드에 있고 페이지에서만 빠져 있다(아래). Next.js 16 + Tailwind CSS 4. 전 페이지 정적 생성.

## 실행

```bash
npm install
npm run dev          # http://localhost:3000  (Claude 프리뷰는 --port 3232)
npm run build        # 배포 전 검증
```

## 라우트

| 경로 | 내용 |
|---|---|
| `/` | 홈. 히어로 B + 내비 1안 |
| `/a` `/b` `/c` | 같은 페이지, 로고 위치만 A(가운데 15%) · B(왼쪽 위, 기본) · C(사진 윗변 걸침). 화면의 A·B·C 스위치는 뺐다 — 주소로만 |
| `/nav/1` `/nav/2` | 같은 페이지, 내비만 1안(WORK / OBJECTS / SPACE / THOUGHT) · 2안(WORK / SPACE / TEXT / INDEX) |
| `/apply` | FORM W*–01 — 카드 신청. 부팅 → 헤더 → 7섹션 → 선언 → 발급. noindex |
| `/apply/review` | 스튜디오용: 이 기기에 접수된 신청의 원본 JSON · PORTRAIT MAP 빈칸. noindex |
| `/terminal` | C.I.A 터미널만 — 영화 없이 기록으로 돌아올 때. noindex |
| `/auth/confirm` | 메일 링크가 돌아오는 곳: 검은 화면 `VERIFYING RECORD...` → 터미널. noindex |
| `/record` | 기록(세션이 있어야). noindex |

## 구조

| 파일 | 역할 |
|---|---|
| `components/Home.tsx` | 페이지. 모든 라우트가 이걸 그린다. |
| `components/Hero.tsx` | 도시 화면. 사진 · 워드마크 · 전화기(`Phone`) · 캡션 줄(내비). A·B·C 스위치는 뺐다(라우트는 남아 있다). |
| `components/Program.tsx` | 전화기(`Phone`, 판 안의 트리거)와 그 뒤 전부(클라이언트): 여덟 단계 idle → bars → static → film → end → mac → zoom → terminal. 줌의 수치는 시작 순간에 잰다. 터미널이 끝나면 `/apply?via=terminal` 로. **CLOSE · ESC · 클릭 복귀 없음.** 판이 size container 라 고정 스테이지는 판 밖에 두고 트리거만 context 로 잇는다. |
| `components/Pill.tsx` · `components/Error404.tsx` | 픽셀 알약(26×12 SVG) · 파란약의 404(캔버스 이진화 픽셀 폰트 + 입력 잠금, 새로고침 키만 통과). |
| `public/matrix/` | Rezmason/matrix(MIT)의 클래식 폰트 `Matrix-Code.ttf` 와 LICENSE 만. WebGL 페이지는 `tools/.props/matrix-iframe/`(배포 안 함). |
| `components/CodeRain.tsx` | 빨간약의 코드비: Rezmason 의 폰트 · 글리프 순서 · 클래식 색 · 원리로 그린 투명 캔버스. 격자는 **장면 좌표**, 매 프레임 매킨토시의 화면상 크기 · 위치(`camera()`)로 그려 줌을 따라 글자가 같은 비율로 축소(`PROGRAM.rainInScene`, false 면 창 기준 고정 크기). 스프라이트는 배율 1 · 2.2 · 시작 배율 세 벌. `build` 초 동안 굵어지고, `draining` 이면 열마다 마지막 줄기가 흰색을 끌고 내려가며 줄어든다 → 전부 흰색이면 `onDone`. |
| `components/Terminal.tsx` | 영화식 타이핑: 화면(`screens`) 단위로 타이핑 → 멈춤(`holds`) → 한꺼번에 지움 → 빈 화면의 커서 → 다음, 끝나면 `onDone`. 한 화면만이면 `lines`. |
| `components/Terminal.tsx` | 검은 화면의 타이핑: 줄 배열을 순서대로, 글자마다 불균일한 간격, 블록 커서. 다 치면 children(카드 자리)을 낸다. |
| `components/Question.tsx` | WHO DECIDES WHAT YOU ARE? 아웃라인 SVG(단어별 path, DECIDES 빈칸). |
| `lib/mac.ts` · `lib/phone.ts` | 생성됨 — 두 렌더 스틸의 크기, 매킨토시는 **화면 사각형**과 **근접 플레이트**(`close`)도. `tools/render-props.py` 가 쓴다. |
| `tools/render-props.py` | Blender 로 .glb 두 개를 스튜디오 조명(키 · 필 · 림 · 톱, 알파)에 렌더 → `public/program/mac.webp` · `mac-close.webp` · `public/hero/phone.webp` + `lib/*.ts`. 전화기는 강철 재질 + 색보정. |
| `tools/build-static.py` | TV 노이즈 클립 `public/program/static.mp4`(1.2초 루프, 640×360, 히스 포함)를 numpy + ffmpeg 로 만든다. |
| `components/apply/*` · `lib/apply/*` | FORM W*–01 (아래). |
| `components/SelectedWorks.tsx` | (보류) 갤러리. 지금은 어디서도 쓰지 않는다. |
| `components/Wordmark.tsx` | WILDCARD* 아웃라인 SVG. |
| `lib/hero.ts` | 히어로 사진, 내비 두 세트, A·B·C 정의(`later` = 앞으로의 의미). |
| `lib/program.ts` | 영상 파일 경로, LOAD 라벨, 모든 시간(바 · 지직임 · 질문 · 페이드 · 바 퇴장 · 정지 · 줌 · 타이핑), 터미널 줄. |
| `lib/works.ts` | 갤러리 데이터. |
| `lib/wordmark.ts` · `lib/manifesto.ts` · `lib/captions.ts` | 생성된 아웃라인(워드마크 · 질문 · 자막 5줄). 손으로 고치지 않는다. |
| `app/globals.css` | 색 · 치수 토큰, 로고 크기 규칙, A·B·C 배치, 프로그램(스테이지 · 자막 · 질문 · 버튼), 갤러리 배치, 움직임. |
| `tools/build-type.py` | 아웃라인 생성기 (아래). |

## 워드마크 크기 — 사진 기준

로고는 창이 아니라 **사진이 실제로 그려진 폭**에 비례한다(25.7%, B 는 ×1.125). 사진은 `cover` 라 창이 좁아지면 잘릴 뿐 줄지 않으므로,
로고도 장면과 같은 크기로 남는다. 보이는 사진 폭의 60%(B 67.5%)를 넘으면 그때부터 폭을 따라 줄어든다.

- 기준 비율: `--mark-ratio` (전체화면 1707 CSS px 창에서 420px)
- 상한: `--mark-max`
- B 배율 · 여백: `.hero[data-placement='left']` 규칙 (`--mark-scale`, 위 0.55 · 왼쪽 0.4 로고 높이)
- 계산은 `.hero-plate` 의 컨테이너 단위(`cqw`/`cqh`)로 한다. 그 변수들은 판 안에서만 쓴다.
- **전화기**도 같은 기준: 높이 = 그려진 사진 높이의 40%(`--phone-h`, 안테나 포함 — 가늘고 길어서 30% 면 막대로 읽힌다), 판 높이의 50% 상한. 오른쪽 · 아래 여백은 로고의 왼쪽 여백과 같다(0.4 로고 높이). 1440×900 창에서 318px.

## 이미지 교체

- **히어로**: `public/hero/` 에 넣고 `lib/hero.ts` 의 `src` `width` `height` `alt`. 로고 크기 계산이 `width/height` 비율을 읽는다.
- **갤러리**: `public/works/<작품>/` 에 WebP(원본 크기, q85~90)로 넣고 `lib/works.ts` 에 도판 한 줄.
- 둘 다 **재인코딩 없이 원본 그대로** 나간다(`unoptimized`). AVIF 변환이 그레인을 뭉개기 때문.

## 워드마크 · 질문 문장 (아웃라인)

`WILDCARD*` 와 `WHO DECIDES / WHAT YOU ARE?` 는 텍스트가 아니라 SVG 패스다. 원본 서체는 **Nimbus Sans L Bold**
(URW++, Helvetica 메트릭 호환 클론, GPL + 문서 삽입 예외) — 이 PC 의 한컴오피스 번들 Ghostscript 폴더에서 읽는다.
폰트 파일은 저장소에 없고 쓰는 글자의 아웃라인만 있다.

```bash
npm run type                                   # 자간 -30/1000 em, 행간 0.96 em
python tools/build-type.py --track -20         # 자간 조정 (워드마크 · 질문 둘 다)
python tools/build-type.py --leading 1.0       # 질문 행간
python tools/build-type.py --font <경로>        # 다른 서체(.pfb + .afm 한 쌍)
```

질문은 단어마다 path 가 따로 있다. DECIDES 자리의 빈칸은 서체 underscore 굵기의 선을 단어 폭으로, 기준선 위에 그린다.

## 폰트 폴백 (작은 글자)

내비 · 캡션 같은 작은 글자는 시스템 서체: `'Helvetica World' → 'Helvetica Neue' → Helvetica → Arial → sans-serif`.
`Helvetica World` 는 `@font-face { src: local() }` 로만 선언 — 설치된 PC 에서만 그 서체, 다운로드 · 임베드 없음.
모든 방문자에게 같은 서체를 주려면 웹폰트 라이선스 후 `url()` 소스를 추가한다.

## 움직임 (전부)

- 히어로 진입: **없음**(2026-09-29 본인 지시 "그냥 뜨게" — 페이드 삭제). 첫 화면은 전화기를 누를 때까지 아무것도 움직이지 않는다.
- (갤러리 복귀 시에만) 질문 벽: 첫 줄 → 둘째 줄 페이드, 한 번씩. 벽이 페이지의 끝이면 둘째 줄은 맨 끝 스크롤과 함께 온다.
  뒤에 섹션이 있으면(갤러리 복귀 시) 벽이 화면을 채운 뒤 30% 동안 멈추고(sticky), 둘째 줄은 그 멈춤 안에서 온다.
- DECIDES hover (마우스 기기만).
- `prefers-reduced-motion` 이면 전부 없음. JS 가 없으면 두 줄이 처음부터 보인다.

## 배포

```bash
vercel          # 프리뷰
vercel --prod   # 프로덕션
```

Vercel 프로젝트 `wildcard-site` (anthony-kims-projects). 연결 정보는 `.vercel/` (git 제외).

## 전화기 → 바 → 노이즈 → 영상 → 질문 → 매킨토시 → 오프닝 → 알약

**9/29 밤 변경 요약**: 노이즈 1.5초 + 영화 잠김 1.1초(`film-lock`: 위로 밀린 과노출 → 튐 → 안착, 노이즈는 0.7초에 걸쳐 밑에서 옅어짐). 음원은 **두 곡 교대**(끝나면 다른 곡; 관람마다 시작 곡도 번갈아 — 이 브라우저의 첫 관람은 `powerful.m4a`, 다음은 `strongest.m4a` …, 그 관람의 첫 곡 번호는 전화기를 누를 때 `localStorage` `wildcard.track`; 곡 전체, −20 LUFS 고정 게인, AAC 160k; 한 곡이 안 열리면 다른 곡; 전화기를 누를 때부터 버퍼링)가 영화와 함께 Web Audio 게인으로 들어온다(`PROGRAM.mix`: 영화 0.5 · 음악 0.62, 영화가 끝나면 음악 0.88). 음악은 **곡이 끝날 때까지** 흐른다 — 매킨토시 · 터미널 · 알약 · 파란약 404 에서도. 홈으로 돌아올(새로고침) 때까지. 줌은 ease-in-out, 화면이 뷰포트의 `fit`(0.9)에서 멈춰 베젤이 보임. 터미널 층은 그 화면 사각형(`--crt-x/y/w/h`)에 놓이고, 그 안의 켜진 영역(`.crt-raster`, 유리 폭 88%, 3:2)에 **512×342 1비트 캔버스**(`components/PixelScreen.tsx`)가 보간 없이 확대된다 — 매킨토시 128K 의 실제 해상도. 주사선 피치 = 켜진 영역 높이 ÷ 342. 알약은 같은 격자 1:1. 리사이즈 시 재측정. 오프닝 뒤 `rebirth`(READY FOR A REBIRTH? → 0.7초 뒤 알약). 바: 흰 장면의 매킨토시를 레터박스 안에 두었다가 줌(3.2초)과 같은 시간 · 곡선으로 걷힌다. 빨간약: `rain`(줌아웃 4.4초 + 코드비 굵어짐) → 0.9초 → `wash`(드레인: 줄기 감소 + 흰색 씻김, 약 3.6초, `CodeRain` 이 끝을 알림; 안전장치 9초) → `white`. 알약은 56×24 격자 · 8톤 · 4×4 디더(`components/Pill.tsx`). 파란약: `crash`(Error404). 시간은 전부 `lib/program.ts`.


`lib/program.ts` 가 `public/program/dreams.mp4`(전체 34초, 소리 포함, 1080p CRF23, 11.6MB)를 가리킨다. 원본은 `WORKS/2026-09_wildcard-dreams/out/`.
- **전화기**(사진 오른쪽 아래, `aria-label` Load)를 누르면: 도시 위로 위아래 검은 바가 0.7초에 올라와 **2.39:1** 레터박스(폰 세로는 16:9) → 그 사이에 0.85초 **TV 노이즈**(`public/program/static.mp4`, 소리 포함 — 직접 만든 아날로그 스노우: 가로로 번진 노이즈 · 두 필드 · 구르는 밴드 · 찢김 · 싱크 드롭, `tools/build-static.py`; 그 위에 검은 컷 두 번) → 영상이 소리와 함께 시작. 시간은 `PROGRAM.bars` `PROGRAM.static`. 휴대폰은 탭 안에서 부른 재생만 소리를 허락해서, 탭 순간에 영화 · 노이즈 · 음악을 소리 없이 한 번 틀었다 멈춰 풀어 둔다(`load` 의 `prime`). 영화는 실제로 돌기 시작할 때 화면에 나오고(`running`), 그 전까지는 노이즈가 이어진다. 소리가 막히면 무음 + SOUND 토글, 무음도 막히면 다음 터치에 시작. 아이폰 무음 스위치는 `navigator.audioSession.type = 'playback'`.
- **어떤 비율에서도 클립 모양**: 바는 위아래 각각 최소 5svh(`--bar-min`) — 21:9 모니터처럼 화면이 2.39 에 가까우면 바가 없어지고 그러면 클립이 아니다. 그래서 약 2.15:1 보다 넓은 창은 2.39 상자를 가운데 두고 양옆도 잉크(`--screen-w`). 지직임부터 스테이지 전체가 잉크.
- 16:9 영상은 2.39 안에서 상하가 잘린다. `object-position: 50% 15%` 로 머리를 살렸다(`WORKS/2026-09_wildcard-dreams/study/letterbox-check.jpg`).
- **자막**: `lib/captions.ts` — 다섯 줄이 Helvetica Bold(클론) 아웃라인, 화면 하단 5%. 글자를 바꾸려면 `tools/build-type.py` 의 `CAPTIONS` 를 고치고 `npm run type`. 크기는 `.program-caption` 의 `height` 하나.
- **끝나면** 마지막 프레임에서 멈춘 채 질문 한 줄이 흰색으로 화면 폭 62%, **정중앙**에. 등장 시점 `PROGRAM.reveal`(0.2초), 떠오르는 시간 `questionIn`(0.9초), 머무는 시간 `PROGRAM.hold`(2.6초). 영화 끝에서 줌 시작까지 5.3초. 위치 · 폭은 `.program-question`.
- **그 다음** (`lib/program.ts` 의 시간, 초): 프레임 + 질문이 흰 바탕의 매킨토시로 페이드(`fade` 1.6) → 검은 바가 올라온 길로 돌아가 사라짐(`barsOut` 0.8) → 기계만 남아 정지(`dwell` 2.0) →
  기계의 **화면 중심이 창 중심으로 오며 확대**(`zoom` 3.0, 마지막 `dark` 30% 동안 래스터 · 글자층이 올라옴) → 화면 위에 `terminal.screens` 가 초록 타자체로(`delay` 1.0 뒤, `cps` 11), 화면마다 `holds`(3.2 · 2.6 · 2.8 · 1.8초) 머문 뒤 한꺼번에 지워지고 → 마지막 노크 뒤 `terminal.next`(`/apply?via=terminal`)로 컷.
  확대 배율은 시작 순간에 잰다: 그림 속 화면 사각형(`lib/mac.ts`)이 창을 `overshoot`(1.15) 배 덮을 때까지.
- **두 렌더 스틸** — `tools/render-props.py` 가 Blender(Cycles, OptiX)로 찍는다. 같은 스튜디오 리그: 거의 어두운 월드(0.05) + 면광원 넷(키 −38°/42° · 필 48°/12° · 림 155°/38° · 톱 84°), 크기 · 거리 · 출력이 모델 크기에 비례해서(거리 제곱 법칙) 40cm 전화기와 50단위 컴퓨터를 같은 리그가 밝힌다.
  Filmic(Medium Contrast), 알파. 그림자는 키 하나만(나머지 셋은 그림자 없음). 미리보기 `--preview`, 각도 `--az --el --lens`, 조명 `--key --fill --rim --top --exposure`. 작업 파일은 `tools/.props/`(Vercel 제외).
  · **매킨토시** `public/program/mac.webp`(2400×1428, 105KB): Sketchfab 「Macintosh 128K Computer (1984)」(Daz, **CC BY-NC 4.0**). **정면**(az 0 · el 6 · 50mm). 바닥은 그림자 캐처인데 빛은 튕기지 않게(diffuse/glossy 가시성 끔 — 켜 두면 흰 바닥의 반사광이 기계를 하얗게 날린다). 러프니스 맵이 없는 플라스틱은 glTF 기본값 1(완전 무광)로 들어와 컷아웃처럼 보였다 → 0.38~0.46.
    **"실제 사물처럼"(9/29 저녁)**: 노출 −0.75, 필 0.07(그림자에 무게), 월드 0.08(키보드 · 마우스 아래 접지 그림자), 화면은 **광택 있는 검은 유리**(러프니스 0.14 · 반사 0.5 — 조명이 축 밖이라 방의 어둠을 비춘다), 후처리로 베이지를 조금 따뜻하고 덜 깨끗하게. **저작자 표시 · 비상업 조건은 사이트에 표시가 필요하다 — 아직 없음(BRIEF 참조).**
    **근접 플레이트** `mac-close.webp`(3974×3009, 70KB): 같은 카메라로 화면 주변만 3배 해상도로(`--close`, Blender 보더 렌더). 넓은 그림 위 제자리에 겹치고 타원 마스크로 가장자리를 섞는다 → 8배 줌의 끝이 넓은 그림의 픽셀이 아니라 선명한 화면이다. `lib/mac.ts` 의 `close` 가 위치(넓은 그림 안 비율)와 화면 사각형을 준다.
  · **전화기** `public/hero/phone.webp`(338×2173, 86KB): Sketchfab 「1980's Phone」(Daz, **CC BY 4.0** — 상업 사용 가능, 저작자 표시 필요). 모토로라 DynaTAC 계열 벽돌폰. 키패드 면이 모델의 −x 라 **정면은 az 90**(el 4 · 85mm), 바닥 없음. 리그는 카메라 방위와 함께 돈다. 위가 밝은 천장 월드(플라스틱 광택). 3/4 각 대안은 `tools/.props/phone-34-check.jpg`.
  · (은퇴) **한국 공중전화** — Sketchfab 「Korean Payphone」, 강철 재질 설정은 `render-props.py payphone` 에 남아 있다(작업 폴더로만 렌더).
- **화면의 물성.** 검은 오버레이는 없다. 줌의 끝은 렌더의 화면 그 자체이고, 그 위에 (1) 렌더 안의 `.program-glass`(화면 사각형에 맞춘 유리: 어둡게, 모서리로 갈수록 더, 왼쪽 위에 방의 반사 한 줄), (2) 뷰포트에 고정된 `.terminal-lines`(래스터 — 줌이 끝난 화면 높이 ÷ 342줄 = 매킨토시의 실제 주사선 피치, `--line`), `.terminal-grain`(형광체 입자), (3) 글자: 인광의 번짐(좁은 헤일로 + 넓은 헤일로), 0.22px 블러, 4.3초 주기의 미세한 밝기 떨림, 커서도 발광. 글꼴은 시스템 `Courier New → Courier → monospace` 굵게, 색 `--color-phosphor`(영화 프레임에서 샘플), 크기는 창의 짧은 변 기준.
  문장을 바꾸려면 `PROGRAM.terminal.screens`(화면별 줄 배열) · `holds`. `/apply` 의 부팅(`lib/apply/copy.ts` `FORM.boot`)도 같은 문장 — 함께 고친다.
- **되돌아가기 없음.** CLOSE · ESC · 클릭 전부 없다. 전화기를 든 뒤엔 끝까지 간다. 단 **브라우저 뒤로가기**는 어느 단계에서든 도시 첫 화면으로 돌아온다 — 전화기를 누를 때 기록을 하나 남기고(`history.pushState`), `popstate` 에서 `home()`(영상 · 음악 정지, 다음 관람은 다른 곡으로).
- reduced-motion 이면 바 · 지직임 · 페이드 · 줌 · 커서 깜빡임 없이 단계만 바뀐다.

## 로그인 · 비트 · 광고판 (9/29 밤)

- **로그인** `components/Login.tsx`: 빨간약 코드비가 검정으로 씻겨 나가고 1초 컬러바 뒤(`colorbars` → `login` 단계). 9/30부터 실제 기록 조회 · 발급(아래 「기록」). 기관 단말기 구성 — 금색 얇은 틀 · **본인 휘장** `public/program/cia-seal.webp`(COUNTER IDENTITY AGENCY / WILDCARD SYSTEM, 425×425 투명 바탕) · 제목 `cia-title.webp`(C.I.A TERMINAL, 485×37) — **C.I.A = Counter Identity Agency** · Holder: 한 칸 · Clearance: Unissued · 고지문 · 흐린 워터마크 · 스테이션 이름. 조각이 하나씩 켜진다(`.login > *` 의 `--d`). 엔터 → 기록 없음 → `[ BEGIN SELF-ISSUANCE ]` → `/apply?via=terminal`, 이름은 `sessionStorage` `wildcard.holder` 로 넘겨 PREFERRED NAME 에 채운다. 계정 · 비밀번호 없음.
- **비트** `lib/beats.ts`(librosa, 각 곡 첫 60초의 박과 강박=킥): `Program.tsx` `makePlan` 이 영화 끝 `ending.plan`(1.6초) 전에 음악 재생 시각을 읽어 질문 · 매킨토시 페이드 · 줌을 강박에 얹는다. 창 · 여유는 `PROGRAM.ending`. 곡을 바꾸면 박자표도 다시 뽑는다(`tools/.props/beats.json` 의 스크립트 흐름, BRIEF).
- **광고판** `public/hero/sign.webp`: 전화기 왼쪽 도로 위(`.hero-sign`, 사진 폭 20%, −2.5°), 모든 방문에. 가리키기만 한다 — 누르면 아무 일도 없다(전환은 전화기만, 9/30).
- **코드비 배경**: 빨간약부터 매킨토시 둘레가 검정(0.9초), 드레인도 검정으로(`CodeRain wash`).

## FORM W*–01 — `/apply`

터미널이 제안하는 카드 신청. 본인이 붙여넣은 브리프(다른 AI 정리)를 따랐다: 정부 서식 × CRT 터미널 × 아틀리에. **디자인 권한은 WILDCARD*, 정체성 권한은 본인.**

- **구조** (`components/apply/Apply.tsx`): 부팅 = 영화의 오프닝 문장(매킨토시와 같은 것; 매킨토시에서 `?via=terminal` 로 왔으면 건너뜀) → 초안이 없으면 곧장, 있으면 `DRAFT ON FILE.` + `[ RESUME DRAFT ]` / `[ BEGIN SELF-ISSUANCE ]` → 화면 0 헤더(네 블록 · "THIS IS NOT…") → 섹션 01~07 → 07 의 나머지 세 화면(DESIGN AUTHORITY · PUBLIC / NFC PREFERENCES · DECLARATION) → `[ ISSUE ME* ]` → 어두워지고 `PROCESSING EVIDENCE...` → `APPLICATION W*–26–000013 ACCEPTED.` + 카드가 슬롯으로.
  진행은 아래 상태줄의 `SECTION 03/07` 뿐. `[ CONTINUE ]` 는 그 화면만 검사, `[ ISSUE ME* ]` 는 전부 검사해 빠진 첫 화면으로 돌아간다.
- **데이터** (`lib/apply/model.ts`): `Application` — author · currentRecord · visualEvidence(5) · visualScreening(결정 · 순서 · ms) · sensoryRecord · contradictions(9쌍, BOTH 허용) · negativeSpace · lifeTraces(≤3) · voice · unasked · publicPreferences · consents · **portraitMap**(스튜디오용, 신청자에게 안 보임) · interpretations(A SELF / B MIRROR / C WILDCARD, W* STUDIO CHOICE) · decision. 상태 draft → submitted → under_review → interpretations_ready → selected → production → shipped.
- **저장** (`lib/apply/store.ts`): 백엔드 없음. `ApplicationStore` 인터페이스 뒤에 `LocalStore` — 기록은 localStorage(`wildcard.apply.draft` · `.filed`), 파일은 IndexedDB(`wildcard-apply`), 신청번호는 로컬 카운터(`W*–YY–000000`, **공개 URL 로 쓰지 말 것**). Supabase/Postgres 는 이 클래스만 바꾼다. 파일은 `/public` 에 가지 않고, 서명 없는 URL 을 갖지 않는다. 700ms 디바운스 저장 → `DRAFT SAVED`.
- **검증** (`lib/apply/validate.ts`): 화면별 필수 · 이메일 형식 · 다섯 장 · 모든 스크리닝 결정 · 모든 쌍 · 세 가지 · 모드 하나 · 승인 셋 · 가시성 · 선언 둘. 문구는 `lib/apply/copy.ts` 의 `ERRORS`.
- **스크리닝** (`components/apply/Screening.tsx`): `lib/apply/screening.ts` 의 매니페스트 24장 — 지금은 **번호판 자리표시**(`src: null`). TODO: `public/apply/screening/<id>.webp` 에 라이브러리를 넣고 `src` 를 채운다(id 는 유지). ← PASS · → KEEP · Backspace 한 장 되돌리기.
- **업로드** (`components/apply/fields.tsx` `Upload`): 드롭 · 선택 · 미리보기 · REPLACE · REMOVE · 읽기 진행(1px 선). 이미지 20MB · 오디오 25MB, MIME/확장자 검사. 음성은 MediaRecorder 로 60초 녹음(`Voice`) 또는 파일.
- **카드** (`components/apply/Card.tsx`): CSS 3D 빈 카드 `WILDCARD* / UNISSUED`, 폼 옆에 서서 천천히 돈다. 발급 시 슬롯(빛의 선)으로 내려가 사라지고 번호가 남는다. 3D 라이브러리 없음.
- **접근성**: 모든 컨트롤에 label, 네이티브 라디오/체크박스를 시각적으로만 숨김(`( )` `[x]` 표시), 오류는 글로(색만 아님), reduced-motion 이면 타이핑 외 움직임 없음. 화면이 바뀌면 제목에 포커스.
- **반응형**: 860px 아래 한 열, 카드는 위에 작게, 긴장 컨트롤은 세로.
- **스튜디오 뷰** `/apply/review` (`components/apply/Review.tsx`): 이 기기의 초안 · 접수분, PORTRAIT MAP 아홉 칸(빈), JSON 보기 · 다운로드. 대시보드는 나중.
- **모양** (`app/globals.css` 「the application」 절): 인광 위의 검정, 타자체, 얇은 규칙선(`--tty-rule`), 작은 라벨, 래스터 + 입자, 오류만 `--color-warn`.

## 갤러리 되돌리기

1. `components/Home.tsx` 에서 `<Manifesto />` 다음에 `<SelectedWorks />` (import 포함).
2. `lib/hero.ts` 의 WORK 에 `href: '#work'`.
질문 벽의 멈춤은 CSS(`.manifesto:last-child`)가 알아서 돌아온다. 데이터 · 이미지 · 스타일은 그대로 있다.

## 기록 — C.I.A 터미널 · Supabase (9/30)

빨간약 → 코드비(검정으로 씻김) → **1초 컬러바**(`public/program/colorbars.mp4`, 본인 클립 앞 1.4초, 441Hz 톤 · 게인 0.35) → **C.I.A 터미널**. 여기서 실제로 기록을 찾고 발급한다(Supabase Auth, 비밀번호 없는 이메일 — 매직 링크 또는 그 코드). 화면에 로그인 · 회원가입 · 이메일 · 비밀번호라는 말은 없다.

- **흐름** (`components/Login.tsx`): 처음 화면은 그대로 — `Holder:` · `Clearance: Unissued`. 그 줄을 누르거나 아무 키나 치면 옛 단말기의 **하얀 입력 바**와 캐럿, 아래에 작게 *Enter the address associated with your record.* 주소 ↵ → `SEARCHING RECORDS...` → `AUTHORIZATION REQUIRED.` / `CHECK YOUR TERMINAL.` — 기록이 있든 없든 **같은 말**(주소가 있는지 떠볼 수 없게), 메일도 같은 한 통. 메일의 `[ AUTHORIZE ACCESS ]`(→ `/auth/confirm`, 검은 화면 `VERIFYING RECORD...`) 또는 메일의 코드를 터미널의 `CODE:` 에.
  - 기록 있음: `RECORD FOUND.` `IDENTITY CONFIRMED.` → Holder · Clearance · Record 칸이 채워짐 → `WELCOME BACK.` / `YOU MAY HAVE CHANGED.` → 퇴장 → `/record`.
  - 기록 없음: `IDENTITY CONFIRMED.` `NO RECORD FOUND.` `ISSUE ONE?` `[Y] YES` `[N] NO` → Y: `SELF-ISSUANCE REQUESTED.` `NAME FOR THIS RECORD:` → `RECORD CREATED.`, Holder: 이름 · Clearance: PROVISIONAL · Record: W*–PENDING → 퇴장 → `/record`. N: `NO RECORD ISSUED.`, 세션을 닫고 처음으로.
  - 링크 만료 · 잘못된 링크나 코드: `AUTHORIZATION EXPIRED.` `REQUEST ANOTHER?` `[Y]/[N]`. 발송 한도: `TRANSMISSION LIMIT REACHED.` 그 밖: `ACCESS INTERRUPTED.` `TRY AGAIN.` 기술 오류는 콘솔(`[records]`)에만.
  - 링크를 다른 탭에서 열면, 원래 탭도 돌아왔을 때 세션을 알아채고 이어간다. 이미 세션이 있는 브라우저로 터미널에 오면 곧장 돌아온 기록으로.
  - 키보드: 입력 칸 없이도 치면 Holder 로, Y/N 으로 답. 줄은 타이핑되지만 스크린 리더에는 통째로(`aria-live`). 폰은 입력 중 휘장 · 제목이 줄고 폼이 키보드 위로.
  - 줄은 Clearance 아래에 쌓이고, 고지문은 폼 높이(`--form-h`)만큼 비켜 내려간다 — 겹치지 않는다.
- **퇴장** (3.5초, `.login[data-exit]`): 제목이 1px 흔들리고 깜빡 → 금색 선 윗변 · 오른변이 사라짐 → 휘장이 띠로 끊기며 꺼짐 → 필드 · 고지문 → TERMINAL → C.I.A 가 오므라들며 워드마크의 `*` 하나(`lib/records/star.ts`) → 가운데로 → 검정 → 흰 플래시 → `/record`. reduced-motion 은 컷.
- **/record** (`components/records/Record.tsx`): 따뜻한 흰색, 왼쪽 위 `W*–000137`(없으면 `W*–PENDING`), 오른쪽 위 `VERSION 01`, 큰 한 문장. 버전이 있으면 THIS IS HOW / YOU LEFT YOURSELF. + 최신 진술 + VIEW THIS VERSION · REWRITE, 없으면 NOTHING HAS BEEN / WRITTEN YET. + BEGIN SELF-ISSUANCE(→ `/apply`, 이름을 PREFERRED NAME 으로). 세션 닫기는 아래 작은 SESSION 뒤. 세션이 없거나 이름 없는 기록은 `/terminal` 로.
- **인증 계층** `lib/records/access.ts`: `request` · `confirmCode` · `confirmLink` · `record` · `name` · `latest` · `close` · `watch`. 패스키는 여기 `authorize` 방법 하나로 더한다(Supabase CLI 에 `[auth.passkey]` 가 있다). 세션은 `@supabase/ssr` 의 쿠키 — 토큰을 직접 저장하지 않는다.
- **데이터** `supabase/migrations/20260930000000_records.sql`: `public.profiles`(auth.users 와 1:1 — email, display_name, record_number, public_id, clearance `unissued → provisional → self_authorized → issued`, status `pending → active`/`suspended`, created_at, updated_at), `public.versions`(holder_id, number, statement). RLS — 본인 기록만 읽고, 본인 기록의 이름만 바꾼다(첫 발급은 `claim_record`). clearance · 번호는 서비스 롤만(`set_clearance`, `issue_record_number`). anon 은 아무것도 못 읽는다. `record_number` 는 순번이라 공개 주소로 쓰지 않는다 — 공개용은 무작위 `public_id`. 로컬에서 권한을 하나씩 두드려 확인했다(BRIEF).
- **환경 변수** (`.env.example`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`(옛 프로젝트는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`). 서비스 롤 키는 쓰지 않는다. 값이 없는 빌드에서 터미널은 `RECORDS UNREACHABLE.` + `[ BEGIN SELF-ISSUANCE ]`(이 기기에만 저장되는 신청폼).
- 신청폼(FORM W*–01)의 내용은 아직 이 기기에만 저장된다 — 서버 저장(Storage + 테이블 + RLS)은 다음 단계.

### 로컬에서 시험 (Docker 필요)

```bash
npm run db:start
```

```bash
npx supabase status -o env
```

`API_URL` 과 `PUBLISHABLE_KEY` 를 `.env.development.local` 에 `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 로 넣고 `npm run dev -- --port 3232`. 메일은 실제로 나가지 않고 http://127.0.0.1:54324 (Mailpit)에 쌓인다. Studio 는 `npx supabase start` (제외 없이) 로.

- **새 기록**: `/terminal` → 아무 주소(예: `you@wildcard.test`) → Mailpit 의 메일 → 링크, 또는 코드를 `CODE:` 에 → `ISSUE ONE?` Y → 이름 → `/record`(NOTHING HAS BEEN WRITTEN YET.).
- **돌아온 기록**: `/record` 의 SESSION → CLOSE SESSION → `/terminal` → 같은 주소 → 링크 → WELCOME BACK. 버전이 있는 화면은 SQL 로 하나 넣어 본다: `insert into public.versions (holder_id, number, statement) select id, 1, '…' from public.profiles where email = '…';` (스튜디오 쪽: `select public.set_clearance(id, 'self_authorized')`, `select public.issue_record_number(id)`).
- **만료**: `/auth/confirm?token_hash=x&type=email` → AUTHORIZATION EXPIRED.
- 비우기 `npm run db:reset`, 끄기 `npm run db:stop`.

### 운영 설정 (한 번, Supabase 대시보드)

1. 프로젝트: supabase.com 에서 새로 만들거나 Vercel Marketplace 의 Supabase 연동(환경 변수가 Vercel 에 자동으로 들어간다). 이 PC 에서 직접 돌리려면 Supabase self-hosting(Docker compose, 비밀키 새로 생성) + 도메인/터널 + SMTP — CLI 의 로컬 스택은 개발용 기본 키라 밖에 내놓지 않는다.
2. 스키마: `npx supabase link --project-ref <ref>` → `npx supabase db push` (또는 SQL Editor 에 마이그레이션 파일).
3. Authentication → URL Configuration: **Site URL** = 사이트 주소(메일 링크가 `{{ .SiteURL }}/auth/confirm` 으로 온다), **Redirect URLs** 에 `https://<사이트>/auth/confirm`.
4. Authentication → Emails → Templates: **Magic Link** 와 **Confirm signup** 둘 다 제목 `W* RECORD ACCESS / AUTHORIZATION REQUEST`, 본문 `supabase/templates/authorize.html` — 둘을 똑같이(메일로 주소 존재 여부가 드러나지 않게).
5. Authentication → Emails → SMTP: 자체 SMTP(Resend · Postmark 등). 기본 발송은 시험용이라 프로젝트 팀원 주소에만, 시간당 몇 통.
6. Authentication → Sign In / Providers → Email: 켬, Confirm email 켬, 이메일 OTP 만료 3600초 이하, Rate Limits 확인.
7. Vercel → Settings → Environment Variables 에 두 값 → 재배포.

### 운영 프로젝트 (9/30 연결됨)

- supabase.com 프로젝트 `wildcard-site` — ref `zqoonxlltveijuwckosn`, 서울(ap-northeast-2), 무료 플랜, 운영 계정 thecardthatcheats@gmail.com 의 조직. DB 비밀번호는 `.env.supabase.local`(깃 · 배포 제외).
- 스키마 · RLS 적용(`npx supabase db push`), 인증 설정 적용(`[remotes.production]` — Site URL, Redirect URLs, OTP 6자리). Vercel 프로덕션에 `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **메일은 아직 Supabase 기본 발송**: 무료 플랜은 자체 SMTP 없이는 메일 템플릿을 바꿀 수 없고, 프로젝트 팀원 주소(운영 계정)에만, 시간당 2통. 그래서 지금 메일은 Supabase 기본 문구(영문 "sign-in link")이고, 링크는 코드 교환 방식(`/auth/confirm?code=…`, 같은 브라우저에서 열어야 함) — 터미널은 두 방식 다 받는다. 코드 입력(`CODE:`)은 우리 템플릿이 올라가야 쓸모가 있다.
- **SMTP 를 붙이면**(대시보드 → Authentication → Emails → SMTP Settings, 예: Gmail — 운영 계정의 앱 비밀번호, smtp.gmail.com:465, 보내는 이름 WILDCARD*) 이어서:
  1. `supabase/config.toml` 의 `[remotes.production.auth.rate_limit] email_sent` 를 30 정도로.
  2. `npx supabase config push --project-ref zqoonxlltveijuwckosn` — 템플릿(`authorize.html`, 제목 W* RECORD ACCESS / AUTHORIZATION REQUEST)과 한도가 올라간다.
