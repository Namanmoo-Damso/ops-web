# 📡 Institution Web App - API Requirements

이 문서는 **Frontend(Institution App)** 가 정상적으로 동작하기 위해 **Backend** 서버에 요청하는 API 명세 요구사항입니다.
현재 Frontend는 **Mock Data** 로 구현되어 있으며, 향후 아래 API 연동이 필요합니다.

---

## 1. 인증 (Auth)

### 로그인

- **Endpoint**: `POST /api/auth/login`
- **Request**: `{ "email": "...", "password": "..." }`
- **Response**: `{ "token": "JWT...", "user": { "id": 1, "name": "박관리", "role": "MANAGER" } }`

---

## 2. 대시보드 (Dashboard)

### 상단 통계 (Stat Cards)

- **Endpoint**: `GET /api/dashboard/stats`
- **Response**:
  ```json
  {
    "totalUsers": 124,
    "activeStaff": 12,
    "checkRequired": 3,
    "todayCalls": 45
  }
  ```

### 주요 알림 (Notifications)

- **Endpoint**: `GET /api/dashboard/notifications`

---

## 3. 실시간 모니터링 (Monitoring)

### CCTV/영상 세션 목록

- **Endpoint**: `GET /api/monitoring/sessions`
- **Response**: `Array<{ id, elderName, status: 'CONNECTING'|'LIVE'|'OFFLINE', lastActive }>`
- **Note**: WebRTC 연결을 위한 Signaling 서버 정보가 포함될 수 있음.

---

## 4. 지도 관제 (Map)

### 전체 대상자 위치 정보

- **Endpoint**: `GET /api/map/locations`
- **Response**: `Array<{ id, name, lat, lng, status: 'NORMAL'|'WARNING' }>`

### 특정 대상자 상세 (Overlay)

- **Endpoint**: `GET /api/users/{id}/summary`

---

## 5. 대상자 관리 (Users)

### 전체 대상자 목록 조회

- **Endpoint**: `GET /api/users`
- **Query Params**: `?filter=ALL|RISK`, `?search=...`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "name": "이말순",
      "age": 82,
      "gender": "여",
      "address": "...",
      "manager": "김복지",
      "status": "WARNING",
      "phoneNumber": "010-XXXX-XXXX"
    }
  ]
  ```

### 대상자 상세 정보

- **Endpoint**: `GET /api/users/{id}`
- **Response**: 상세 정보 + `diseases`(기저질환), `medication`(복약정보), `notes`(특이사항)

### 담소일지(상담 이력) 조회

- **Endpoint**: `GET /api/users/{id}/logs`
- **Response**: `Array<{ id, date, type, sentiment, summary }>`

### 전화 걸기 (Trigger Call)

- **Endpoint**: `POST /api/calls/dial`
- **Request**: `{ "userId": 1, "type": "URGENT" }`

### 담소일지 작성

- **Endpoint**: `POST /api/users/{id}/logs`
- **Request**: `{ "content": "방문 상담 내용...", "tags": ["건강호전"] }`

---

## 6. 리포트 (Report)

### 주간/월간 통계

- **Endpoint**: `GET /api/reports/statistics?period=weekly`

---

## 📝 개발 참고사항 (For Backend Team)

1. **상태값(Status)**: Frontend는 `NORMAL` (녹색), `CAUTION` (황색), `WARNING` (적색) 3단계 상태를 시각화합니다.
2. **실시간성**: 모니터링 및 지도는 `WebSocket` 또는 `Polling` 방식의 실시간 데이터 연동이 권장됩니다.
3. **Mock Data**: 현재 `src/app/(workspace)/.../page.tsx` 내부에 `const MOCK_DATA` 형태로 더미 데이터가 있으니, 필드명 매핑 시 참고 바랍니다.
