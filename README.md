# WhatsApp-Style Chat Application

A complete full-stack messaging application with OTP-based registration, real-time chat, group chats, and profile management.

## Features

### 🔐 Authentication & Registration
- **OTP-based Registration**: Phone number verification with 6-digit OTP
- **JWT Authentication**: Secure token-based authentication
- **Refresh Tokens**: Long-lived refresh tokens for seamless sessions
- **Profile Setup**: Upload profile picture, set display name, and bio

### 💬 Messaging
- **Real-time Chat**: WebSocket-based instant messaging
- **One-to-One Chat**: Private conversations
- **Group Chat**: Multi-user group conversations
- **Group Management**: 
  - Group profile pictures
  - Group descriptions
  - Admin controls (add/remove users, rename groups)

### 👥 User Features
- **Online/Offline Status**: Real-time presence indicators
- **Typing Indicators**: See when someone is typing
- **Profile Pictures**: Upload and manage profile images
- **User Search**: Find users by name or email

## Tech Stack

### Backend
- **Java 17** with **Spring Boot 3.2.3**
- **PostgreSQL** database
- **Spring WebSocket** for real-time messaging
- **JWT** for authentication
- **Spring Security** for authorization
- **Maven** for dependency management

### Frontend
- **React 18** with **TypeScript**
- **Redux Toolkit** for state management
- **Material-UI** for components
- **SockJS/STOMP** for WebSocket communication
- **SCSS Modules** for styling

## Project Structure

```
chat-app-main/
├── backend/
│   ├── src/main/java/com/nicolas/chatapp/
│   │   ├── config/          # Security, JWT, WebSocket configs
│   │   ├── controllers/     # REST & WebSocket controllers
│   │   ├── dto/             # Data Transfer Objects
│   │   ├── exception/       # Custom exceptions
│   │   ├── model/           # Entity models (User, Chat, Message, OTP)
│   │   ├── repository/      # JPA repositories
│   │   └── service/         # Business logic
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/
    ├── src/
    │   ├── components/      # React components
    │   │   ├── otp/         # OTP registration
    │   │   ├── profile/     # Profile setup
    │   │   ├── chatCard/    # Chat list items
    │   │   ├── messagePage/ # Chat screen
    │   │   └── ...
    │   ├── redux/           # State management
    │   └── config/          # Configuration
    └── package.json
```

## Installation & Setup

### Prerequisites
- **Java 17+**
- **Node.js 16+** and **npm**
- **PostgreSQL 12+**
- **Maven 3.6+**

### Backend Setup

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Configure PostgreSQL**
   - Create a database named `chatapp`
   - Update `application.properties` with your database credentials:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/chatapp
   spring.datasource.username=your_username
   spring.datasource.password=your_password
   ```

3. **Build and run**
   ```bash
   mvn clean install
   mvn spring-boot:run
   ```
   Backend will run on `http://localhost:8080`

4. **Create uploads directory**
   ```bash
   mkdir uploads
   mkdir uploads/profiles
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL** (if different)
   - Update `src/config/Config.ts`:
   ```typescript
   export const BASE_API_URL = "http://localhost:8080";
   ```

4. **Start development server**
   ```bash
   npm start
   ```
   Frontend will run on `http://localhost:3000`

## Environment Variables

### Backend (`application.properties`)
```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/chatapp
spring.datasource.username=postgres
spring.datasource.password=your_password

# File Upload
file.upload-dir=uploads
spring.servlet.multipart.max-file-size=10MB

# JWT (Update in production!)
jwt.secret=your-secret-key-here
```

### Frontend
No environment variables needed. Update `Config.ts` for API URL changes.

## API Endpoints

### Authentication
- `POST /api/otp/generate` - Generate OTP for phone number
- `POST /api/otp/verify` - Verify OTP code
- `POST /api/otp/resend` - Resend OTP
- `POST /auth/signup/otp` - Register with OTP
- `POST /auth/login/otp` - Login with OTP
- `POST /auth/refresh` - Refresh access token

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile (name, bio)
- `POST /api/profile/picture` - Upload profile picture
- `DELETE /api/profile/picture` - Delete profile picture

### Chats
- `GET /api/chats/user` - Get all user chats
- `POST /api/chats/single` - Create single chat
- `POST /api/chats/group` - Create group chat
- `PUT /api/chats/{chatId}/add/{userId}` - Add user to group
- `PUT /api/chats/{chatId}/remove/{userId}` - Remove user from group
- `PUT /api/chats/{chatId}/markAsRead` - Mark chat as read

### Messages
- `GET /api/messages/chat/{chatId}` - Get messages for chat
- `POST /api/messages` - Send message

### WebSocket Endpoints
- `/ws` - WebSocket connection endpoint
- `/app/messages` - Send message
- `/app/typing` - Send typing indicator
- `/app/online` - Update online status
- `/topic/{userId}` - Receive messages/events

## Testing OTP Flow

### Development Mode
The OTP is currently logged to console. In production, integrate with SMS providers like:
- **Twilio**
- **AWS SNS**
- **Cloudinary SMS**

### Test Flow
1. Navigate to `/otp-register`
2. Enter phone number (e.g., `+1234567890`)
3. Click "Send OTP"
4. Check backend console for OTP code
5. Enter OTP code
6. Complete profile setup
7. Start chatting!

## Database Schema

### Tables
- **APP_USER**: User accounts
  - `id`, `email`, `phone_number`, `full_name`, `bio`, `profile_picture`, `is_online`, `last_seen`
  
- **OTP**: OTP verification codes
  - `id`, `phone_number`, `otp_code`, `created_at`, `expires_at`, `is_verified`, `attempt_count`
  
- **CHAT**: Chat conversations
  - `id`, `chat_name`, `is_group`, `group_profile_picture`, `group_description`, `created_by_id`
  
- **MESSAGE**: Chat messages
  - `id`, `content`, `time_stamp`, `user_id`, `chat_id`, `read_by`
  
- **CHAT_ADMINS**: Group chat administrators (Many-to-Many)
- **CHAT_USERS**: Chat participants (Many-to-Many)

## Production Considerations

### Security
- [ ] Change JWT secret key
- [ ] Use HTTPS
- [ ] Implement rate limiting for OTP
- [ ] Add input validation
- [ ] Use environment variables for secrets

### File Storage
- [ ] Migrate to cloud storage (AWS S3, Cloudinary)
- [ ] Implement image compression
- [ ] Add CDN for faster delivery

### SMS Integration
- [ ] Integrate real SMS provider (Twilio/AWS SNS)
- [ ] Implement SMS templates
- [ ] Add delivery tracking

### Performance
- [ ] Add Redis for caching
- [ ] Implement message pagination
- [ ] Optimize database queries
- [ ] Add connection pooling

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials
- Check port 8080 is available

### OTP not received
- Check backend console logs
- Verify phone number format
- Check OTP expiry (2 minutes)

### WebSocket connection fails
- Verify CORS settings
- Check WebSocket endpoint URL
- Ensure JWT token is valid

### File upload fails
- Check `uploads` directory exists
- Verify file size limits
- Check file permissions

## License

This project is open source and available for educational purposes.

## Support

For issues and questions, please open an issue on the repository.
