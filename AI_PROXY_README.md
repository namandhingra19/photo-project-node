# AI Microservice Proxy Configuration

## Overview
The AI proxy middleware provides secure access to the AI microservice with JWT authentication and basic auth forwarding.

## Environment Variables

Add these environment variables to your `.env` file:

```env
# AI Microservice Configuration
AI_MS_URL="http://localhost:8000"          # URL of the AI microservice
AI_MS_USERNAME="admin"                     # Username for basic auth
AI_MS_PASSWORD="password"                  # Password for basic auth
```

## How It Works

### 1. JWT Authentication
- All requests to `/api/ai/*` require a valid JWT token
- The middleware validates the JWT token using the existing authentication system
- User information is extracted from the JWT payload

### 2. Basic Auth Forwarding
- After JWT validation, the proxy adds basic authentication headers
- Uses `AI_MS_USERNAME` and `AI_MS_PASSWORD` from environment variables
- Generates `Authorization: Basic <base64-encoded-credentials>` header

### 3. User Context Headers
The proxy adds these headers to forward user context to the AI microservice:
- `X-User-ID`: User's unique identifier
- `X-User-Profile-ID`: User profile identifier
- `X-User-Email`: User's email address
- `X-User-Role`: User's role (ENTERPRISE/CLIENT)
- `X-Tenant-ID`: Tenant identifier (if applicable)

### 4. Path Rewriting
- Requests to `/api/ai/some-endpoint` are forwarded to `http://ai-ms/some-endpoint`
- The `/api/ai` prefix is removed before forwarding

## API Endpoints

### Health Check
```http
GET /api/ai/health
```
Checks if the AI microservice is responding.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "AI Microservice",
    "url": "http://localhost:8000"
  },
  "message": "AI microservice is running"
}
```

### Proxy All Other Requests
```http
GET|POST|PUT|DELETE /api/ai/*
Authorization: Bearer <jwt-token>
```

All other requests are proxied to the AI microservice with:
- JWT validation
- Basic auth headers
- User context headers
- Path rewriting

## Error Handling

### Authentication Errors
```json
{
  "success": false,
  "error": "Authentication required",
  "message": "You must be logged in to access AI services"
}
```

### Permission Errors
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "message": "You do not have permission to access AI services"
}
```

### Service Unavailable
```json
{
  "success": false,
  "error": "AI service temporarily unavailable",
  "message": "The AI microservice is currently not responding. Please try again later."
}
```

## Usage Examples

### 1. Health Check
```bash
curl http://localhost:3000/api/ai/health
```

### 2. Authenticated Request
```bash
curl -H "Authorization: Bearer <your-jwt-token>" \
     http://localhost:3000/api/ai/models
```

### 3. With Request Body
```bash
curl -X POST \
     -H "Authorization: Bearer <your-jwt-token>" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "Generate a description for this photo"}' \
     http://localhost:3000/api/ai/generate-description
```

## Security Features

1. **JWT Validation**: Ensures only authenticated users can access AI services
2. **Role-based Access**: Can be configured to restrict access based on user roles
3. **Basic Auth Forwarding**: Secures communication with the AI microservice
4. **User Context**: Provides user information to the AI microservice for personalization
5. **Error Handling**: Graceful handling of authentication and service errors

## Configuration

The proxy can be customized by modifying the middleware:

- **Target URL**: Change `AI_MS_URL` environment variable
- **Authentication**: Modify `AI_MS_USERNAME` and `AI_MS_PASSWORD`
- **Role Restrictions**: Update the `validateAIJWT` middleware
- **Headers**: Add or modify headers in the `onProxyReq` callback

## Monitoring

The proxy logs all requests and responses:
- Request forwarding: `🔄 AI Proxy: GET /api/ai/models -> http://localhost:8000/models`
- Response status: `✅ AI Proxy Response: 200 for GET /api/ai/models`
- Errors: `❌ AI Proxy Error: Connection refused`
