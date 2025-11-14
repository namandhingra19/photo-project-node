# 📸 Photo Project Enterprise App - Backend

A comprehensive Node.js backend for a photographer enterprise application with multi-tenant support, role-based access control, and secure file management.

## 🚀 Features

- **🔐 Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Google OAuth2 integration
  - Role-based access control (ENTERPRISE, CLIENT)
  - Email verification with magic links

- **🏢 Multi-Tenant Architecture**
  - Tenant isolation for enterprise users
  - Project and album management per tenant
  - Collaborative access controls

- **📁 File Management**
  - AWS S3 integration for photo storage
  - Secure file uploads with validation
  - Image processing and metadata extraction
  - Signed URLs for secure access

- **📊 Database & ORM**
  - PostgreSQL with Prisma ORM
  - Comprehensive schema with soft deletes
  - Optimized queries and relationships

- **📚 API Documentation**
  - Swagger/OpenAPI documentation
  - Interactive API explorer
  - Comprehensive endpoint documentation

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Passport.js + Google OAuth
- **File Storage**: AWS S3
- **Email**: Nodemailer
- **Documentation**: Swagger/OpenAPI
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- AWS S3 bucket
- Google OAuth credentials
- SMTP email service

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd photo-project-node
npm install
```

### 2. Environment Setup

```bash
cp env.example .env
```

Update the `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/photo_project_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="photo-project-bucket"

# Email
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **Health Check**: `http://localhost:3000/health`

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Unified login (email/password or email verification)
- `POST /api/auth/verify-email` - Email verification with role selection
- `GET /api/auth/google` - Google OAuth login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user profile

### Projects
- `POST /api/projects` - Create project
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/collaborators` - Add collaborator

### Albums
- `POST /api/albums` - Create album
- `GET /api/albums/project/:projectId` - Get albums for project
- `GET /api/albums/:id` - Get album by ID
- `PUT /api/albums/:id` - Update album
- `DELETE /api/albums/:id` - Delete album

### Photos
- `POST /api/photos/upload/:albumId` - Upload single photo
- `POST /api/photos/bulk-upload/:albumId` - Upload multiple photos
- `GET /api/photos/album/:albumId` - Get photos for album
- `GET /api/photos/:id` - Get photo by ID
- `GET /api/photos/:id/signed-url` - Get signed URL for photo
- `DELETE /api/photos/:id` - Delete photo

## 🏗️ Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Prisma client
│   ├── jwt.ts        # JWT utilities
│   ├── passport.ts   # Passport strategies
│   ├── s3.ts         # AWS S3 configuration
│   ├── email.ts      # Email service
│   └── swagger.ts    # Swagger configuration
├── controllers/      # Route controllers
│   ├── authController.ts
│   ├── projectController.ts
│   ├── albumController.ts
│   └── photoController.ts
├── middlewares/      # Express middlewares
│   ├── auth.ts       # Authentication middleware
│   ├── validation.ts # Request validation
│   └── errorHandler.ts # Error handling
├── routes/           # Express routes
│   ├── auth.ts
│   ├── projects.ts
│   ├── albums.ts
│   └── photos.ts
├── services/         # Business logic
│   └── authService.ts
├── utils/            # Utility functions
│   ├── emailTemplates.ts
│   └── helpers.ts
├── types/            # TypeScript type definitions
│   └── index.ts
└── index.ts          # Application entry point
```

## 🔐 Authentication Flow

### 1. Email/Password Login
```javascript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### 2. Email Verification (New User)
```javascript
POST /api/auth/login
{
  "email": "newuser@example.com"
}
// Response: { requiresVerification: true }
```

### 3. Google OAuth
```javascript
GET /api/auth/google
// Redirects to Google OAuth
```

## 🏢 Multi-Tenant Architecture

- **Enterprise Users**: Automatically get a tenant created
- **Client Users**: Can be invited to projects by enterprise users
- **Data Isolation**: All data is scoped to tenant_id
- **Access Control**: Role-based permissions within tenants

## 📁 File Upload Flow

1. **Validation**: File type and size validation
2. **Upload**: Direct upload to AWS S3
3. **Metadata**: Store file metadata in database
4. **Access**: Generate signed URLs for secure access

## 🛡️ Security Features

- **JWT Tokens**: Secure access and refresh tokens
- **Rate Limiting**: Prevent abuse and DDoS attacks
- **CORS**: Configured for frontend integration
- **Helmet**: Security headers
- **Input Validation**: Joi schema validation
- **File Validation**: Image type and size validation
- **Soft Deletes**: Data retention and audit trails

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production.

### Database
Run migrations in production:
```bash
npm run db:migrate
```

### Build and Start
```bash
npm run build
npm start
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@photoapp.com

---

**Built with ❤️ for photographers and their clients**




