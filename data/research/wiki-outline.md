# Aniimo fan wiki — proposed IA (Korean-first)

**Project goals:** Korean-first wiki + **interactive maps** + **육성 시뮬레이션 (training/breeding sim)**.  
**Locale:** Default KO; EN fields parallel.  
**Date:** 2026-09-16

---

## Top navigation

1. **홈 (Home)**
2. **가이드 (Guide)**
3. **월드 / 지역 (World / Regions)**
4. **애니모 도감 (Creatures / Aniilog)**
5. **시스템 (Systems)**
6. **육성 / 시뮬레이션 (Training / Simulation)** ← new for sim project
7. **지도 (Maps)**
8. **아이템 (Items)**
9. **퀘스트 (Quests)**
10. **멀티플레이 (Multiplayer)**
11. **버전 기록 (Version history)**

Secondary: 검색 · 언어(KO/EN) · 기여 가이드 · 출처/신뢰도 범례

---

## Page trees

### 홈
- 한 줄 소개 (에이델 / Idyll 표기 안내)
- 출시 플랫폼 & 날짜
- 신규 유저 3분 경로 → 가이드
- 지도 · 도감 · **육성 시뮬** 바로가기
- 신뢰도 배지 설명: confirmed / marketing / community / unknown

### 가이드
- 초보자 진행 순서 (메인 → 포획 → 트와인 → 거점 → 공명)
- 포획 입문 (애니팟 계수 링크)
- 트와인 입문 (탐사 / 퍼즐 / 전투)
- 파티 역할 (격파·딜·힐…)
- 피해야 할 실수 (공명 재료 낭비 등)
- FAQ (크로스세이브/크로스플레이 **unknown 명시**)

### 월드 / 지역
- 세계관: 에이델 = Idyll, 아스트라, 폴라리스 아카데미
- 지역 목록 테이블 (`regions.json`)
- 지역 상세: 바이오메, 날씨, 레벨밴드, 랜드마크, 출현 애니모 FK
- 표기 모호성 페이지 (Breezy Plains vs Fextralife 15 등)

### 애니모 도감
- 번호순 / 속성 / 역할 / 지역 필터
- 종 상세: KO/EN명, 형태 탭, 진화 트리, 서식지, 종족치(공식만)
- 형태 백과: 지역·날씨·천휘·스파클·알파
- 미확인 KO명 대기열 (수수타나 등)

### 시스템
- 트와인
- 포획 & 공식 확률
- 전투 & 원소 (수치 미상은 unknown)
- 진화
- 캠핑카 / 홈랜드
- 연구 수첩
- 날씨 / 천휘 / 생태 육성
- 멀티 개요 (상세는 Multiplayer)

### 육성 / 시뮬레이션  ← IA addition
- **육성 개요** — 잠재력·특성·공명·진화·알·교배 한눈에
- **시뮬레이터 (앱/툴)** — `training-sim-schema.json` 기반 UI
  - 개체 편집기 (Potential / 스파클 스타일 / 유대)
  - 진화 그래프
  - 공명 플래너 (비용 null-safe)
  - 알 부화 타이머 목업
  - 교배 랩 (100% 유전 토글)
  - 지역 육성 / 천휘 에너지 트래커
- **데이터 요구사항** — 어떤 필드가 confirmed vs unknown
- **시뮬 ≠ 공략 사기** — 미공개 수치 추정 금지 고지

### 지도
- 인터랙티브 맵 허브 (우리 맵; 초기엔 커뮤니티 맵 링크)
- 마커 범례 (`map-schema.json`)
- 지역별 레이어
- 외부 맵: aniimotools / Fextralife 상태
- **좌표 없는 POI** 목록 (region-level only)

### 아이템
- 애니팟 전 종류 + 공식 계수
- 스파클 도구 (큐브·인장·광채)
- 아스트라나이트 / 지맥 정수 / 진화 재료
- 알 종류
- 액세서리 · 장비 (드랍 표)

### 퀘스트
- 메인 스토리 개요 (스포일러 토글)
- 월드 활동 / 돌발
- 전설 애니모 이벤트 (marketing)

### 멀티플레이
- 협동 PvE
- PvP / 경쟁
- Egg Heist (Lost Isles)
- 캠핑카 소셜
- 크로스플레이 매트릭스 (검증 전 unknown)

### 버전 기록
- 런치 1.0 (2026-09-16 PC/콘솔)
- 모바일 2026-09-23
- 패치 노트 아카이브
- 이 위키 데이터셋 리비전

---

## Cross-cutting components

- **Confidence chip** on every fact
- **Source drawer** (URL + accessed)
- **KO/EN name pair** component (Idyll/에이델, Aniipod/애니팟…)
- **FK chips:** region_id · creature_slug · item_id
- Map embed + Sim embed share same creature/region IDs

---

## Build order (suggested)

1. Home + Systems + naming glossary  
2. Regions table + Creatures stub (official KO first)  
3. Map schema empty layers + external map links  
4. Training overview + sim schema-driven UI shell  
5. Items (official multipliers)  
6. Quests / Multiplayer / Version history deep pages  
