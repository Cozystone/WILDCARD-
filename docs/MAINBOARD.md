# MAINBOARD — 기록 · 카드 · 공개면 (9/30)

> **CARD remembers. RECORD changes. HOLDER decides.**
> 카드는 발급된 순간을 기억하고, 기록은 계속 바뀌고, 무엇이 보이는지는 소지자가 정한다.

본인이 붙여 넣은 제품 구조 명세(P1–P5)의 **첫 결과물**: 기존 코드 점검 → 구조 제안 → 스키마 → 라우트 · 컴포넌트 · 상태 → 기반 구현.
화면 문법은 본인 지시("홈화면처럼 되게 트렌디하게")대로 **홈의 틀**을 그대로 가져왔다 — 잉크 테두리 안의 판, 그 아래 한 줄 캡션.
홈의 판은 사진, 여기의 판은 종이. 화면에 "Dashboard" 라는 말은 없다(명세의 용어 규칙 — 이름은 Mainboard).

---

## 1. 점검 — 있던 것

| 있던 것 | 이번에 |
|---|---|
| C.I.A 터미널 인증(`components/Login.tsx`, `lib/records/access.ts`) — Supabase 비밀번호 없는 이메일 | 그대로. 조회 대상 테이블만 `records` 로 |
| `profiles` · `versions` 테이블(`20260930000000_records.sql`) | `records` · `record_versions` 로 옮기고 없앰(데이터 이전, 같은 id) |
| `/record` 한 화면(`components/records/Record.tsx`, A · B 두 안) | **삭제** → Mainboard. B(서류 · 도장)는 **버전 문서**로 살림(§5) |
| 도시의 `*`(`RecordMark.tsx`) | 그대로 — `/record` 로 |
| `/apply` FORM W*–01 | 연결 없음 그대로(본인 지시 "예전버전은 연결하지마"). 새 신청은 `/create` 자리 |
| 결제 · 주문 · 배송 · NFC · 공개면 | 없었음 → 공개면 · NFC 주소 · 가격 구조만 이번에 |

## 2. 구조

```
                 ┌──────────── 브라우저(소지자) ────────────┐
 /terminal ──▶ Supabase Auth(쿠키 세션) ──▶ /record/* (Frame, 클라이언트)
                                         │  읽기: RLS 로 본인 행만
                                         │  쓰기: SECURITY DEFINER 함수만
                                         ▼
                               Postgres (records · record_versions · record_sections
                                         · record_links · cards · nfc_tokens · audit_events)
                                         ▲
 카드 탭 / QR ──▶ /w/{token} (서버 컴포넌트, 매 요청) ── anon 키로 public_record() 하나
                  └▶ /w/{token}/vcard (SAVE CONTACT)
 스튜디오(나중) ──▶ service_role 전용 함수(issue_card · set_card_status · set_clearance · issue_record_number)
```

- **소지자 화면**(`/record/*`)은 클라이언트에서 세션 쿠키로 Supabase 를 직접 부른다. 서버 비밀 키 없음. 테이블은 **본인 행 읽기**만 열려 있고, 바꾸는 건 전부 함수(`edit_record` · `rewrite_record` · `mark_card_lost` · `renew_share_key` · `claim_record`) — 직접 `update` 는 거부된다.
- **공개면**(`/w/{token}`)은 서버에서 매번 렌더(수정이 다음 탭에 바로 보임). 테이블을 읽지 않고 `public_record(tag, key, ver)` 함수 하나가 **보여도 되는 것만** JSON 으로 준다. 비공개 항목은 서버 밖으로 나오지 않는다.
- **주소는 불투명**: 카드 토큰(15바이트 base64url, 20자) 또는 기록의 `public_id`. 순번(`W*–000001`) · 내부 id · 이메일은 URL 에 안 들어간다.
- **스튜디오 쪽**은 service_role 전용 함수로만 — 화면은 나중(§8). 지금은 SQL 에디터에서.

## 3. 스키마 — `supabase/migrations/20261001000000_mainboard.sql`

