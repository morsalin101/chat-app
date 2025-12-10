# Quick Setup Guide

## Step-by-Step Installation

### 1. Database Setup

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE chatapp;

# Exit
\q
```

### 2. Backend Setup

```bash
cd backend

# Update application.properties with your database credentials
# Edit: src/main/resources/application.properties

# Note: uploads directory will be created automatically on first run
# But you can manually create it if needed:
# mkdir -p uploads/profiles uploads/groups

# Build and run
mvn clean install
mvn spring-boot:run
```

Backend runs on: `http://localhost:8080`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend runs on: `http://localhost:3000`

## Testing the Application

### 1. OTP Registration Flow

1. **Signup**: Go to `/signup` and create account (email, password, name)
2. **OTP Page**: After signup, you'll be redirected to `/otp-verify?userId=...`
3. **Enter Phone**: Enter your phone number and click "Send OTP"
4. **Check Console**: OTP code will be logged in backend console (development mode)
5. **Enter OTP**: OTP input field will appear, enter the 6-digit code
6. **Submit**: Click "Verify OTP" - this will set `otpVerified = true` in database
7. **Login**: Redirected to login page, now you can login successfully

### 2. Manual OTP Verification (For Testing)

If you want to manually set `otpVerified = true` without OTP:

**Option 1: By User ID**
```bash
curl -X PUT http://localhost:8080/api/users/{userId}/verify-otp \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option 2: By Email**
```bash
curl -X PUT "http://localhost:8080/api/users/verify-otp-by-email?email=user@example.com" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Direct Database Update (PostgreSQL)**
```sql
UPDATE app_user SET otp_verified = true WHERE email = 'user@example.com';
-- OR
UPDATE app_user SET otp_verified = true WHERE id = 'user-uuid-here';
```

### 3. Profile Picture Setup

After login, you can upload profile pictures:

1. **Upload Profile Picture**:
   - Click on your profile (top left)
   - Click the camera icon on your avatar
   - Select an image file (< 10MB)
   - Picture will be saved in `uploads/profiles/` directory

2. **View Profile Pictures**:
   - Profile pictures are accessible at: `http://localhost:8080/uploads/profiles/{filename}`
   - Pictures appear in:
     - Your profile page
     - Chat list (for other users)
     - Message page headers
     - Group chat headers (if set)

3. **Group Pictures**:
   - Create or edit a group chat
   - Upload group picture during creation or editing
   - Group pictures are saved in `uploads/groups/` directory

### 4. Test Users

You can also use the existing email-based login:
- Navigate to `/signin`
- Use existing test users from `data.sql` (if enabled)

## Common Issues

### Port Already in Use
```bash
# Backend (8080)
# Find and kill process
lsof -ti:8080 | xargs kill -9

# Frontend (3000)
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
- Verify PostgreSQL is running: `pg_isready`
- Check credentials in `application.properties`
- Ensure database `chatapp` exists

### OTP Not Working
- Check backend console for OTP code (dev mode)
- Verify phone number format
- Check OTP hasn't expired (2 minutes)

### File Upload Fails
- Ensure `uploads` directory exists: `mkdir -p uploads/profiles uploads/groups`
- Check write permissions
- Verify file size < 10MB
- Check backend console for file save errors

### Profile Picture Not Showing
- Verify file was uploaded successfully (check `uploads/profiles/` directory)
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for 404 errors on image requests
- Ensure backend is serving static files from `/uploads/**` path
- Verify image URL format: `http://localhost:8080/uploads/profiles/{filename}`

## Next Steps

1. **Integrate Real SMS Provider**
   - Update `OtpService.sendOtpSms()` method
   - Add Twilio/AWS SNS credentials

2. **Deploy to Production**
   - Update JWT secret key
   - Use environment variables
   - Enable HTTPS
   - Migrate file storage to cloud (S3/Cloudinary)

3. **Add Features**
   - Message reactions
   - File attachments
   - Voice messages
   - Video calls

## API Testing

Use Postman or curl to test endpoints:

```bash
# Generate OTP
curl -X POST http://localhost:8080/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'

# Verify OTP (check console for code)
curl -X POST http://localhost:8080/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "otpCode": "123456"}'
```

## Support

For detailed documentation, see `README.md`

