# User API - Curl Commands

## Base URL
```
http://localhost:3001/api/v1/users
```

## Authentication
All user endpoints require authentication. First, you need to login to get a token:

```bash
# Login to get authentication token
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "admin123456"
  }'
```

Save the returned token and use it in the Authorization header for all subsequent requests.

## User Endpoints

### 1. List Users
**GET** `/api/v1/users`

```bash
# Get all users (admin sees all, others see only active users)
curl -X GET http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Admin can filter by status
curl -X GET "http://localhost:3001/api/v1/users?status=active" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

curl -X GET "http://localhost:3001/api/v1/users?status=inactive" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 2. Get User by ID
**GET** `/api/v1/users/:id`

```bash
# Get specific user by ID (example with María's ID)
curl -X GET http://localhost:3001/api/v1/users/68c7267a9ec44dddb61bf382 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Update User
**PUT** `/api/v1/users/:id`

```bash
# Update user profile (users can update themselves, admin can update anyone)
curl -X PUT http://localhost:3001/api/v1/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Updated Name",
    "email": "newemail@example.com",
    "phone": "+1234567890"
  }'

# Admin updating user role
curl -X PUT http://localhost:3001/api/v1/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE" \
  -d '{
    "name": "John Doe",
    "role": "supervisor",
    "department": "Operations"
  }'

# Update password
curl -X PUT http://localhost:3001/api/v1/users/USER_ID_HERE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "password": "newpassword123"
  }'
```

### 4. Toggle User Status (Admin Only)
**PATCH** `/api/v1/users/:id/status`

```bash
# Activate/deactivate user (admin only)
curl -X PATCH http://localhost:3001/api/v1/users/USER_ID_HERE/status \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

### 5. Delete User (Admin Only)
**DELETE** `/api/v1/users/:id`

```bash
# Delete user (admin only)
curl -X DELETE http://localhost:3001/api/v1/users/USER_ID_HERE \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN_HERE"
```

## Example Workflow

### Step 1: Login as Admin
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@empresa.com",
    "password": "admin123456"
  }'
```

### Step 2: Get All Users
```bash
curl -X GET http://localhost:3001/api/v1/users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 3: Get Specific User
```bash
curl -X GET http://localhost:3001/api/v1/users/60d5ec49f1b2c8b1f8e4c8d1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Step 4: Update User
```bash
curl -X PUT http://localhost:3001/api/v1/users/60d5ec49f1b2c8b1f8e4c8d1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Updated User Name",
    "email": "updated@example.com"
  }'
```

### Step 5: Toggle User Status
```bash
curl -X PATCH http://localhost:3001/api/v1/users/60d5ec49f1b2c8b1f8e4c8d1/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Response Examples

### Successful Login Response
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d5ec49f1b2c8b1f8e4c8d1",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "administrador",
    "isActive": true
  }
}
```

### List Users Response
```json
[
  {
    "_id": "60d5ec49f1b2c8b1f8e4c8d1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "reviewer",
    "department": "Quality Control",
    "isActive": true,
    "createdAt": "2023-06-25T10:30:00.000Z"
  },
  {
    "_id": "60d5ec49f1b2c8b1f8e4c8d2",
    "name": "Jane Smith",
    "email": "jane@example.com",
    "role": "supervisor",
    "department": "Operations",
    "isActive": true,
    "createdAt": "2023-06-25T11:00:00.000Z"
  }
]
```

### Error Response
```json
{
  "error": "User not found"
}
```

## Notes

1. **Authentication Required**: All endpoints require a valid JWT token
2. **Admin Privileges**: Only admins can delete users, toggle status, and update user roles
3. **Self-Update**: Regular users can only update their own profiles
4. **Password Security**: Passwords are hashed with bcrypt (12 salt rounds)
5. **Active Users Only**: Non-admin users can only see active users
6. **Last Admin Protection**: Cannot delete or deactivate the last administrator

## Testing Tips

1. Replace `YOUR_TOKEN_HERE` with actual JWT token from login
2. Replace `USER_ID_HERE` with actual MongoDB ObjectId
3. Use `-v` flag with curl for verbose output: `curl -v ...`
4. Use `jq` to format JSON responses: `curl ... | jq`
5. Save tokens in environment variable: `export TOKEN="your_token_here"`