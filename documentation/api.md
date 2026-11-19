# API Reference — JEON Engineering Services

Base URL (dev): `http://localhost:4000`  
Base URL (prod): set via `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

---

## Health

### `GET /api/health`
Returns `200` if the server is running.

**Response**
```json
{ "ok": true, "ts": 1234567890 }
```

---

## Services

### `GET /api/services`
Returns the full service catalogue and available time slots. No auth required.

**Response**
```json
{
  "services": [
    {
      "id": "diagnostics",
      "name": "Engine Diagnostics",
      "description": "...",
      "durationLabel": "45–60 min",
      "priceFrom": 60,
      "icon": "scan"
    }
  ],
  "timeSlots": ["09:00", "10:00", "..."]
}
```

---

## Bookings

### `POST /api/bookings`
Create a booking request. No auth required.

**Request body**
```json
{
  "serviceId": "diagnostics",
  "date": "2025-08-01",
  "time": "10:00",
  "name": "Jane Doe",
  "phone": "+1 555 123 4567",
  "email": "jane@example.com",
  "vehicle": "BMW M3 2018",
  "notes": "Engine warning light on."
}
```

**Response `201`**
```json
{
  "id": "a1b2c3d4e5f6a7b8",
  "reference": "JEON-CB5033",
  "status": "pending",
  "serviceId": "diagnostics",
  "serviceName": "Engine Diagnostics",
  "date": "2025-08-01",
  "time": "10:00",
  "name": "Jane Doe",
  "phone": "+1 555 123 4567",
  "email": "jane@example.com",
  "vehicle": "BMW M3 2018",
  "notes": "Engine warning light on.",
  "createdAt": "2025-07-01T10:00:00.000Z"
}
```

**Error responses**

| Status | Reason |
|--------|--------|
| `400` | Validation failed — `fields` object shows per-field errors |
| `409` | That date/time slot is already booked |
| `500` | Server error |

---

### `GET /api/bookings`
List all bookings. **Admin only** — requires the `x-admin-token` header.

**Headers**
```
x-admin-token: <ADMIN_TOKEN from backend/.env>
```

**Response `200`** — array of booking objects (same shape as POST response).

**Error `401`** — missing or incorrect token.
