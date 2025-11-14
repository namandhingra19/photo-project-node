# 📮 Photo Project API - Postman Collection

Complete Postman collection for testing all Photo Project Enterprise App Backend APIs.

## 📁 Files Included

- `Photo_Project_API.postman_collection.json` - Complete API collection
- `Photo_Project_Environment.postman_environment.json` - Environment variables
- `POSTMAN_README.md` - This documentation

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Photo_Project_API.postman_collection.json`
4. Click **Import**

### 2. Import Environment
1. Click **Import** button again
2. Select `Photo_Project_Environment.postman_environment.json`
3. Click **Import**
4. Select the **Photo Project Environment** from the environment dropdown

### 3. Start the Server
```bash
npm run dev
```

### 4. Test the APIs
1. Start with **Health & Info** folder
2. Test **Authentication** endpoints
3. Use the returned tokens for authenticated requests

## 📋 Collection Structure

### 🏥 Health & Info
- **Health Check** - `GET /health`
- **Root Endpoint** - `GET /`
- **API Documentation** - `GET /api-docs/`

### 🔐 Authentication
- **Check Email** - `POST /api/auth/check-email` ⭐ **NEW**
- **Login (Email/Password)** - `POST /api/auth/login`
- **Login (Email Only)** - `POST /api/auth/login`
- **Verify Email** - `POST /api/auth/verify-email`
- **Google OAuth Login** - `GET /api/auth/google`
- **Google OAuth Role Selection** - `POST /api/auth/google/role-selection`
- **Refresh Token** - `POST /api/auth/refresh`
- **Logout** - `POST /api/auth/logout`
- **Get Profile** - `GET /api/auth/profile`

### 📸 Projects
- **Create Project** - `POST /api/projects`
- **Get All Projects** - `GET /api/projects`
- **Get Project by ID** - `GET /api/projects/{id}`
- **Update Project** - `PUT /api/projects/{id}`
- **Delete Project** - `DELETE /api/projects/{id}`
- **Add Collaborator** - `POST /api/projects/{id}/collaborators`

### 🗂️ Albums
- **Create Album** - `POST /api/albums`
- **Get Albums for Project** - `GET /api/albums/project/{project_id}`
- **Get Album by ID** - `GET /api/albums/{id}`
- **Update Album** - `PUT /api/albums/{id}`
- **Delete Album** - `DELETE /api/albums/{id}`

### 📷 Photos
- **Upload Single Photo** - `POST /api/photos/upload/{album_id}`
- **Bulk Upload Photos** - `POST /api/photos/bulk-upload/{album_id}`
- **Get Photos for Album** - `GET /api/photos/album/{album_id}`
- **Get Photo by ID** - `GET /api/photos/{id}`
- **Get Signed URL** - `GET /api/photos/{id}/signed-url`
- **Delete Photo** - `DELETE /api/photos/{id}`

## 🔧 Environment Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `base_url` | API base URL | `http://localhost:3000` |
| `access_token` | JWT access token | Auto-populated after login |
| `refresh_token` | JWT refresh token | Auto-populated after login |
| `user_id` | Current user ID | Auto-populated after login |
| `user_profile_id` | User profile ID | Auto-populated after login |
| `tenant_id` | Tenant ID | Auto-populated after login |
| `project_id` | Current project ID | Set manually or from responses |
| `album_id` | Current album ID | Set manually or from responses |
| `photo_id` | Current photo ID | Set manually or from responses |
| `test_email` | Test email address | `test@example.com` |
| `test_password` | Test password | `password123` |
| `test_name` | Test user name | `Test User` |
| `test_role` | Test user role | `ENTERPRISE` or `CLIENT` |

## 🔄 Testing Workflow

### 1. **Health Check**
```
GET /health
```
Verify the server is running.

### 2. **Authentication Flow**

#### **Step 1: Check Email (NEW - Recommended First Step)**
```
POST /api/auth/check-email
{
  "email": "user@example.com"
}
```

**Response if user exists:**
```json
{
  "success": true,
  "message": "User found. Password required for login.",
  "data": {
    "userExists": true,
    "requiresPassword": true,
    "user": {
      "email": "user@example.com",
      "name": "John Doe",
      "is_verified": true
    }
  }
}
```

