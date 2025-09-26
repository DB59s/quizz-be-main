# User Service API

A comprehensive User Service API built with Node.js, Express.js, and MongoDB using Mongoose. This service manages three types of users: Students, Teachers, and Admins, each stored in separate collections with specific schemas.

## Features

- **Multi-role User Management**: Support for students, teachers, and admins
- **Separate Collections**: Each user type stored in dedicated MongoDB collections
- **Search Functionality**: Advanced search capabilities for each user type
- **RESTful API**: Standard REST endpoints with consistent JSON responses
- **Error Handling**: Comprehensive error handling with standardized responses
- **Validation**: Mongoose schema validation for data integrity
- **Pagination**: Built-in pagination support for list endpoints

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Architecture**: Clean architecture with separation of concerns (Controllers, Services, Models, Routes)

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── cors.js       # CORS configuration
│   ├── database.js   # MongoDB connection
│   ├── env.js        # Environment variables
│   └── index.js      # Config exports
├── controller/       # HTTP request handlers
│   ├── userController.js
│   ├── studentController.js
│   ├── teacherController.js
│   ├── adminController.js
│   └── index.js
├── middleware/       # Custom middlewares
│   └── errorHandler.js
├── model/           # Mongoose schemas and models
│   ├── Student.js
│   ├── Teacher.js
│   ├── Admin.js
│   └── User.js
├── router/          # Route definitions
│   ├── userRouter.js
│   ├── studentRouter.js
│   ├── teacherRouter.js
│   ├── adminRouter.js
│   └── index.js
├── service/         # Business logic layer
│   ├── userService.js
│   ├── studentService.js
│   ├── teacherService.js
│   ├── adminService.js
│   └── index.js
├── app.js           # Express app configuration
└── server.js        # Server startup
```

## Installation & Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd user-service-api
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp env.example .env
```

4. **Update .env file with your MongoDB URI**
```env
NODE_ENV=development
PORT=3000
MONGO_URI=mongodb+srv://vuduy050903_db_user:3qHHYv2yylxfhHyg@cluster0.icn9gah.mongodb.net/user_service?retryWrites=true&w=majority&appName=Cluster0
API_PREFIX=/api/v1
```

5. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Database Schema

### Student Schema
```javascript
{
  account_id: String (required, unique),
  full_name: String (required),
  student_code: String (required, unique),
  class_name: String (required),
  phone_number: String (optional),
  created_at: Date,
  updated_at: Date
}
```

### Teacher Schema
```javascript
{
  account_id: String (required, unique),
  full_name: String (required),
  teacher_code: String (required, unique),
  department: String (required),
  phone_number: String (optional),
  created_at: Date,
  updated_at: Date
}
```

### Admin Schema
```javascript
{
  account_id: String (required, unique),
  full_name: String (required),
  phone_number: String (optional),
  created_at: Date,
  updated_at: Date
}
```

## API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### User Management (Gateway Endpoints)

#### Create User
```http
POST /users
```
**Description**: Creates a user based on role (called by gateway)

**Request Body**:
```json
{
  "role": "student|teacher|admin",
  "account_id": "auth_service_account_id",
  "full_name": "User Full Name"
}
```

**Student Example**:
```json
{
  "role": "student",
  "account_id": "auth_123",
  "full_name": "Nguyen Van A",
  "student_code": "SV001",
  "class_name": "CNTT01",
  "phone_number": "0123456789"
}
```

#### Get User by Account ID and Role
```http
GET /users/:accountId/:role
```

### Student Endpoints

#### Get All Students (with search)
```http
GET /students?search=query&class_name=CNTT01&page=1&limit=10
```

#### Get Student by ID
```http
GET /students/:id
```

#### Update Student
```http
PUT /students/:id
```

#### Delete Student
```http
DELETE /students/:id
```

### Teacher Endpoints

#### Get All Teachers (with search)
```http
GET /teachers?search=query&department=Computer%20Science&page=1&limit=10
```

#### Get Teacher by ID
```http
GET /teachers/:id
```

#### Update Teacher
```http
PUT /teachers/:id
```

#### Delete Teacher
```http
DELETE /teachers/:id
```

### Admin Endpoints

#### Get All Admins (with search)
```http
GET /admins?search=query&page=1&limit=10
```

#### Get Admin by ID
```http
GET /admins/:id
```

#### Update Admin
```http
PUT /admins/:id
```

#### Delete Admin
```http
DELETE /admins/:id
```

### Health Check
```http
GET /health
```

## Response Format

All endpoints return responses in the following format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "students": [],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10
    }
  }
}
```

## Development

### Available Scripts
```bash
npm run dev     # Start development server with nodemon
npm start       # Start production server
```

### Environment Variables
- `NODE_ENV`: Application environment (development/production)
- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `API_PREFIX`: API route prefix (default: /api/v1)

## Integration with Gateway

This service is designed to work with an API Gateway that handles:
- Authentication & Authorization
- Rate limiting
- Request routing

The gateway should forward requests to this service with appropriate role information.

## License

ISC
