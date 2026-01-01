# 🎨 Institution Web App - 디자인 가이드 (Design Guide)

이 문서는 **기관용 웹 애플리케이션(Institution Web App)** 의 UI/UX 디자인 원칙과 구현 가이드라인을 정의합니다.
개발 및 디자인 협업 시 이 문서를 기준으로 작업해 주세요.

---

## 1. 디자인 컨셉 (Design Concept)

### 🌱 Theme: "Nature & Care (자연과 돌봄)"

- **따뜻함 (Warmth)**: 차가운 디지털 느낌을 배제하고, 크림색과 자연의 녹색을 사용하여 편안함을 줍니다.
- **신뢰 (Trust)**: 명확한 정보 전달을 위해 가독성이 높은 타이포그래피와 정돈된 레이아웃을 사용합니다.
- **안정감 (Stability)**: 부드러운 곡선(Rounded Corners)과 은은한 그림자를 사용하여 시각적 피로를 줄입니다.

---

## 2. 컬러 시스템 (Color System)

`globals.css`의 CSS 변수를 통해 전역적으로 관리됩니다.

### 기본 팔레트 (Core Palette)

| 역할                     | 색상명      | Hex Code  | CSS Variable         | Tailwind Class               |
| :----------------------- | :---------- | :-------- | :------------------- | :--------------------------- |
| **배경 (Main BG)**       | Cream Rice  | `#F7F9F2` | `--background`       | `bg-background`              |
| **포인트 (Primary)**     | Damso Green | `#8FA963` | `--primary`          | `bg-primary`, `text-primary` |
| **강조 (Primary Hover)** | Deep Green  | `#7A9351` | N/A                  | `hover:bg-[#7A9351]`         |
| **텍스트 (Main Text)**   | Deep Moss   | `#4A5D23` | `--foreground`       | `text-foreground`            |
| **보조 텍스트**          | Muted Leaf  | `#6E7F4F` | `--muted-foreground` | `text-muted-foreground`      |
| **구분선/테두리**        | Pale Mist   | `#E9F0DF` | `--border`           | `border-border`              |
| **카드 배경**            | Pure White  | `#FFFFFF` | `--card`             | `bg-card`                    |

### 상태 컬러 (Semantic Colors)

| 상태               | 색상                                | 용도                            |
| :----------------- | :---------------------------------- | :------------------------------ |
| **Normal (안정)**  | `Primary (#8FA963)`                 | 상태 양호, 정상 작동            |
| **Warning (주의)** | `Amber (#F59E0B)` / `Red (#EF4444)` | 케어 필요, 위험 감지, 건강 악화 |
| **Info (정보)**    | `Blue (#3B82F6)`                    | 일반 정보, 약물 복용 등         |

---

## 3. 타이포그래피 (Typography)

**Font Family**: `Pretendard`, `Noto Sans KR`, `sans-serif` (Next.js `fonts` 설정 따름)

| 스타일                 | Size                    | Weight                            | 용도                               |
| :--------------------- | :---------------------- | :-------------------------------- | :--------------------------------- |
| **H1 (Page Title)**    | `text-2xl` ~ `text-3xl` | **Black (900)** or **Bold (700)** | 페이지 최상단 제목                 |
| **H2 (Section Title)** | `text-xl`               | **Bold (700)**                    | 모달 제목, 카드 섹션 제목          |
| **Subheader**          | `text-sm`               | **ExtraBold (800)**               | 소제목, 캡션 제목 (Uppercase 권장) |
| **Body (Default)**     | `text-base`             | **Medium (500)**                  | 일반 본문                          |
| **Caption**            | `text-xs`               | **Bold (700)**                    | 태그, 뱃지, 부가 설명              |

> **Note**: 어르신 관련 정보나 핵심 데이터는 일반 웹보다 **한 단계 굵게(Bold/ExtraBold)** 처리하여 가독성을 높입니다.

---

## 4. UI 컴포넌트 스타일 (UI Components)

### 🔲 카드 (Cards)

- **Background**: White (`bg-white`)
- **Border**: None or Subtle (`border-slate-100` / `ring-1 ring-slate-100`)
- **Shadow**: `shadow-sm` (기본), `shadow-md` (강조/Hover)
- **Radius**: `rounded-2xl` (16px) ~ `rounded-xl` (12px)
- **Padding**: 넉넉한 여백 (`p-5` ~ `p-6`)

### 🔘 버튼 (Buttons)

- **Primary**: `bg-primary`, `text-white`, `font-bold`, `shadow-md` (그림자 필수)
- **Secondary/Outline**: `bg-white`, `border-slate-200`, `text-slate-600`, `font-bold`
- **Ghost**: `hover:bg-slate-50`, `text-muted-foreground`
- **Size**: 터치 및 클릭 편의성을 위해 넉넉한 높이 (`h-10` ~ `h-12`)

### 🏷️ 뱃지 (Badges)

- **Outline**: `bg-slate-50`, `border-slate-200`, `text-slate-600`
- **State Badges**:
  - **위험**: `bg-red-50`, `text-red-500`
  - **안정**: `bg-emerald-50`, `text-emerald-600`

### 📱 모달 (Dialogs)

- **Max Width**: 컨텐츠 양에 따라 `max-w-xl` ~ `max-w-5xl`까지 유동적 사용
- **Header**: 명확한 타이틀과 아이콘 사용
- **Backdrop**: `bg-black/50` (집중도 향상)

---

## 5. 레이아웃 및 여백 (Layout & Spacing)

### 사이드바 (Sidebar)

- **Width**: `w-64` (Open), `w-20` (Collapsed)
- **Background**: `bg-card` (White)
- **Active State**: `bg-primary`, `text-white` (확실한 반전 효과)

### 페이지 구조

1. **Header**: 페이지 제목 + Action 버튼 + 검색창
2. **Main**: `flex-1`, `overflow-y-auto` (내부 스크롤)
3. **Content Grid**: 반응형 그리드 (`grid-cols-1`, `md:grid-cols-2`, `lg:grid-cols-3` 등)

---

## 6. 아이콘 (Iconography)

**Lucide React** 라이브러리를 사용합니다.

- **Stroke Width**: 기본 `2px` (선명함 유지)
- **Size**: 아이콘 단독 사용 시 `20px` 이상 권장
- **Color**: 텍스트 색상과 맞추거나, `text-slate-400` (비활성/장식용) 사용

---

_Last Updated: 2026.01.01_
