# UsageInfoTab Data Schema

This document describes the data structure required for the UsageInfoTab component to fetch real data from the API.

## Overview

The UsageInfoTab needs two main data sources:
1. **Call Schedule** - Daily call times for the beneficiary (Mon-Sun)
2. **Usage Statistics** - Call history and aggregated stats

---

## 1. Call Schedule API

### Endpoint
```
GET /api/beneficiaries/{id}/schedule
PUT /api/beneficiaries/{id}/schedule
```

### Response Schema
```typescript
interface BeneficiarySchedule {
  beneficiaryId: string;
  schedule: {
    monday: string | null;    // "HH:mm" format, e.g., "09:00"
    tuesday: string | null;
    wednesday: string | null;
    thursday: string | null;
    friday: string | null;
    saturday: string | null;
    sunday: string | null;
  };
  updatedAt: string; // ISO 8601 timestamp
}
```

### Update Request Body
```typescript
interface UpdateScheduleRequest {
  schedule: {
    monday?: string | null;
    tuesday?: string | null;
    wednesday?: string | null;
    thursday?: string | null;
    friday?: string | null;
    saturday?: string | null;
    sunday?: string | null;
  };
}
```

---

## 2. Usage Statistics API

### Endpoint
```
GET /api/beneficiaries/{id}/stats?startDate={date}&endDate={date}
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string | Yes | Start date (YYYY-MM-DD) |
| endDate | string | Yes | End date (YYYY-MM-DD) |

### Response Schema
```typescript
interface BeneficiaryUsageStats {
  beneficiaryId: string;
  period: {
    startDate: string; // "2026-01-01"
    endDate: string;   // "2026-01-31"
  };
  summary: {
    totalCalls: number;           // Total call count in period
    totalDurationMinutes: number; // Total duration in minutes
    averageDurationMinutes: number; // Average call duration
  };
  callDates: string[]; // Array of dates with calls, e.g., ["2026-01-02", "2026-01-05"]
}
```

---

## 3. Prisma Schema Additions (ops-api)

Add to `prisma/schema.prisma`:

```prisma
model BeneficiarySchedule {
  id            String   @id @default(cuid())
  beneficiaryId String   @unique
  monday        String?  // "HH:mm" or null if no call scheduled
  tuesday       String?
  wednesday     String?
  thursday      String?
  friday        String?
  saturday      String?
  sunday        String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  beneficiary   Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)
}

model CallLog {
  id            String   @id @default(cuid())
  beneficiaryId String
  callDate      DateTime
  durationSeconds Int
  callType      String   // "inbound" | "outbound" | "scheduled"
  status        String   // "completed" | "missed" | "no_answer"
  notes         String?
  createdAt     DateTime @default(now())
  
  beneficiary   Beneficiary @relation(fields: [beneficiaryId], references: [id], onDelete: Cascade)
  
  @@index([beneficiaryId, callDate])
}
```

---

## 4. Integration in UsageInfoTab

### Hook Usage
```typescript
// In UsageInfoTab.tsx
import { useApi } from '@/hooks/useApi';

// Fetch schedule
const { data: scheduleData, mutate: updateSchedule } = useApi<BeneficiarySchedule>(
  `/api/beneficiaries/${beneficiaryId}/schedule`
);

// Fetch stats based on period
const { data: statsData } = useApi<BeneficiaryUsageStats>(
  `/api/beneficiaries/${beneficiaryId}/stats?startDate=${startDate}&endDate=${endDate}`
);
```

### Data Mapping
```typescript
// Map API response to component state
const schedule: DailySchedule = {
  '월': scheduleData?.schedule.monday ?? '',
  '화': scheduleData?.schedule.tuesday ?? '',
  '수': scheduleData?.schedule.wednesday ?? '',
  '목': scheduleData?.schedule.thursday ?? '',
  '금': scheduleData?.schedule.friday ?? '',
  '토': scheduleData?.schedule.saturday ?? '',
  '일': scheduleData?.schedule.sunday ?? '',
};

const stats = {
  callCount: statsData?.summary.totalCalls ?? 0,
  totalMinutes: statsData?.summary.totalDurationMinutes ?? 0,
  avgMinutes: statsData?.summary.averageDurationMinutes ?? 0,
};

const callDates = statsData?.callDates ?? [];
```

---

## 5. API Implementation Notes

1. **Schedule Update**: Should support partial updates (only update days that are provided)
2. **Stats Aggregation**: Backend should aggregate call logs for the date range
3. **Call Dates**: For calendar highlighting, return all dates with at least one call
4. **Caching**: Consider caching stats responses as they don't change frequently

---

## Next Steps

1. [ ] Add `BeneficiarySchedule` and `CallLog` models to ops-api Prisma schema
2. [ ] Create API routes in ops-api for schedule and stats endpoints
3. [ ] Update UsageInfoTab to use real API hooks instead of mock data
4. [ ] Add loading and error states to UsageInfoTab