| 테이블 | 주요 열 | 메모 |
|---|---|---|
| `records` | holder_id(→auth.users, 1:1) · email · display_name · record_number · **public_id** · **share_key** · clearance · status · origin · current_version_id · history_visibility | 이메일이 처음 보이는 순간 열림(트리거 `open_record`), 주소가 바뀌면 따라감(`follow_address`) |
| `record_versions` | record_id · number · statement(+visibility) · intro(+visibility) · uncertain · created_at · **frozen_at** | 현재 버전은 제자리 수정(EDIT), 나머지는 얼린 기록(REWRITE 때 얼림) |
| `record_sections` | version_id · kind · label · body · position · visibility | 버전마다 따로 — 옛 버전의 항목도 그대로 남는다 |
| `record_links` | record_id · kind · label · value · position · visibility(기본 private) · on_exchange | 버전이 아니라 기록에 붙음(연락처는 정정의 대상). `on_exchange` 는 EXCHANGE* 용 자리 |
| `cards` | record_id · issue_number · version_at_issue · design_mode · provenance · status · production · nfc_identifier · design(jsonb) · issued_at | 카드는 **발급 시점의 버전**을 기억한다 |
| `nfc_tokens` | token(pk) · card_id · active · revoked_at | 카드당 활성 토큰 하나(부분 유니크). 분실 → 비활성 |
| `audit_events` | record_id · actor · action · detail | 버전 · 발급 · 분실 같은 사건의 기록 |

**열거형**: clearance `unissued → provisional → self_authorized → issued` · record_status `pending / active / suspended` · origin `self_application / studio_application / found` · visibility `public / link_only / private` · section_kind `currently · i_care_about · current_obsession · dont_reduce_me_to · five_pieces · object · sound · unasked · custom` · link_kind `email · phone · website · instagram · work · location · custom` · design_mode `self / studio` · provenance `self_issued / studio_portrait / found` · card_status `pending / production / active / lost / revoked / retired` · production `draft → designing → awaiting_selection → selected → prepress → production → quality_check → shipped → active`.

**함수**

| 함수 | 누가 | 하는 일 |
|---|---|---|
| `claim_record(name)` | 소지자 | 이름 붙이기(첫 발급) → provisional · active |
| `edit_record(statement, statement_visibility, intro, intro_visibility, sections, links, history_visibility)` | 소지자 | **정정** — 현재 버전 제자리 + 연락처 + 이력 공개 범위. 버전 번호 그대로 |
| `rewrite_record(statement, statement_visibility, intro, intro_visibility, sections, uncertain)` | 소지자 | **새 버전** N+1, 이전 버전은 얼림, 첫 버전이면 self_authorized. 새 번호를 돌려줌 |
| `mark_card_lost(card)` | 소지자 | 카드 lost + 토큰 비활성 → 그 카드의 공개면은 `THIS ISSUE IS NO LONGER ACTIVE.` |
| `renew_share_key()` | 소지자 | 링크 전용 공유 키 새로(옛 링크는 공개분만 보임) |
| `public_record(tag, key, ver)` | 누구나(anon) | 공개면 JSON — `state` active / inactive / missing, 보이는 항목만, 키가 맞으면 link_only 까지(`inner`), `ver` 는 이력 공개 범위 안에서만 |
| `issue_record_number(target)` · `set_clearance(target, to_clearance)` · `issue_card(target, mode, provenance, activate)` · `set_card_status(card, to_status, stage)` | service_role | 번호 · 등급 · 카드 발급(토큰 생성) · 제작 단계 |

**RLS**: 모든 테이블 RLS 켬. 소지자는 자기 기록에 딸린 행만 `select`. `insert/update/delete` 정책 없음(= 함수로만). anon 은 테이블 전부 거부, `public_record` 만.

## 4. 라우트

