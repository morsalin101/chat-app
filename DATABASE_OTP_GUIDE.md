# Database OTP Verification Guide

## OTP Verified Field in APP_USER Table

The `otp_verified` field in the `APP_USER` table can have three values:

- **`null`** - User hasn't verified OTP yet (default after signup)
- **`false`** - OTP verification failed
- **`true`** - OTP verified successfully (user can login)

## Manual Database Update

### Using PostgreSQL Command Line

```bash
# Connect to database
psql -U postgres -d chatapp
```

### Set OTP Verified to TRUE

```sql
-- By email
UPDATE app_user 
SET otp_verified = true 
WHERE email = 'user@example.com';

-- By user ID
UPDATE app_user 
SET otp_verified = true 
WHERE id = 'be900497-cc68-4504-9b99-4e5deaf1e6c0'::uuid;

-- By phone number
UPDATE app_user 
SET otp_verified = true 
WHERE phone_number = '+1234567890';
```

### Set OTP Verified to FALSE

```sql
UPDATE app_user 
SET otp_verified = false 
WHERE email = 'user@example.com';
```

### Set OTP Verified to NULL (Reset)

```sql
UPDATE app_user 
SET otp_verified = NULL 
WHERE email = 'user@example.com';
```

### Check Current Status

```sql
-- Check specific user
SELECT id, email, phone_number, otp_verified 
FROM app_user 
WHERE email = 'user@example.com';

-- Check all users
SELECT id, email, phone_number, otp_verified 
FROM app_user 
ORDER BY created_at DESC;
```

## Field Type

The `otp_verified` field is:
- **Type**: `BOOLEAN`
- **Nullable**: `YES` (can be NULL)
- **Default**: `NULL`

## Login Behavior

- **`otp_verified = NULL`** → ❌ Cannot login (needs verification)
- **`otp_verified = false`** → ❌ Cannot login (verification failed)
- **`otp_verified = true`** → ✅ Can login (verified)

## Example Workflow

1. **After Signup:**
   ```sql
   -- User created with otp_verified = NULL
   SELECT otp_verified FROM app_user WHERE email = 'newuser@example.com';
   -- Result: NULL
   ```

2. **After OTP Verification:**
   ```sql
   -- Backend automatically sets otp_verified = true
   SELECT otp_verified FROM app_user WHERE email = 'newuser@example.com';
   -- Result: true
   ```

3. **Manual Override:**
   ```sql
   -- Manually set to true for testing
   UPDATE app_user SET otp_verified = true WHERE email = 'newuser@example.com';
   ```

## Troubleshooting

### User Cannot Login

Check OTP status:
```sql
SELECT email, otp_verified FROM app_user WHERE email = 'user@example.com';
```

If `otp_verified` is `NULL` or `false`, set it to `true`:
```sql
UPDATE app_user SET otp_verified = true WHERE email = 'user@example.com';
```

### Reset OTP Status

To force user to verify again:
```sql
UPDATE app_user SET otp_verified = NULL WHERE email = 'user@example.com';
```