**Response if user doesn't exist:**
```json
{
  "success": true,
  "message": "Verification email sent. Please check your inbox.",
  "data": {
    "userExists": false,
    "requiresVerification": true,
    "verificationToken": "uuid-token",
    "message": "User not found. Verification email sent."
  }
}
```

#### **Step 2A: Login with Password (if user exists)**
```
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### **Step 2B: Complete Registration (if user doesn't exist)**
```
POST /api/auth/verify-email
{
  "email": "newuser@example.com",
  "name": "New User",
  "role": "ENTERPRISE",
  "verificationToken": "token-from-email",
  "password": "password123"
}
```

#### **Alternative: Direct Login (Legacy)**
```
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

### 3. **Create Project**
```
POST /api/projects
{
  "title": "Wedding Photography - Smith & Johnson",
  "description": "Beautiful outdoor wedding ceremony and reception photography",
  "event_date": "2024-06-15T14:00:00Z"
}
```

### 4. **Create Album**
```
POST /api/albums
{
  "project_id": "{{project_id}}",
  "title": "Ceremony Photos",
  "description": "Wedding ceremony photos",
  "cover_image": "https://example.com/cover.jpg"
}
```

### 5. **Upload Photos**
```
POST /api/photos/upload/{{album_id}}
Form Data:
- photo: [Select image file]
```

### 6. **View Results**
```
GET /api/projects/{{project_id}}
GET /api/albums/project/{{project_id}}
GET /api/photos/album/{{album_id}}
```

## 🛠️ Advanced Features

### **Auto-Token Management**
The collection includes scripts to automatically:
- Extract tokens from login responses
- Set tokens in environment variables
- Use tokens in subsequent requests

### **Dynamic Variables**
- `{{base_url}}` - API base URL
- `{{access_token}}` - Current access token
- `{{project_id}}` - Current project ID
- `{{album_id}}` - Current album ID
- `{{photo_id}}` - Current photo ID

### **Error Handling**
All requests include proper error handling and validation.

### **File Upload Testing**
- Single photo upload
- Bulk photo upload
- File type validation
- Size limit testing

## 🔍 Testing Scenarios

### **Authentication Scenarios**
1. ✅ Valid login with existing user
2. ✅ New user registration flow
3. ✅ Google OAuth flow
4. ✅ Token refresh
5. ✅ Logout and token invalidation
6. ❌ Invalid credentials
7. ❌ Expired tokens

### **Project Management Scenarios**
1. ✅ Create project
2. ✅ List projects with pagination
3. ✅ Update project details
4. ✅ Add collaborators
5. ✅ Delete project
6. ❌ Access unauthorized project

### **Photo Management Scenarios**
1. ✅ Upload single photo
2. ✅ Bulk upload photos
3. ✅ List photos with pagination
4. ✅ Get signed URLs
5. ✅ Delete photos
6. ❌ Upload invalid file types
7. ❌ Upload oversized files

## 📊 Response Examples

### **Successful Login Response**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "user_id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "is_verified": true
    },
    "userProfile": {
      "user_profile_id": "uuid",
      "role": "ENTERPRISE",
      "name": "John Doe",
      "tenant_id": "uuid"
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### **Error Response**
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "status": 400,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/auth/login",
    "method": "POST",
    "context": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

## 🚨 Common Issues

### **Server Not Running**
- Ensure `npm run dev` is running
- Check if port 3000 is available
- Verify no other services are using the port

### **Authentication Errors**
- Check if JWT_SECRET is configured
- Verify database connection
- Ensure user exists in database

### **File Upload Issues**
- Check S3 configuration
- Verify file size limits (10MB)
- Ensure file type is image

### **Database Errors**
- Run `npm run db:migrate`
- Check DATABASE_URL configuration
- Verify PostgreSQL is running

## 📚 Additional Resources

- **API Documentation**: `http://localhost:3000/api-docs/`
- **Health Check**: `http://localhost:3000/health`
- **Project Repository**: Check the main README.md
- **Database Schema**: See `prisma/schema.prisma`

## 🎯 Next Steps

1. **Import the collection** into Postman
2. **Set up the environment** variables
3. **Start the server** with `npm run dev`
4. **Test the health endpoint** first
5. **Follow the authentication flow**
6. **Create projects and albums**
7. **Upload and manage photos**

---

**Happy Testing! 🚀**

This collection provides comprehensive coverage of all Photo Project API endpoints with proper error handling and dynamic variable management.

