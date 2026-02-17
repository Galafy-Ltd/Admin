# Admin Portal API - Frontend Integration Guide

## Table of Contents
1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
   - [System Configuration](#system-configuration)
   - [User Management](#user-management)
   - [KYC Management](#kyc-management)
   - [Analytics](#analytics)
   - [AML Alerts](#aml-alerts)
   - [Audit Logs](#audit-logs)
   - [Admin Management](#admin-management)
   - [Role Management](#role-management)
4. [Error Handling](#error-handling)
5. [Permission System](#permission-system)
6. [Example Implementation](#example-implementation)

---

## Base Configuration

### Base URL
```
Production: https://your-api-domain.com
Development: http://localhost:3000
```

### Content Type
All requests (except file downloads) should use:
```
Content-Type: application/json
```

### Authentication Header
All authenticated requests require:
```
Authorization: Bearer <access_token>
```

---

## Authentication

### 1. Login
**Endpoint:** `POST /admin/auth/login`

**Rate Limit:** 5 attempts per 15 minutes

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin-uuid",
    "email": "admin@example.com",
    "role": "SUPER_ADMIN",
    "isActive": true,
    "createdAt": "2025-01-25T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Invalid credentials or account locked
- `429`: Too many login attempts

**Important:** Store both `accessToken` and `refreshToken` securely. Access token expires in 8 hours (configurable via `ADMIN_JWT_EXPIRES_IN`).

---

### 2. Refresh Token
**Endpoint:** `POST /admin/auth/refresh`

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error:** `401` - Invalid or expired refresh token

---

### 3. Logout
**Endpoint:** `POST /admin/auth/logout`

**Headers:** Requires `Authorization: Bearer <access_token>`

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

### 4. Forgot Password
**Endpoint:** `POST /admin/auth/forgot-password`

**Rate Limit:** 5 attempts per 15 minutes

**Note:** This endpoint is public and does not require authentication.

**Request:**
```json
{
  "email": "admin@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

**Error Responses:**
- `429`: Too many requests

**Note:** Password reset link expires in 15 minutes. The link is sent via email.

---

### 5. Reset Password
**Endpoint:** `POST /admin/auth/reset-password`

**Note:** This endpoint is public and does not require authentication.

**Request:**
```json
{
  "token": "hex-token-string-from-email",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully. You can now log in with your new password."
}
```

**Error Responses:**
- `401`: Invalid or expired token
- `400`: Account is deactivated

---

## API Endpoints

All endpoints below require authentication unless specified otherwise.

### System Configuration

#### Get All Configurations
**Endpoint:** `GET /admin/config`

**Query Parameters:**
- `category` (optional): Filter by category (e.g., "FEES", "RISK", "DEVICE_ABUSE")
- `isActive` (optional): Filter by active status (boolean)

**Response:**
```json
{
  "configs": [
    {
      "id": "uuid",
      "key": "ADMIN_PAYOUT_FEE",
      "category": "FEES",
      "value": "0.03",
      "type": "DECIMAL",
      "description": "Admin fee for payouts (3%)",
      "isActive": true,
      "updatedBy": "admin-user-id",
      "updatedAt": "2025-01-19T20:00:00.000Z",
      "createdAt": "2025-01-19T20:00:00.000Z"
    }
  ],
  "total": 1
}
```

**Permission Required:** `view_config`

---

#### Get Configuration by Key
**Endpoint:** `GET /admin/config/:key`

**Example:** `GET /admin/config/ADMIN_PAYOUT_FEE`

**Response:** Single configuration object (same structure as above)

**Permission Required:** `view_config`

---

#### Get Configurations by Category
**Endpoint:** `GET /admin/config/category/:category`

**Example:** `GET /admin/config/category/FEES`

**Response:** Array of configuration objects

**Permission Required:** `view_config`

---

#### Update Configuration
**Endpoint:** `PUT /admin/config/:key`

**Request:**
```json
{
  "value": "0.05",
  "description": "Updated fee description"
}
```

**Response:** Updated configuration object

**Permission Required:** `manage_config`

---

#### Create Configuration
**Endpoint:** `POST /admin/config`

**Request:**
```json
{
  "key": "NEW_CONFIG_KEY",
  "category": "FEES",
  "value": "0.10",
  "type": "DECIMAL",
  "description": "New configuration"
}
```

**Response:** Created configuration object

**Permission Required:** `manage_config`

---

#### Delete Configuration
**Endpoint:** `DELETE /admin/config/:key`

**Response (200):**
```json
{
  "message": "Configuration deleted successfully"
}
```

**Permission Required:** `manage_config`

---

### User Management

#### Get Users
**Endpoint:** `GET /admin/users`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `search` (optional): Search by email or name
- `tier` (optional): Filter by KYC tier (`Tier_0`, `Tier_1`, `Tier_2`, `Tier_3`, `NoTier`). Use `NoTier` to filter users without customer records (no KYC).
- `utilityBillStatus` (optional): Filter by utility bill submission status (`PENDING`, `APPROVED`, `REJECTED`, `noBill`). Use `noBill` to filter users with no utility bill submissions.
- `isAmlRestricted` (optional): Filter by AML restriction status (boolean)

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "profilePicture": "https://example.com/profile.jpg",
      "customer": {
        "id": "customer-uuid",
        "tier": "Tier_2",
        "isAmlRestricted": false,
        "utilityBillStatus": "PENDING",
        "wallets": [...],
        "withdrawalLimit": {...}
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Permission Required:** `view_users`

---

#### Export Users to CSV
**Endpoint:** `GET /admin/users/export`

**Description:** Exports all users matching the provided filters to CSV format. Uses the same filter parameters as `GET /admin/users`. Maximum 100,000 records will be exported to prevent memory issues.

**Query Parameters:**
- `search` (optional): Search by email or name
- `tier` (optional): Filter by KYC tier (`Tier_0`, `Tier_1`, `Tier_2`, `Tier_3`, `NoTier`). Use `NoTier` to filter users without customer records (no KYC).
- `utilityBillStatus` (optional): Filter by utility bill submission status (`PENDING`, `APPROVED`, `REJECTED`, `noBill`). Use `noBill` to filter users with no utility bill submissions.
- `isAmlRestricted` (optional): Filter by AML restriction status (boolean)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="users-export-YYYY-MM-DD.csv"`
- CSV file with the following columns:
  - User ID
  - Email
  - Username
  - First Name
  - Last Name
  - Profile Picture (URL)
  - Phone
  - KYC Tier
  - Utility Bill Status (PENDING, APPROVED, REJECTED, or empty if no submission)
  - AML Restricted (Yes/No)
  - AML Restricted At (YYYY-MM-DD format)
  - AML Restriction Reason
  - Total Wallets (count)
  - Total Wallet Balance (sum of availableBalance as decimal string)
  - Created Date (YYYY-MM-DD format)

**Example Request:**
```
GET /admin/users/export?tier=Tier_2&isAmlRestricted=false
```

**Notes:**
- All filters from `GET /admin/users` are supported
- Data is processed in batches of 1,000 records to prevent memory issues
- Maximum export limit is 100,000 records
- Filename includes the current date in YYYY-MM-DD format

**Permission Required:** `view_users`

---

#### Search Users
**Endpoint:** `GET /admin/users/search`

**Description:** Search for users by email, phone, or username. The endpoint auto-detects the search type based on the query format. Email and phone searches use exact matching (return 0 or 1 user), while username searches use partial matching (can return multiple users).

**Query Parameters:**
- `q` (required): Search query string
  - Email: Must contain `@` symbol (e.g., `john@example.com`)
  - Phone: Contains digits, `+`, spaces, hyphens, or parentheses (e.g., `+2341234567890` or `234 123 456 7890`)
  - Username: Any other string (e.g., `johndoe` or `john`)

**Search Type Detection:**
1. **Email Search**: If query contains `@`, performs exact email match
2. **Phone Search**: If query matches phone pattern (digits/+/spaces), performs phone search
3. **Username Search**: Otherwise, performs case-insensitive partial username match

**Response:**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "username": "johndoe",
      "phone": "+2341234567890",
      "profilePicture": "https://example.com/profile.jpg",
      "isVerified": true,
      "customer": {
        "id": "customer-uuid",
        "tier": "Tier_2",
        "isAmlRestricted": false,
        "amlRestrictedAt": null,
        "amlRestrictionReason": null,
        "walletCount": 1,
        "totalBalance": "5000000",
        "wallets": [
          {
            "id": "wallet-uuid",
            "availableBalance": "5000000",
            "ledgerBalance": "5000000",
            "currencyId": "currency-uuid"
          }
        ],
        "withdrawalLimit": {
          "dailyLimit": "100000000",
          "approvedDailyLimit": "1000000000",
          "isLimitIncreased": true
        }
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Response Notes:**
- Always returns an array format for consistency
- Email/phone search: Returns array with 0 or 1 user (exact match)
- Username search: Returns array with 0 to 50 users (partial match, limited to prevent too many results)
- Empty array `[]` if no matches found
- Username results are ordered by creation date (newest first)

**Examples:**
- Email: `GET /admin/users/search?q=john@example.com` → Returns single user if email exists
- Phone: `GET /admin/users/search?q=+2341234567890` → Returns single user if phone exists
- Username: `GET /admin/users/search?q=john` → Returns all users with usernames containing "john" (case-insensitive)

**Permission Required:** `view_users`

---

#### Get User Details
**Endpoint:** `GET /admin/users/:userId`

**Response:** Detailed user object with all relations

**Permission Required:** `view_users`

---

#### Send KYC Reminder
**Endpoint:** `POST /admin/users/:userId/send-kyc-reminder`

**Description:** Send a KYC reminder email to a user to encourage them to complete their KYC verification. The email will only be sent to users with verified email addresses.

**Request:** No request body required

**Response:**
```json
{
  "success": true,
  "message": "KYC reminder email sent successfully",
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

**Error Responses:**
- `404`: User not found
- `400`: User email is not verified or email sending failed

**Permission Required:** `send_kyc_reminders` (SUPER_ADMIN, COMPLIANCE, or SUPPORT)

**Notes:**
- Only sends emails to users with verified email addresses (`isVerified: true`)
- The email includes information about the benefits of completing KYC (higher withdrawal limits, full account access, etc.)
- Includes a call-to-action button/link to complete KYC verification
- Admin action is logged for audit purposes

---

#### Restrict User (AML Flagging)
**Endpoint:** `POST /admin/users/:userId/restrict`

**Description:** Restrict a user due to AML compliance issues. An email notification will be automatically sent to the user (if their email is verified) informing them of the restriction and the reason.

**Request:**
```json
{
  "reason": "Suspicious transaction activity detected"
}
```

**Response:** Updated customer object with restriction details

**Permission Required:** `restrict_users` (SUPER_ADMIN or COMPLIANCE only)

**Notes:**
- Automatically sends an email notification to the user if their email is verified
- The email includes the restriction reason and contact information for support
- Email sending failures are logged but do not prevent the restriction from being applied
- Sets `isAmlRestricted: true`, `amlRestrictedAt: <current timestamp>`, and `amlRestrictionReason: <provided reason>` on the customer record

---

#### Unrestrict User
**Endpoint:** `POST /admin/users/:userId/unrestrict`

**Response:** Updated customer object with restriction removed

**Permission Required:** `unrestrict_users` (SUPER_ADMIN or COMPLIANCE only)

---

### KYC Management

#### Get Pending KYC Requests
**Endpoint:** `GET /admin/kyc/pending`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `tier` (optional): Filter by requested KYC tier

**Response:**
```json
{
  "requests": [
    {
      "id": "request-uuid",
      "customerId": "customer-uuid",
      "requestedTier": "TIER_2",
      "status": "PENDING",
      "customer": {...},
      "createdAt": "2025-02-08T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

**Permission Required:** `view_kyc_requests`

---

#### Get Pending Utility Bill Submissions
**Endpoint:** `GET /admin/kyc/utility-bills/pending`

**Query Parameters:** Same as KYC requests

**Response:** Similar structure with utility bill submissions

**Permission Required:** `view_kyc_requests`

---

#### Approve KYC Request
**Endpoint:** `POST /admin/kyc/requests/:requestId/approve`

**Request:**
```json
{
  "notes": "All documents verified and approved"
}
```

**Response:** Updated KYC request object

**Permission Required:** `approve_kyc` (SUPER_ADMIN or COMPLIANCE only)

---

#### Reject KYC Request
**Endpoint:** `POST /admin/kyc/requests/:requestId/reject`

**Request:**
```json
{
  "reason": "Documents are blurry or incomplete"
}
```

**Response:** Updated KYC request object

**Permission Required:** `reject_kyc` (SUPER_ADMIN or COMPLIANCE only)

---

#### Approve Utility Bill
**Endpoint:** `POST /admin/kyc/utility-bills/:submissionId/approve`

**Request:**
```json
{
  "notes": "Utility bill verified"
}
```

**Response:** Updated utility bill submission object

**Note:** This also increases the user's withdrawal limit to 10M per day for Tier 2 users.

**Permission Required:** `approve_utility_bill` (SUPER_ADMIN or COMPLIANCE only)

---

#### Reject Utility Bill
**Endpoint:** `POST /admin/kyc/utility-bills/:submissionId/reject`

**Request:**
```json
{
  "reason": "Utility bill is not clear or expired"
}
```

**Response:** Updated utility bill submission object

**Permission Required:** `reject_utility_bill` (SUPER_ADMIN or COMPLIANCE only)

---

### Analytics

#### Get Transaction Analytics Summary
**Endpoint:** `GET /admin/analytics/transaction-summary`

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string (e.g., "2025-01-01T00:00:00.000Z")
- `endDate` (optional): ISO 8601 date string (e.g., "2025-02-08T23:59:59.999Z")

**Response:**
```json
{
  "totalWalletBalance": "5000000000",
  "totalWithdrawn": "2000000000",
  "totalReceived": "7000000000",
  "chartData": [
    {
      "date": "2025-02-01",
      "amount": "50000000",
      "count": 25
    },
    {
      "date": "2025-02-02",
      "amount": "75000000",
      "count": 30
    },
    {
      "date": "2025-02-03",
      "amount": "60000000",
      "count": 28
    }
  ],
  "cached": false,
  "timestamp": "2025-02-08T14:30:00.000Z",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-02-08T23:59:59.999Z"
}
```

**Chart Data:**
- `chartData` contains daily transaction data points
- Includes all successful transactions (status = SUCCESS) regardless of type
- Defaults to last 7 days if no date filters provided
- Each data point includes: date (YYYY-MM-DD), total amount for that day (in kobo), and transaction count
- Data points are sorted by date in ascending order

**Note:** Results are cached for 5 minutes for all-time queries (no date filters).

**Permission Required:** `view_financial_reports`

---

### Dashboard

#### Get Dashboard Metrics
**Endpoint:** `GET /admin/dashboard/metrics`

**Response:**
```json
{
  "totalUsers": 1000,
  "totalUsersGrowth": 4.2,
  "verifiedUsers": 950,
  "totalEvents": 109,
  "totalEventsGrowth": 4.2,
  "activeEvents": 28,
  "pendingKyc": 18,
  "revenue": "8650000000",
  "revenueGrowth": 4.2,
  "totalSprayers": 0,
  "totalAttendees": 0
}
```

**Growth Calculation:**
- Growth percentages compare last 7 days vs previous 7 days (14 days ago to 7 days ago)
- Formula: `((current - previous) / previous) * 100`
- Growth values are rounded to 1 decimal place
- Revenue is calculated from AdminFee table (status = 'COLLECTED')

**Permission Required:** `view_dashboard`

---

### Events Management

#### Get All Events
**Endpoint:** `GET /admin/events`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `status` (optional): Filter by event status (`DRAFT`, `SCHEDULED`, `LIVE`, `ENDED`, `CANCELLED`)
  - UI mapping: "Upcoming" → `SCHEDULED`, "Live" → `LIVE`, "Completed" → `ENDED`, "All" → omit parameter
- `categories` (optional, array): Filter by event categories (multi-select). Common values: `Birthday`, `Wedding`, `Housewarming`, `Corporate`
  - Example: `?categories=Birthday&categories=Wedding`
- `search` (optional): Search by event title or host name
- `hostUserId` (optional): Filter by host user ID
- `startDate` (optional): Filter events starting from this date (ISO 8601)
  - Quick date options (Today, This Week, This Month, Last 90 days) are calculated on frontend and sent as `startDate`/`endDate`
- `endDate` (optional): Filter events starting before this date (ISO 8601)

**Response:**
```json
{
  "events": [
    {
      "id": "event-uuid",
      "code": "ABC123",
      "title": "Concert Event",
      "location": "Lagos",
      "category": "Music",
      "status": "LIVE",
      "startsAt": "2024-12-25T18:00:00Z",
      "hostUser": {
        "id": "user-uuid",
        "email": "host@example.com",
        "firstName": "Host",
        "lastName": "User"
      },
      "participantCount": 50,
      "sprayCount": 120,
      "totalSprayed": "5000000",
      "uniqueSprayerCount": 45,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Permission Required:** `view_events`

---

#### Get Event Metrics
**Endpoint:** `GET /admin/events/metrics`

**Description:** Returns aggregated event metrics with 7-day growth percentages. Calculates metrics for ALL events in the system (no filters applied). This endpoint replaces frontend calculations that were previously done from the `/admin/events` endpoint.

**Response:**
```json
{
  "totalEvents": 50,
  "totalEventsGrowth": 4.2,
  "activeEvents": 0,
  "activeEventsGrowth": 0,
  "totalAttendees": 25,
  "totalAttendeesGrowth": 4.2,
  "totalSprayed": "4285000.00",
  "totalSprayedGrowth": 4.2
}
```

**Fields:**
- `totalEvents`: Total number of events in the system
- `totalEventsGrowth`: Percentage growth comparing current total events vs total events 7 days ago
- `activeEvents`: Number of events with status `LIVE`
- `activeEventsGrowth`: Percentage growth comparing current active events vs active events 7 days ago
- `totalAttendees`: Total number of unique sprayers across all events (counted by `sprayerWallet.customer.userId`)
- `totalAttendeesGrowth`: Percentage growth comparing current unique sprayers vs unique sprayers 7 days ago
- `totalSprayed`: Total amount sprayed across all events (as decimal string, e.g., "4285000.00")
- `totalSprayedGrowth`: Percentage growth comparing current total sprayed vs total sprayed 7 days ago

**Growth Calculation:**
- Growth percentages compare current totals vs totals from 7 days ago
- Formula: `((current - previous) / previous) * 100`
- If previous value is 0 and current > 0, returns 100%
- If previous value is 0 and current is 0, returns 0%
- Growth values are rounded to 1 decimal place

**Permission Required:** `view_events`

---

#### Export Events to CSV
**Endpoint:** `GET /admin/events/export`

**Description:** Exports all events matching the provided filters to CSV format. Uses the same filter parameters as `GET /admin/events`. Maximum 100,000 records will be exported to prevent memory issues.

**Query Parameters:**
- `status` (optional): Filter by event status (`DRAFT`, `SCHEDULED`, `LIVE`, `ENDED`, `CANCELLED`)
  - UI mapping: "Upcoming" → `SCHEDULED`, "Live" → `LIVE`, "Completed" → `ENDED`, "All" → omit parameter
- `categories` (optional, array): Filter by event categories (multi-select). Common values: `Birthday`, `Wedding`, `Housewarming`, `Corporate`
  - Example: `?categories=Birthday&categories=Wedding`
- `search` (optional): Search by event title or host name
- `hostUserId` (optional): Filter by host user ID
- `startDate` (optional): Filter events starting from this date (ISO 8601)
  - Quick date options (Today, This Week, This Month, Last 90 days) are calculated on frontend and sent as `startDate`/`endDate`
- `endDate` (optional): Filter events starting before this date (ISO 8601)

**Response:**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="events-export-YYYY-MM-DD.csv"`
- CSV file with the following columns:
  - Event Name
  - Event Code
  - Date (YYYY-MM-DD format)
  - Revenue (totalSprayed as decimal string)
  - Attendees (unique sprayer count)
  - Status
  - Location
  - Category
  - Host User (name or email)
  - Created Date (YYYY-MM-DD format)

**Example Request:**
```
GET /admin/events/export?status=LIVE&startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z
```

**Notes:**
- All filters from `GET /admin/events` are supported
- Data is processed in batches of 1,000 records to prevent memory issues
- Maximum export limit is 100,000 records
- Filename includes the current date in YYYY-MM-DD format

**Permission Required:** `view_events`

---

#### Get Top 5 Events by Sprayers
**Endpoint:** `GET /admin/events/top-by-sprayers`

**Description:** Returns the top 5 events ranked by number of unique sprayers. Events with the highest number of sprayers rank first. In case of ties (same sprayer count or no spray data), events are ranked by earliest start date.

**Response:**
```json
{
  "events": [
    {
      "rank": 1,
      "id": "event-uuid",
      "title": "Concert Event",
      "code": "ABC123",
      "status": "LIVE",
      "startsAt": "2024-12-25T18:00:00Z",
      "startDate": "2024-12-25T18:00:00Z",
      "location": "Lagos",
      "category": "Music",
      "imageUrl": "https://example.com/image.jpg",
      "hostUser": {
        "id": "user-uuid",
        "email": "host@example.com",
        "firstName": "Host",
        "lastName": "User",
        "username": "hostuser",
        "phone": "+2341234567890",
        "profilePicture": "https://example.com/profile.jpg"
      },
      "sprayerCount": 150,
      "createdAt": "2024-01-01T00:00:00Z"
    },
    {
      "rank": 2,
      "id": "event-uuid-2",
      "title": "Birthday Party",
      "code": "DEF456",
      "status": "LIVE",
      "startsAt": "2024-12-20T15:00:00Z",
      "startDate": "2024-12-20T15:00:00Z",
      "location": "Abuja",
      "category": "Celebration",
      "imageUrl": "https://example.com/image2.jpg",
      "hostUser": {
        "id": "user-uuid-2",
        "email": "host2@example.com",
        "firstName": "Host",
        "lastName": "Two",
        "username": "hosttwo",
        "phone": "+2341234567891",
        "profilePicture": "https://example.com/profile2.jpg"
      },
      "sprayerCount": 120,
      "createdAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

**Ranking Logic:**
1. Primary sort: Number of unique sprayers (descending) - events with more sprayers rank higher
2. Tie-breaking: If sprayer counts are equal (or both events have no sprayers), events with earlier start dates rank higher

**Permission Required:** `view_events`

---

#### Get Event Details
**Endpoint:** `GET /admin/events/:id`

**Response:** Detailed event object with participants, sprays, and host info

**Permission Required:** `view_events`

---

#### Get Event Spray Activity
**Endpoint:** `GET /admin/events/:id/spray-activity`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `search` (optional): Search by sprayer name or email
- `minAmount` (optional): Minimum spray amount
- `maxAmount` (optional): Maximum spray amount
- `startDate` (optional): Filter sprays from this date
- `endDate` (optional): Filter sprays before this date

**Response:** Paginated list of sprays with sprayer and receiver info

**Permission Required:** `view_events`

---

#### Get Top Sprayers Leaderboard
**Endpoint:** `GET /admin/events/:id/top-sprayers`

**Query Parameters:**
- `limit` (optional, default: 10): Number of top sprayers to return
- `includeAnonymous` (optional, default: false): Include anonymous sprayers

**Response:**
```json
{
  "eventId": "event-uuid",
  "eventTitle": "Concert Event",
  "leaderboard": [
    {
      "rank": 1,
      "userId": "user-uuid",
      "username": "sprayer1",
      "email": "sprayer1@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "totalAmount": "500000",
      "sprayCount": 5,
      "firstSprayAt": "2024-12-25T18:00:00Z",
      "lastSprayAt": "2024-12-25T20:00:00Z"
    }
  ]
}
```

**Permission Required:** `view_events`

---

#### Suspend Event
**Endpoint:** `POST /admin/events/:id/suspend`

**Response:** Updated event object with status changed to `CANCELLED`

**Permission Required:** `manage_events` (SUPER_ADMIN or OPERATIONS only)

---

#### Download Event Report
**Endpoint:** `GET /admin/events/:id/report`

**Response:** CSV file download with event details, participants, and sprays

**Headers:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="event-report-ABC123-2025-01-01.csv"`

**Permission Required:** `view_events`

---

### Transactions Management

#### Get All Transactions
**Endpoint:** `GET /admin/transactions`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `status` (optional): Filter by transaction status
- `type` (optional): Filter by transaction type (`INFLOW`, `SPRAY`, `PAYOUT`, `REFUND`, `ADJUSTMENT`)
- `direction` (optional): Filter by direction (`CREDIT`, `DEBIT`)
- `userId` (optional): Filter by user ID
- `walletId` (optional): Filter by wallet ID
- `startDate` (optional): Filter transactions from this date
- `endDate` (optional): Filter transactions before this date
- `search` (optional): Search by reference, narration, or user email

**Response:** Paginated list of transactions with user and wallet info

**Permission Required:** `view_transactions`

---

#### Get Transaction Details
**Endpoint:** `GET /admin/transactions/:id`

**Response:** Detailed transaction object with related entities (user, wallet, event, spray)

**Permission Required:** `view_transactions`

---

#### Download Transaction Receipt
**Endpoint:** `GET /admin/transactions/:id/receipt`

**Response:** CSV file download with transaction receipt

**Headers:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="transaction-receipt-REF123-2025-01-01.csv"`

**Permission Required:** `view_transactions`

---

### Withdrawals Management

#### Get All Withdrawals
**Endpoint:** `GET /admin/withdrawals`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `status` (optional): Filter by payout status (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `REJECTED`, `REVERSED`)
- `userId` (optional): Filter by user ID
- `requiresApproval` (optional): Filter by withdrawals requiring admin approval (boolean)
- `startDate` (optional): Filter withdrawals from this date
- `endDate` (optional): Filter withdrawals before this date

**Response:** Paginated list of payout transactions (withdrawals) with user and bank account info

**Response Example:**
```json
{
  "withdrawals": [
    {
      "id": "payout-uuid",
      "walletId": "wallet-uuid",
      "bankAccountId": "bank-account-uuid",
      "amount": "100000000000",
      "fee": "3000000000",
      "status": "PENDING",
      "transactionId": "transaction-uuid",
      "providerTransactionRef": "provider-ref-123",
      "requiresApproval": true,
      "approvalReason": "Exceeds daily withdrawal limit",
      "approvedBy": null,
      "approvedAt": null,
      "rejectedBy": null,
      "rejectedAt": null,
      "rejectionReason": null,
      "createdAt": "2025-02-17T00:00:00.000Z",
      "updatedAt": "2025-02-17T00:00:00.000Z",
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "username": "johndoe"
      },
      "bankAccount": {
        "id": "bank-account-uuid",
        "accountName": "John Doe",
        "accountNumber": "1234567890",
        "bankCode": "058"
      },
      "transaction": {
        "id": "transaction-uuid",
        "reference": "PAYOUT-xxx",
        "status": "PENDING",
        "createdAt": "2025-02-17T00:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Permission Required:** `view_withdrawals`

**Note:** Use `requiresApproval=true` filter to show withdrawals pending admin approval (e.g., withdrawals that exceed daily limits).

---

#### Approve Withdrawal
**Endpoint:** `POST /admin/withdrawals/:id/approve`

**Description:** 
- For withdrawals that require approval (exceed daily limit): Processes the payout (debits wallet, calls provider), updates status to `PROCESSING`. Status will be updated to `SUCCESS` by webhook when provider confirms.
- For other withdrawals: Updates status to `PROCESSING` (will be processed by webhook).

**Important:** Only webhooks (or transaction status requery) can set status to `SUCCESS`. Admin approval sets to `PROCESSING`, and webhook updates to `SUCCESS` when provider confirms the transfer.

**Response:** Updated payout transaction with approval information

**Response Example:**
```json
{
  "id": "payout-uuid",
  "status": "PROCESSING",
  "requiresApproval": false,
  "approvedBy": "admin-uuid",
  "approvedAt": "2025-02-17T00:30:00.000Z",
  "approvalReason": null,
  "providerTransactionRef": "provider-ref-123",
  ...
}
```

**Error Responses:**
- `404`: Withdrawal not found
- `400`: Insufficient balance (for approvals requiring processing)
- `403`: Insufficient permissions

**Permission Required:** `manage_withdrawals` (SUPER_ADMIN or FINANCE_ADMIN only)

---

#### Reject Withdrawal
**Endpoint:** `POST /admin/withdrawals/:id/reject`

**Description:**
- For withdrawals that require approval (pending approval): Deletes placeholder transaction, marks as `REJECTED` without debiting wallet (since wallet was never debited).
- For processed withdrawals: Updates status to `REJECTED` and marks transaction as `FAILED`.

**Request:**
```json
{
  "reason": "Insufficient funds or suspicious activity"
}
```

**Response:** Updated payout transaction with rejection information

**Response Example:**
```json
{
  "id": "payout-uuid",
  "status": "REJECTED",
  "requiresApproval": false,
  "rejectedBy": "admin-uuid",
  "rejectedAt": "2025-02-17T00:30:00.000Z",
  "rejectionReason": "Insufficient funds or suspicious activity",
  ...
}
```

**Error Responses:**
- `404`: Withdrawal not found
- `400`: Withdrawal is already rejected or successful
- `403`: Insufficient permissions

**Permission Required:** `manage_withdrawals` (SUPER_ADMIN or FINANCE_ADMIN only)

---

#### Withdrawal Approval Flow

**Overview:**
When a Tier_2 user (with or without utility bill approval) tries to withdraw above their daily limit:
- Tier_2 without utility bill approval: Limit is 1M Naira
- Tier_2 with utility bill approval: Limit is 10M Naira

The system creates a `PayoutTransaction` with:
- `status: PENDING`
- `requiresApproval: true`
- `approvalReason: "Exceeds daily withdrawal limit"`
- Wallet is **NOT** debited until admin approves

**Admin Workflow:**
1. Admin views withdrawals with `requiresApproval=true` filter
2. Admin reviews withdrawal details (amount, user, bank account)
3. Admin approves → Payout is processed (wallet debited, provider called), status set to `PROCESSING`
4. Admin rejects → Withdrawal marked as `REJECTED`, no wallet debit, placeholder transaction deleted

**Status Flow:**
- `PENDING` (requiresApproval=true) → Admin approval → `PROCESSING` → Webhook → `SUCCESS`
- `PENDING` (requiresApproval=true) → Admin rejection → `REJECTED`

---

### Notifications Management

#### Get Admin Notifications
**Endpoint:** `GET /admin/notifications`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `read` (optional): Filter by read status (boolean)
- `type` (optional): Filter by notification type
- `startDate` (optional): Filter notifications from this date
- `endDate` (optional): Filter notifications before this date

**Response:** Paginated list of notifications

**Note:** Admin must have a linked `userId` to receive notifications. If admin doesn't have a userId, returns 400 error.

**Permission Required:** `view_notifications`

---

#### Mark Notification as Read
**Endpoint:** `PATCH /admin/notifications/:id/read`

**Response:** Updated notification object

**Permission Required:** `view_notifications`

---

#### Get Unread Notification Count
**Endpoint:** `GET /admin/notifications/unread-count`

**Response:**
```json
{
  "unreadCount": 5
}
```

**Permission Required:** `view_notifications`

---

### AML Alerts

#### Get AML Alerts
**Endpoint:** `GET /admin/alerts`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `severity` (optional): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `status` (optional): `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED`
- `eventType` (optional): e.g., "TRANSACTION_BLOCKED"
- `walletId` (optional)
- `customerId` (optional)
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Response:**
```json
{
  "alerts": [
    {
      "id": "alert-uuid",
      "eventType": "TRANSACTION_BLOCKED",
      "severity": "HIGH",
      "status": "PENDING",
      "walletId": "wallet-uuid",
      "customerId": "customer-uuid",
      "details": {
        "riskScore": 85,
        "blockReason": "Hard freeze - Risk score: 85",
        "amount": "5000000"
      },
      "createdAt": "2025-02-08T10:00:00.000Z",
      "wallet": {...}
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Permission Required:** `view_aml_alerts`

---

#### Get Alert Statistics
**Endpoint:** `GET /admin/alerts/stats`

**Response:**
```json
{
  "total": 150,
  "pending": 45,
  "reviewed": 60,
  "resolved": 40,
  "dismissed": 5,
  "bySeverity": {
    "CRITICAL": 10,
    "HIGH": 35,
    "MEDIUM": 80,
    "LOW": 25
  },
  "pendingBySeverity": {
    "CRITICAL": 8,
    "HIGH": 20,
    "MEDIUM": 15,
    "LOW": 2
  }
}
```

**Permission Required:** `view_aml_alerts`

---

#### Get Alert Details
**Endpoint:** `GET /admin/alerts/:alertId`

**Response:** Detailed alert object with wallet and customer relations

**Permission Required:** `view_aml_alerts`

---

#### Update Alert Status
**Endpoint:** `PATCH /admin/alerts/:alertId/status`

**Request:**
```json
{
  "status": "REVIEWED",
  "resolutionNotes": "Reviewed and escalated to compliance team"
}
```

**Status Values:** `REVIEWED`, `RESOLVED`, `DISMISSED`

**Response:** Updated alert object

**Permission Required:** `manage_aml_alerts` (SUPER_ADMIN or COMPLIANCE only)

---

### Audit Logs

#### Get Action Logs
**Endpoint:** `GET /admin/logs`

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20)
- `adminId` (optional): Filter by admin ID
- `actionType` (optional): e.g., "KYC_APPROVED", "USER_RESTRICTED"
- `targetType` (optional): e.g., "CUSTOMER", "KYC_REQUEST", "UTILITY_BILL"
- `targetId` (optional): Filter by target entity ID
- `startDate` (optional): ISO 8601 date string
- `endDate` (optional): ISO 8601 date string

**Response:**
```json
{
  "logs": [
    {
      "id": "log-uuid",
      "adminId": "admin-uuid",
      "actionType": "KYC_APPROVED",
      "targetType": "KYC_REQUEST",
      "targetId": "request-uuid",
      "reason": null,
      "details": {
        "tier": "TIER_2"
      },
      "createdAt": "2025-02-08T10:00:00.000Z",
      "admin": {
        "id": "admin-uuid",
        "email": "admin@example.com",
        "role": "COMPLIANCE"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Permission Required:** `view_audit_logs`

---

#### Export Action Logs (CSV)
**Endpoint:** `GET /admin/logs/export`

**Query Parameters:** Same as Get Action Logs (all optional)

**Response:** CSV file download

**Headers:**
- `Content-Type: text/csv`
- `Content-Disposition: attachment; filename="admin-action-logs-2025-01-01-to-2025-02-08.csv"`

**Permission Required:** `view_audit_logs`

**Frontend Implementation:**
```javascript
// Example: Download CSV file
const response = await fetch('/admin/logs/export?startDate=2025-01-01&endDate=2025-02-08', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'admin-action-logs.csv';
a.click();
```

---

### Admin Management

#### Invite Admin User
**Endpoint:** `POST /admin/admins/invite`

**Request:**
```json
{
  "email": "newadmin@example.com",
  "role": "COMPLIANCE"
}
```

**Response (201):**
```json
{
  "id": "invite-uuid",
  "email": "newadmin@example.com",
  "role": "COMPLIANCE",
  "expiresAt": "2025-02-17T12:00:00.000Z",
  "token": "hex-token-string",
  "message": "Invite created successfully. Token sent via email."
}
```

**Note:** In development mode, the token is returned in the response. In production, the token is only sent via email.

**Error Responses:**
- `409`: Admin already exists or active invite exists
- `403`: Insufficient permissions

**Permission Required:** `manage_admins` (SUPER_ADMIN only)

---

#### Accept Admin Invite
**Endpoint:** `POST /admin/admins/accept-invite`

**Note:** This endpoint is **public** and does not require authentication.

**Request:**
```json
{
  "token": "invite-token-from-email",
  "password": "SecurePassword123!"
}
```

**Response (201):**
```json
{
  "id": "admin-uuid",
  "email": "newadmin@example.com",
  "role": "COMPLIANCE",
  "message": "Admin account created successfully. You can now log in."
}
```

**Error Responses:**
- `400`: Invalid token, expired, or already used
- `404`: Invite not found
- `409`: Admin already exists

---

#### Get All Admins
**Endpoint:** `GET /admin/admins`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page
- `search` (optional): Search by email
- `role` (optional): Filter by role (`SUPER_ADMIN`, `COMPLIANCE`, `OPERATIONS`, etc.)
- `isActive` (optional): Filter by active status (boolean)

**Response:**
```json
{
  "admins": [
    {
      "id": "admin-uuid",
      "email": "admin@example.com",
      "role": "COMPLIANCE",
      "isActive": true,
      "lastLoginAt": "2025-02-10T10:00:00.000Z",
      "createdAt": "2025-01-25T10:00:00.000Z",
      "updatedAt": "2025-02-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

**Permission Required:** `view_admins`

---

#### Get Admin Details
**Endpoint:** `GET /admin/admins/:adminId`

**Response:**
```json
{
  "id": "admin-uuid",
  "email": "admin@example.com",
  "role": "COMPLIANCE",
  "isActive": true,
  "lastLoginAt": "2025-02-10T10:00:00.000Z",
  "failedLoginAttempts": 0,
  "lockedUntil": null,
  "createdAt": "2025-01-25T10:00:00.000Z",
  "updatedAt": "2025-02-10T10:00:00.000Z",
  "sentInvites": [
    {
      "id": "invite-uuid",
      "email": "newadmin@example.com",
      "role": "SUPPORT",
      "accepted": true,
      "expiresAt": "2025-02-17T12:00:00.000Z",
      "createdAt": "2025-02-10T12:00:00.000Z"
    }
  ]
}
```

**Permission Required:** `view_admins`

---

#### Update Admin
**Endpoint:** `PATCH /admin/admins/:adminId`

**Request:**
```json
{
  "role": "OPERATIONS",
  "isActive": true
}
```

**Response:** Updated admin object (password excluded)

**Error Responses:**
- `400`: Cannot deactivate own account
- `404`: Admin not found

**Permission Required:** `manage_admins` (SUPER_ADMIN only)

---

#### Deactivate Admin
**Endpoint:** `DELETE /admin/admins/:adminId`

**Response:** Deactivated admin object (password excluded)

**Error Responses:**
- `400`: Cannot deactivate own account
- `404`: Admin not found

**Permission Required:** `manage_admins` (SUPER_ADMIN only)

---

### Role Management

#### Get All Roles
**Endpoint:** `GET /admin/roles`

**Response:**
```json
{
  "roles": [
    {
      "role": "SUPER_ADMIN",
      "userCount": 2
    },
    {
      "role": "COMPLIANCE",
      "userCount": 5
    },
    {
      "role": "OPERATIONS",
      "userCount": 3
    },
    {
      "role": "FINANCE_ADMIN",
      "userCount": 1
    },
    {
      "role": "SUPPORT",
      "userCount": 4
    },
    {
      "role": "VIEW_ONLY",
      "userCount": 2
    }
  ]
}
```

**Permission Required:** `view_admins`

---

#### Get Role Details
**Endpoint:** `GET /admin/roles/:roleName`

**Query Parameters:**
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 20): Items per page

**Response:**
```json
{
  "role": "COMPLIANCE",
  "admins": [
    {
      "id": "admin-uuid",
      "email": "compliance@example.com",
      "role": "COMPLIANCE",
      "isActive": true,
      "lastLoginAt": "2025-02-10T10:00:00.000Z",
      "createdAt": "2025-01-25T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

**Permission Required:** `view_admins`

---

#### Assign Role to Admin
**Endpoint:** `POST /admin/roles/:roleName/assign`

**URL Parameters:**
- `roleName`: The role to assign (e.g., `COMPLIANCE`, `OPERATIONS`)

**Request:**
```json
{
  "adminId": "admin-uuid"
}
```

**Response:** Updated admin object with new role (password excluded)

**Error Responses:**
- `400`: Invalid role name
- `404`: Admin not found

**Permission Required:** `manage_admins` (SUPER_ADMIN only)

**Example:**
```javascript
// Assign COMPLIANCE role to an admin
await fetch('/admin/roles/COMPLIANCE/assign', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    adminId: 'admin-uuid'
  })
});
```

---

## Error Handling

### Standard Error Response Format
```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid/expired token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not Found
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

### Token Expiration Handling

When you receive a `401` response:
1. Attempt to refresh the token using `/admin/auth/refresh`
2. If refresh succeeds, retry the original request with the new token
3. If refresh fails, redirect to login page

### Permission Errors

If you receive a `403` response, the admin doesn't have permission for that action. Hide or disable the UI element that triggered the request.

---

## Permission System

### Admin Roles

- **SUPER_ADMIN**: Full access to all features
- **COMPLIANCE**: KYC management, AML alerts, user restrictions
- **OPERATIONS**: User management, transactions, events, config management
- **FINANCE_ADMIN**: Financial reports, transactions, refunds
- **SUPPORT**: Support tickets, user viewing
- **VIEW_ONLY**: Read-only access to most features

### Checking Permissions

The backend enforces permissions automatically. If an endpoint returns `403`, the admin doesn't have access. You can also check the admin's role from the login response to conditionally show/hide UI elements.

### Permission Constants (for reference)

```javascript
const PERMISSIONS = {
  VIEW_USERS: 'view_users',
  EDIT_USERS: 'edit_users',
  RESTRICT_USERS: 'restrict_users',
  VIEW_KYC_REQUESTS: 'view_kyc_requests',
  APPROVE_KYC: 'approve_kyc',
  REJECT_KYC: 'reject_kyc',
  VIEW_AML_ALERTS: 'view_aml_alerts',
  MANAGE_AML_ALERTS: 'manage_aml_alerts',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_FINANCIAL_REPORTS: 'view_financial_reports',
  MANAGE_ADMINS: 'manage_admins',
  VIEW_ADMINS: 'view_admins',
  // ... etc
};
```

---

## Example Implementation

### TypeScript/JavaScript API Client Example

```typescript
class AdminAPI {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Load tokens from localStorage
    this.accessToken = localStorage.getItem('admin_access_token');
    this.refreshToken = localStorage.getItem('admin_refresh_token');
  }

  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.accessToken && {
        Authorization: `Bearer ${this.accessToken}`,
      }),
      ...options.headers,
    };

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        headers.Authorization = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        // Refresh failed, redirect to login
        this.logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    this.accessToken = data.accessToken;
    this.refreshToken = data.refreshToken;

    // Store tokens
    localStorage.setItem('admin_access_token', data.accessToken);
    localStorage.setItem('admin_refresh_token', data.refreshToken);

    return data;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseURL}/admin/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;

      localStorage.setItem('admin_access_token', data.accessToken);
      localStorage.setItem('admin_refresh_token', data.refreshToken);

      return true;
    } catch {
      return false;
    }
  }

  async logout() {
    if (this.accessToken) {
      try {
        await this.request('/admin/auth/logout', { method: 'POST' });
      } catch {
        // Ignore errors on logout
      }
    }

    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
  }

  // User Management
  async getUsers(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    tier?: string;
    isAmlRestricted?: boolean;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await this.request(`/admin/users?${params}`);
    return response.json();
  }

  // KYC Management
  async getPendingKycRequests(filters?: { page?: number; limit?: number; tier?: string }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await this.request(`/admin/kyc/pending?${params}`);
    return response.json();
  }

  async approveKycRequest(requestId: string, notes?: string) {
    const response = await this.request(`/admin/kyc/requests/${requestId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return response.json();
  }

  async rejectKycRequest(requestId: string, reason: string) {
    const response = await this.request(`/admin/kyc/requests/${requestId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return response.json();
  }

  // Analytics
  async getTransactionAnalytics(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await this.request(`/admin/analytics/transaction-summary?${params}`);
    return response.json();
  }

  // AML Alerts
  async getAlerts(filters?: {
    page?: number;
    limit?: number;
    severity?: string;
    status?: string;
    eventType?: string;
    walletId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await this.request(`/admin/alerts?${params}`);
    return response.json();
  }

  async updateAlertStatus(alertId: string, status: string, resolutionNotes?: string) {
    const response = await this.request(`/admin/alerts/${alertId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, resolutionNotes }),
    });
    return response.json();
  }

  // Audit Logs
  async getActionLogs(filters?: {
    page?: number;
    limit?: number;
    adminId?: string;
    actionType?: string;
    targetType?: string;
    targetId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await this.request(`/admin/logs?${params}`);
    return response.json();
  }

  async exportActionLogsCSV(filters?: {
    adminId?: string;
    actionType?: string;
    targetType?: string;
    targetId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await this.request(`/admin/logs/export?${params}`);
    return response.blob();
  }

  // Admin Management
  async inviteAdmin(email: string, role: string) {
    const response = await this.request('/admin/admins/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    return response.json();
  }

  async acceptInvite(token: string, password: string) {
    const response = await fetch(`${this.baseURL}/admin/admins/accept-invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to accept invite');
    }

    return response.json();
  }

  async getAdmins(filters?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await this.request(`/admin/admins?${params}`);
    return response.json();
  }

  async getAdminById(adminId: string) {
    const response = await this.request(`/admin/admins/${adminId}`);
    return response.json();
  }

  async updateAdmin(adminId: string, data: { role?: string; isActive?: boolean }) {
    const response = await this.request(`/admin/admins/${adminId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async deactivateAdmin(adminId: string) {
    const response = await this.request(`/admin/admins/${adminId}`, {
      method: 'DELETE',
    });
    return response.json();
  }

  // Role Management
  async getRoles() {
    const response = await this.request('/admin/roles');
    return response.json();
  }

  async getRoleDetails(roleName: string, filters?: { page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
    }

    const response = await this.request(`/admin/roles/${roleName}?${params}`);
    return response.json();
  }

  async assignRoleToAdmin(roleName: string, adminId: string) {
    const response = await this.request(`/admin/roles/${roleName}/assign`, {
      method: 'POST',
      body: JSON.stringify({ adminId }),
    });
    return response.json();
  }
}

// Usage
const api = new AdminAPI('http://localhost:3000');
await api.login('admin@example.com', 'password');
const users = await api.getUsers({ page: 1, limit: 20 });

// Admin Management Examples
const invite = await api.inviteAdmin('newadmin@example.com', 'COMPLIANCE');
const admins = await api.getAdmins({ page: 1, limit: 20, role: 'COMPLIANCE' });
const roles = await api.getRoles();
```

---

## Important Notes

1. **Token Storage**: Store tokens securely (consider using httpOnly cookies in production, or secure localStorage)

2. **Token Refresh**: Implement automatic token refresh before expiration to avoid interrupting user sessions

3. **Rate Limiting**: Login endpoint is rate-limited to 5 attempts per 15 minutes. Show appropriate error messages to users

4. **Date Formats**: Always use ISO 8601 format for dates (e.g., "2025-02-08T10:00:00.000Z")

5. **Pagination**: Most list endpoints support pagination. Always check the `pagination` object in responses

6. **CSV Export**: The CSV export endpoint returns a file download. Handle it appropriately in your frontend

7. **Error Messages**: Display user-friendly error messages based on the `message` field in error responses

8. **Permission-Based UI**: Hide or disable UI elements based on the admin's role to prevent unnecessary API calls

9. **Swagger Documentation**: The API has Swagger documentation available at `/api-docs` (if configured) for interactive testing

10. **Caching**: Transaction analytics are cached for 5 minutes. The `cached` field in the response indicates if data is from cache

11. **Admin Invites**: Admin invite tokens expire after 7 days. In development mode, tokens are returned in the API response. In production, tokens are only sent via email.

12. **Self-Protection**: Admins cannot deactivate their own accounts. Attempts to do so will return a `400` error.

13. **Password Reset**: Admin password reset tokens expire in 15 minutes. Reset links are sent via email.

14. **Admin Notifications**: Admin notifications require the admin to have a linked `userId`. If an admin doesn't have a userId, notification endpoints will return a `400` error.

15. **Withdrawal Approval Flow**: 
    - Withdrawals that exceed daily limits (Tier_2 without utility bill: 1M Naira, Tier_2 with utility bill: 10M Naira) require admin approval
    - These withdrawals are created with `requiresApproval: true` and `status: PENDING`
    - Wallet is **NOT** debited until admin approves
    - Admin can approve (processes payout, sets status to `PROCESSING`) or reject (marks as `REJECTED`, no wallet debit)
    - Only webhooks can set status to `SUCCESS` after provider confirms the transfer
    - Use `requiresApproval=true` filter in `GET /admin/withdrawals` to show pending approvals

16. **Event Reports**: Event reports are generated as CSV files. Transaction receipts are also CSV format.

17. **Redundancy**: Some endpoints may overlap with regular user endpoints (e.g., `/api/events` vs `/admin/events`). Admin endpoints provide admin-specific features like suspend, reports, and system-wide views.

---

## Testing

### Test Credentials
Contact the backend team for test admin credentials. Default admin can be seeded using:
```bash
npm run db:seed:admin
```

### Postman Collection
Consider creating a Postman collection with all endpoints for easier testing and documentation.

---

## Support

For questions or issues:
1. Check the Swagger documentation at `/api-docs`
2. Review error messages in API responses
3. Contact the backend development team

---

**Last Updated:** February 10, 2025


