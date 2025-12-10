# Manual OTP Verification Guide

## Overview
Sometimes you may need to manually set `otpVerified = true` in the database for testing or admin purposes, bypassing the OTP verification process.

## Methods

### Method 1: Using API Endpoint (By User ID)

**Endpoint:** `PUT /api/users/{userId}/verify-otp`

**Example using curl:**
```bash
curl -X PUT http://localhost:8080/api/users/be900497-cc68-4504-9b99-4e5deaf1e6c0/verify-otp \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "OTP verified manually. User can now login.",
  "status": true
}
```

### Method 2: Using API Endpoint (By Email)

**Endpoint:** `PUT /api/users/verify-otp-by-email?email={email}`

**Example using curl:**
```bash
curl -X PUT "http://localhost:8080/api/users/verify-otp-by-email?email=user@example.com" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "OTP verified manually. User can now login.",
  "status": true
}
```

### Method 3: Direct Database Update (PostgreSQL)

Connect to your PostgreSQL database and run:

```sql
-- Verify by email
UPDATE app_user 
SET otp_verified = true 
WHERE email = 'user@example.com';

-- Verify by user ID
UPDATE app_user 
SET otp_verified = true 
WHERE id = 'be900497-cc68-4504-9b99-4e5deaf1e6c0'::uuid;

-- Verify all users (use with caution!)
UPDATE app_user 
SET otp_verified = true;
```

### Method 4: Using PostgreSQL Command Line

```bash
# Connect to database
psql -U postgres -d chatapp

# Update specific user
UPDATE app_user SET otp_verified = true WHERE email = 'user@example.com';

# Verify the update
SELECT id, email, phone_number, otp_verified FROM app_user WHERE email = 'user@example.com';
```

## Normal OTP Flow

1. **Signup** → User created with `otpVerified = false`
2. **OTP Page** → User enters phone number
3. **OTP Sent** → Backend generates and sends OTP (check console for code)
4. **OTP Input Field** → User enters 6-digit OTP
5. **Submit** → Backend verifies OTP
6. **Database Update** → `otpVerified = true` automatically
7. **Login** → User can now login successfully

## Verification Status Values

- `null` - User hasn't attempted OTP verification yet
- `false` - OTP verification failed or not completed
- `true` - OTP verified successfully, user can login

## Notes

- Manual verification endpoints require authentication (JWT token)
- For testing, you can temporarily disable authentication for these endpoints
- Always verify the user exists before updating
- After manual verification, user can login immediately

