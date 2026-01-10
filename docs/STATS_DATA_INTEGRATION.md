# 통계 페이지 데이터 연동 계획

## 현재 상태 요약

통계 페이지(`/app/stats`)는 현재 모든 데이터를 Mock 데이터로 표시합니다. 이 문서는 기존 스키마로 연동 가능한 데이터와 추가 스키마가 필요한 데이터를 정리합니다.

---

## 1. ✅ 연동 가능 (기존 스키마 활용)

### 1.1 총 통화 건수 / 수신·발신

| 항목 | 모델 | 필드 | 쿼리 방법 |
|------|------|------|-----------|
| 총 통화 건수 | `Call` | `callId` | `COUNT(*)` with date filter |
| 수신 건수 | `Call` | `callerIdentity` | `COUNT(*)` WHERE callerIdentity = 'ai-agent' |
| 발신 건수 | `Call` | `callerIdentity` | `COUNT(*)` WHERE callerIdentity != 'ai-agent' |

> **API 엔드포인트 필요**: `GET /v1/admin/stats/calls?startDate=&endDate=`

### 1.2 평균 통화 횟수 (대상자당)

```sql
SELECT COUNT(*)::decimal / COUNT(DISTINCT ward_id) 
FROM calls 
JOIN call_summaries ON call_id
WHERE created_at BETWEEN ? AND ?
```

### 1.3 평균 통화 시간

| 모델 | 필드 | 계산 |
|------|------|------|
| `Call` | `answeredAt`, `endedAt` | `AVG(endedAt - answeredAt)` |

### 1.4 정서 분석 (Sentiment)

| 모델 | 필드 | 쿼리 |
|------|------|------|
| `CallSummary` | `mood` | `GROUP BY mood` → positive/neutral/negative 비율 |
| `CallSummary` | `moodScore` | 평균 점수 계산 가능 |

### 1.5 위험 감지 건수

| 모델 | 필드 | 쿼리 |
|------|------|------|
| `Emergency` | `status` | `COUNT(*)` WHERE status = 'active' OR date within range |

### 1.6 위험 대응 건수

| 모델 | 필드 | 쿼리 |
|------|------|------|
| `Emergency` | `resolvedAt` | `COUNT(*)` WHERE resolvedAt IS NOT NULL |

### 1.7 주요 언급 키워드

| 모델 | 필드 | 방법 |
|------|------|------|
| `CallSummary` | `tags[]` | Aggregate all tags, count frequency |
| `CallSummary` | `healthKeywords` (JSON) | Parse and aggregate |

---

## 2. ⚠️ 부분 연동 가능 (추가 로직 필요)

### 2.1 시간대별 통화 스케줄

**현재 스키마**:
- `CallSchedule`: 예약된 통화 스케줄 (`dayOfWeek`, `scheduledTime`)
- `Call`: 실제 통화 기록 (`createdAt`, `answeredAt`)

**연동 방법**:
```sql
-- 예약된 건수 (시간대별)
SELECT EXTRACT(HOUR FROM scheduled_time) as hour, COUNT(*) as scheduled
FROM call_schedules
GROUP BY hour;

-- 완료된 건수 (시간대별)  
SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as completed
FROM calls
WHERE state = 'ended' AND ended_at IS NOT NULL
GROUP BY hour;
```

**부족한 부분**: "추가(incoming)" 콜 구분
- 현재 스키마에 예약 외 수신 통화 구분 필드 없음

---

## 3. ❌ 스키마 추가 필요

### 3.1 통화 추이 (일별/주별/월별 트렌드)

**현재 상태**: 가능 - `Call.createdAt` 기준 집계

**권장 개선**: 집계 테이블 추가 (성능 최적화)

```prisma
model CallStats {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String? @map("organization_id") @db.Uuid
  date          DateTime @db.Date
  totalCalls    Int      @default(0) @map("total_calls")
  inboundCalls  Int      @default(0) @map("inbound_calls")
  outboundCalls Int      @default(0) @map("outbound_calls")
  avgDurationSec Int?    @map("avg_duration_sec")
  emergencies   Int      @default(0)
  
  @@unique([organizationId, date])
  @@map("call_stats")
}
```

### 3.2 위험 감지 상세 타입

**현재**: `Emergency.type` = 'manual' | 'ai_detected' | 'geofence' | 'admin'

**추가 권장**:
```prisma
model Emergency {
  // 기존 필드...
  riskCategory   String?   @map("risk_category")  // 'fall' | 'depression' | 'medication' | 'isolation'
  severity       String?   @default("medium")     // 'low' | 'medium' | 'high' | 'critical'
}
```

### 3.3 수신/발신 통화 명시적 구분

**현재**: `callerIdentity` 문자열로 추론 가능하나 불명확

**추가 권장**:
```prisma
model Call {
  // 기존 필드...
  direction     String?   // 'inbound' | 'outbound'
  isScheduled   Boolean   @default(false) @map("is_scheduled")
  scheduleId    String?   @map("schedule_id") @db.Uuid
}
```

### 3.4 키워드 통계 테이블

**현재**: `CallSummary.tags[]`와 `healthKeywords` JSON에서 매번 집계

**추가 권장** (성능 최적화):
```prisma
model KeywordStats {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String? @map("organization_id") @db.Uuid
  keyword       String
  category      String?  // 'health' | 'emotion' | 'activity'
  count         Int      @default(1)
  lastMentioned DateTime @map("last_mentioned")
  periodStart   DateTime @map("period_start") @db.Date
  
  @@unique([organizationId, keyword, periodStart])
  @@index([organizationId, count(sort: Desc)])
  @@map("keyword_stats")
}
```

---

## 4. API 엔드포인트 설계

### 필요한 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/v1/admin/stats/overview` | GET | 통합 통계 (총 통화, 평균, 위험 감지) |
| `/v1/admin/stats/calls/trend` | GET | 일별/주별 통화 추이 |
| `/v1/admin/stats/calls/hourly` | GET | 시간대별 통화 분포 |
| `/v1/admin/stats/sentiment` | GET | 정서 분석 분포 |
| `/v1/admin/stats/keywords` | GET | 주요 키워드 순위 |
| `/v1/admin/stats/risks` | GET | 위험 감지/대응 통계 |

### Query Parameters

```typescript
interface StatsQueryParams {
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  organizationId?: string;
  period?: 'daily' | 'weekly' | 'monthly';
}
```

---

## 5. 구현 우선순위

### Phase 1: 즉시 연동 가능
1. ✅ 위험 감지/대응 건수 (`Emergency` 모델)
2. ✅ 정서 분석 분포 (`CallSummary.mood`)
3. ✅ 총 통화 건수 (`Call` 모델)

### Phase 2: API 개발 필요
4. ⚠️ 평균 통화 시간 계산
5. ⚠️ 시간대별 통화 분포
6. ⚠️ 주요 키워드 집계

### Phase 3: 스키마 변경 필요
7. ❌ 수신/발신 명시적 구분
8. ❌ 통화 통계 집계 테이블
9. ❌ 키워드 통계 테이블

---

## 6. 마이그레이션 체크리스트

- [ ] `CallStats` 모델 추가
- [ ] `Call.direction` 필드 추가
- [ ] `Call.isScheduled` 필드 추가
- [ ] `KeywordStats` 모델 추가
- [ ] 배치 작업: 기존 데이터 기반 집계 테이블 초기화
