# Dashboard 데이터 요구사항 분석

## 1. 컴포넌트별 필요 데이터

### 1.1 DailyOperationsSummary (일일 운영 요약)

| 필드 | 타입 | 설명 |
|------|------|------|
| `totalCalls` | number | 오늘 총 통화 수 |
| `incomingCalls` | number | 수신 통화 수 |
| `outgoingCalls` | number | 발신 통화 수 |
| `totalDurationMinutes` | number | 총 통화 시간 (분) |
| `avgDurationMinutes` | number | 평균 통화 시간 (분) |
| `scheduledCheckIns` | number | 오늘 예정된 안부전화 수 |
| `completedCheckIns` | number | 완료된 안부전화 수 |

**데이터 출처:** ✅ 기존 테이블에서 파생 가능
- `Call` 테이블: 통화 건수, 시간 계산 (answeredAt, endedAt)
- `CallSchedule` 테이블: 예정된 안부전화 (dayOfWeek, lastCalledAt)

---

### 1.2 OperationsTimeline (시간대별 통화 현황)

| 필드 | 타입 | 설명 |
|------|------|------|
| `hour` | string | 시간대 ("09:00") |
| `scheduled` | number | 예정 통화 수 |
| `actual` | number | 실시(완료) 통화 수 |
| `incoming` | number | 수신 통화 수 |

**데이터 출처:** ✅ 기존 테이블에서 파생 가능
- `Call` 테이블: 시간대별 GROUP BY (createdAt의 hour)
- `CallSchedule` 테이블: scheduledTime별 집계

---

### 1.3 BulletinBoard (공지사항)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | UUID |
| `date` | string | 작성일 |
| `title` | string | 제목 |
| `content` | string | 내용 |
| `author` | string | 작성자 |
| `attachments` | array | 첨부파일 {name, url, size} |

**데이터 출처:** ❌ 새 테이블 필요
- 현재 스키마에 공지사항 관련 테이블 없음

---

### 1.4 EmergencyLog (위급감지)

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | string | UUID |
| `datetime` | Date | 감지 일시 |
| `beneficiaryName` | string | 대상자 이름 |
| `type` | string | 유형 (낙상, 응답없음 등) |
| `status` | enum | resolved, pending, error |
| `manager` | string | 담당자 |
| `summary` | string | 대처 요약 |

**데이터 출처:** ⚠️ 일부 기존 + 신규 필드 필요
- `Emergency` 테이블: 기본 필드 있음
- ❌ `manager`, `summary` 필드 없음 → 추가 필요

---

## 2. 데이터 가용성 요약

| 컴포넌트 | 상태 | 설명 |
|----------|------|------|
| DailyOperationsSummary | ✅ 가능 | Call, CallSchedule에서 집계 |
| OperationsTimeline | ✅ 가능 | Call에서 시간대별 집계 |
| BulletinBoard | ❌ 신규 | Bulletin 테이블 생성 필요 |
| EmergencyLog | ⚠️ 부분 | Emergency 테이블 확장 필요 |

---

## 3. 필요한 스키마 변경

### 3.1 [NEW] Bulletin 테이블

```prisma
model Bulletin {
  id             String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  title          String
  content        String
  authorId       String   @map("author_id") @db.Uuid
  authorName     String   @map("author_name")
  isPinned       Boolean  @default(false) @map("is_pinned")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @default(now()) @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  author       Admin        @relation(fields: [authorId], references: [id], onDelete: SetNull)
  attachments  BulletinAttachment[]

  @@index([organizationId])
  @@index([createdAt(sort: Desc)])
  @@map("bulletins")
}

model BulletinAttachment {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  bulletinId  String   @map("bulletin_id") @db.Uuid
  fileName    String   @map("file_name")
  fileUrl     String   @map("file_url")
  fileSize    Int?     @map("file_size")
  mimeType    String?  @map("mime_type")
  createdAt   DateTime @default(now()) @map("created_at")

  bulletin Bulletin @relation(fields: [bulletinId], references: [id], onDelete: Cascade)

  @@index([bulletinId])
  @@map("bulletin_attachments")
}
```

### 3.2 [MODIFY] Emergency 테이블 확장

```prisma
// 추가 필드
model Emergency {
  // ... 기존 필드 유지
  
  // 신규 필드
  managerId      String?  @map("manager_id") @db.Uuid
  managerName    String?  @map("manager_name")
  handlingSummary String? @map("handling_summary")
  
  // 관계 추가
  manager Admin? @relation("ManagedEmergencies", fields: [managerId], references: [id])
}
```

---

## 4. API 엔드포인트 필요

| 엔드포인트 | 메서드 | 용도 |
|------------|--------|------|
| `/v1/admin/dashboard/summary` | GET | DailyOperationsSummary 데이터 |
| `/v1/admin/dashboard/timeline` | GET | 시간대별 통화 현황 |
| `/v1/admin/bulletins` | GET/POST | 공지사항 CRUD |
| `/v1/admin/bulletins/:id` | PUT/DELETE | 공지사항 수정/삭제 |
| `/v1/admin/emergencies` | GET | 위급감지 목록 (확장) |
| `/v1/admin/emergencies/:id` | PATCH | 담당자/요약 수정 |

---

## 5. 복잡성 분석

| 작업 | 복잡도 | 예상 시간 |
|------|--------|----------|
| Bulletin 테이블 생성 | 중간 | 2시간 |
| Bulletin API 구현 | 중간 | 3시간 |
| Emergency 필드 추가 | 낮음 | 1시간 |
| Dashboard Summary API | 낮음 | 2시간 |
| Timeline API | 낮음 | 1시간 |
| 파일 업로드 (S3) | 높음 | 4시간 |
| **총 예상** | | **~13시간** |

---

## 6. 권장 구현 순서

1. **Phase 1: 기존 데이터 활용 (즉시 가능)**
   - DailyOperationsSummary API 구현
   - OperationsTimeline API 구현
   - EmergencyLog API (기존 필드만)

2. **Phase 2: 스키마 확장 (DB 마이그레이션)**
   - Emergency 테이블 필드 추가
   - Bulletin, BulletinAttachment 테이블 생성

3. **Phase 3: 신규 기능 (백엔드 + 프론트)**
   - Bulletin CRUD API
   - Emergency 담당자/요약 업데이트 API
   - 프론트엔드 API 연동

4. **Phase 4: 고급 기능 (선택)**
   - 파일 업로드 (S3/CloudFlare R2)
   - 실시간 알림 (WebSocket)