| 경로 | 화면 | 렌더 |
|---|---|---|
| `/record` | **RECORD** — THIS IS HOW / YOU LEFT YOURSELF. + 지금의 진술 + VIEW THIS VERSION · REWRITE, 카드(사물), PUBLIC VIEW ↗ · EDIT. 버전이 없으면 NOTHING HAS BEEN / WRITTEN YET. + WRITE VERSION 01 · BEGIN SELF-ISSUANCE | 정적 셸 + 클라이언트 |
| `/record/edit` | **EDIT** — 정정: 진술 · 소개 · 항목(추가 · 순서 · 삭제) · 연락처 · 각각의 PUBLIC / LINK-ONLY / PRIVATE · 이력 공개 범위 · 공유 링크(복사 · 새로) · SAVE | 〃 |
| `/record/rewrite` | **REWRITE** — HAS SOMETHING CHANGED? `YES` / `NOT SURE` → (NOT SURE 면) GOOD. UNCERTAINTY COUNTS. → 지금 버전을 채운 채로 쓰기 → ISSUE VERSION 0N → VERSION 0N. WRITTEN. → `/record`. 첫 버전은 질문 없이 쓰기부터 | 〃 |
| `/record/versions` | **VERSIONS** — 모든 버전(CURRENT · WRITTEN UNSURE 표시) | 〃 |
| `/record/versions/[n]` | 버전 문서 — **B 서류 · 도장**(COUNTER IDENTITY AGENCY 를 긋고 WILDCARD* — SELF-AUTHORED RECORD, 도장 CURRENT / FILED, 01 HOLDER … 09 CARDS ISSUED AT THIS VERSION, HOLDER'S OWN HAND) | 동적 |
| `/record/card` | **CARD** — 발급분마다 카드 사물 · ISSUE 0N · 연도 · 단계 · 출처, VIEW VERSION AT ISSUE, MANAGE NFC(주소 + QR), MARK LOST(확인), REQUEST A NEW PORTRAIT. 카드 없으면 기록 주소 + QR | 정적 셸 + 클라이언트 |
| `/w/[token]` | 공개면 — **MEET**(이름 · 소개 · SAVE CONTACT · 연락처) / **KNOW**(진술 · 항목) · VIEW ME WHEN THIS CARD WAS ISSUED / VIEW ME NOW · 출처 · WHO DECIDES WHAT YOU ARE? `?k=` 공유 키, `?v=` 버전. noindex | 동적(매 요청) |
| `/w/[token]/vcard` | SAVE CONTACT — vCard 3.0, 공개(키가 있으면 link-only 포함) 항목만 | 동적 |
| `/create` | 두 길 — CREATE MYSELF(DESIGNED BY HOLDER) / LET WILDCARD* SEE ME(INTERPRETED BY WILDCARD*). 가격 없음 | 정적 |
| `/create/self` · `/create/studio` | 자리 — 새 신청폼(본인 개편 예정)이 들어올 곳 | 정적 |
| `/issue` | → `/create` | 리다이렉트 |
| `/terminal` · `/auth/confirm` | 기존 C.I.A 터미널 | 정적 |

캡션 줄: **RECORD / CARD / VERSIONS / REWRITE** + `···`(PUBLIC VIEW ↗ · PRIVACY · CONTACT · BILLING *LATER* · SHIPPING *LATER* · CLOSE SESSION). 판의 위 두 모서리는 기록 번호(`W*–PENDING`) · 버전(`UNWRITTEN`), 왼쪽 아래 `*` 는 도시로.

## 5. 컴포넌트

```
app/record/layout.tsx (noindex)
└─ components/mainboard/Frame.tsx      잉크 + 종이 판 + 캡션 · 모서리 · ··· 메뉴 · useMine() 컨텍스트
   ├─ Home.tsx                         /record
   │  └─ CardObject.tsx                CSS 3D ID-1 카드(워드마크 · 칩 · 이름 · 번호 · ISSUE/등급)
   ├─ Edit.tsx                         /record/edit
   │  └─ Editor.tsx                    진술 · 소개 · 항목 편집 + VisibilityToggle(라디오 그룹)
   ├─ Rewrite.tsx                      /record/rewrite (ask → good → write → done)
   │  └─ Editor.tsx
   ├─ Versions.tsx                     /record/versions
   ├─ VersionDoc.tsx                   /record/versions/[n] — B 서류
   └─ Cards.tsx                        /record/card
      ├─ CardObject.tsx
      └─ Qr.tsx                        qrcode → SVG
components/public/PublicRecord.tsx     /w/[token] (서버 컴포넌트)
components/records/RecordMark.tsx      도시의 *
components/mainboard/Star.tsx          워드마크의 * (lib/records/star.ts)
lib/mainboard/  types · copy(화면 문구 전부) · format(날짜 · 링크) · data(Supabase 호출 전부)
lib/public/record.ts                   서버에서 public_record 호출
lib/vcard.ts · lib/products.ts
```

## 6. 상태 모델

- **기록**: clearance `unissued`(주소만) → `provisional`(이름, `claim_record`) → `self_authorized`(첫 버전, `rewrite_record`) → `issued`(스튜디오, `set_clearance`). status `pending → active`, 정지는 `suspended`(Mainboard 에 못 들어옴 → 터미널).
- **버전**: 현재 버전 하나(`current_version_id`) = EDIT 로 고침. REWRITE = 새 번호, 이전 것은 `frozen_at`. `uncertain` 은 NOT SURE 로 쓴 버전(목록에 WRITTEN UNSURE).
- **카드**: `pending → production → active`, 끝은 `lost / revoked / retired`. 제작 단계는 `production` 열(draft … shipped → active). 활성 카드만 토큰이 살아 있다.
- **가시성**: 진술 · 소개 · 항목 · 연락처 · 이력 각각 `public / link_only / private`. link_only 는 `?k={share_key}` 가 붙은 주소에서만. 키를 새로 하면 옛 링크는 공개분만.
- **Frame**: 불러오는 중(판 비어 있음, `aria-busy`) → 기록 있음 → 세션 · 이름 없음이면 `/terminal` 로.

## 7. 다시 쓴 것 (재사용)

- 인증 전부(터미널 · 메일 템플릿 · `access.ts` · 쿠키 세션) — 테이블 이름만.
- 기존 기록 데이터(이전 마이그레이션의 `profiles` · `versions`) — 같은 id 로 옮김.
- 홈의 틀 문법(잉크 · 판 · 캡션 · 모서리 · 작은 대문자 모노 라벨), 워드마크의 `*`.
- B 서류 · 도장(9/30 본인 선택) — 버전 문서로.
- `/apply` 의 데이터 모델 중 A SELF · B MIRROR · C WILDCARD 해석 구조 — `lib/products.ts` 의 W* PORTRAIT 설명으로만(폼 자체는 안 씀).

## 8. 아직 안 만든 것

- **EXCHANGE\*** (두 카드가 만나 연락처 교환 — `on_exchange` 자리만)
- **스튜디오 / 관리자 화면** (신청 검토 · 해석 A/B/C 업로드 · 선택 · 제작 단계 · 발급) — 지금은 SQL
- **셀프 디자인 데스크** (`/create/self`: 앞 · 뒤 아트워크, 크롭, 글자, 실제 인쇄 미리보기; 불변 층 — `*` · 일련번호 · 마이크로 마크는 항상 제자리)
- **스튜디오 신청** (`/create/studio`: 새 신청폼 + 파일은 Supabase Storage 비공개 버킷)
- **주문 · 결제 · 배송** (가격은 `lib/products.ts` 에 구조만, 전부 `null`)
- **Web NFC 쓰기/읽기** (점진적 향상), **암호 NFC**(NTAG 424 SUN/SDM 같은 복제 방지), PWA, 분석, 공개면 OG 이미지, 카드 디자인(jsonb) 렌더

## 9. 환경 변수

새로 생긴 것 없음.

| 이름 | 어디 | 메모 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel · `.env.development.local` | 기존 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 〃 | 기존. 공개면 서버 렌더도 이 키(anon)로 — 서비스 롤 키는 사이트 어디에도 없다 |
| `SUPABASE_DB_PASSWORD` | `.env.supabase.local`(깃 · 배포 제외) | CLI `db push` 용. 사이트는 안 씀 |

## 10. 마이그레이션

1. `20260930000000_records.sql` — 기존(운영 적용됨).
2. `20261001000000_mainboard.sql` — **새로**. 순서: 새 열거형 · 테이블 → `profiles` → `records`(같은 id, `public_id` 유지) · `versions` → `record_versions`(최신 외엔 얼림) → 옛 트리거 · 함수 · 테이블 삭제 → 새 트리거 · 함수 · RLS · 권한.
   - 로컬: 적용 · 검증 완료.
   - **운영: 아직** — `npx supabase db push`(비밀번호는 `SUPABASE_DB_PASSWORD`). 운영의 기존 두 기록(이름 없는 운영 계정 주소, provisional 인 본인 주소)이 그대로 옮겨진다. **코드 배포와 한 묶음** — 새 코드는 `records` 를 읽으므로, 마이그레이션 → 바로 `vercel deploy --prod` 순서.

## 11. 로컬 시험

```bash
npm run db:start
npm run dev -- --port 3232
```

(`.env.development.local` 에 로컬 URL · 키 — README 「기록」.) 메일은 http://127.0.0.1:54324 (Mailpit).

1. **새 기록**: `/terminal` → 주소 → 메일 링크 → ISSUE ONE? Y → 이름 → `/record`: NOTHING HAS BEEN WRITTEN YET., 모서리 `W*–PENDING` · `UNWRITTEN`.
2. **첫 버전**: WRITE VERSION 01 → 쓰기 → ISSUE VERSION 01 → VERSION 01. WRITTEN. → `/record` THIS IS HOW YOU LEFT YOURSELF.
3. **REWRITE**: REWRITE → NOT SURE → GOOD. UNCERTAINTY COUNTS. → 고쳐 쓰기 → ISSUE VERSION 02 → VERSIONS 에 두 개, 01 은 FILED 도장.
4. **EDIT**: 소개 한 줄 고침 → UNSAVED → SAVE → SAVED. 버전 번호 그대로, 공개면에 바로.
5. **시험 카드 발급**(스튜디오 대신 SQL — Studio 또는 `docker exec -it supabase_db_wildcard-site psql -U postgres`):
   ```sql
   select public.issue_card(r.id, 'self', 'self_issued', true)
   from public.records r where r.email = 'you@wildcard.test';
   -- → {"card": …, "issue": 1, "token": "…"}
   ```
   번호 · 등급: `select public.issue_record_number(id), public.set_clearance(id, 'issued') from public.records where email = '…';`
   제작 단계: `select public.set_card_status('<card id>', 'production', 'prepress');`
6. **공개면**: `/w/{token}` — MEET · KNOW, 카드가 발급된 뒤 버전이 바뀌었으면 VIEW ME WHEN THIS CARD WAS ISSUED. `/w/{public_id}` — 카드 없이. `?k={share_key}`(EDIT 의 공유 링크) — LINK-ONLY 항목까지. `?v=1` — 이력 공개 범위 안에서. PRIVATE 는 어디서도 안 보인다.
7. **SAVE CONTACT**: `/w/{token}/vcard` — PRIVATE 연락처 빠짐.
8. **분실**: CARD → MARK LOST → 확인 → 카드가 흐려지고, `/w/{옛 토큰}` → THIS ISSUE IS NO LONGER ACTIVE.
9. **폰으로 공개면**: `npm run dev -- --port 3232 --hostname 0.0.0.0` → 폰에서 `http://<PC의 LAN IP>:3232/w/{token}`. 공개면은 서버가 Supabase 를 부르므로 폰은 Next 서버에만 닿으면 된다.

확인한 것(9/30, 로컬): 위 1–8 전부 · 모바일 375px 에서 11개 화면 가로 넘침 0 · `npm run lint` 에러 0(경고 10, 옛 애니메이션 컴포넌트) · `tsc` · `npm run build`.

## 12. NFC

카드에 쓰는 것은 **NDEF URI 레코드 하나**: `https://wildcard-site-one.vercel.app/w/{token}`. 앱 없이 폰의 시스템 NFC 가 연다 — 이게 1차. Web NFC 는 쓰지 않는다(나중에 Android 에서만 점진적 향상).

| 기기 | 어떻게 | 시험 |
|---|---|---|
| **Android** (Chrome) | 화면이 켜지고 잠금이 풀린 상태에서 카드를 대면 시스템이 URL 을 읽어 기본 브라우저로 연다 | 빈 NTAG213/215/216 에 NFC Tools 같은 앱으로 URL 레코드 쓰기 → 대기. Web NFC(`'NDEFReader' in window`)는 Android Chrome 에만 있고 HTTPS 필요 — 나중에 쓰기 도구로 |
| **iPhone** (Safari) | 백그라운드 태그 읽기(iPhone XS 이후): 화면이 켜져 있으면 알림 배너 → 누르면 Safari. 카메라 · Apple Pay 사용 중, 비행기 모드, 재부팅 후 한 번도 안 풀었을 땐 안 읽음 | 같은 태그로. Safari 엔 Web NFC 가 없다 → 그래서 HTTPS URL 이 1차. 태그 쓰기는 iPhone 앱(NFC Tools)으로도 가능 |
| **데스크톱** | NFC 없음 | CARD → MANAGE NFC 의 **QR** 또는 주소 복사. 같은 URL |

- 토큰은 추측 불가(15바이트 무작위). 카드를 새로 발급하면 새 토큰, 분실 표시하면 옛 토큰은 inactive — 태그를 다시 쓸 필요 없이 서버에서 끊긴다.
- 로컬 주소(localhost)를 태그에 쓰면 폰에서 안 열린다 — 시험 태그엔 LAN IP 주소나 운영 주소.
- 태그 UID(`nfc_identifier`)는 기록만 하고 인증에 쓰지 않는다(복제 가능). 복제 방지는 암호 NFC(SUN) 단계에서.
