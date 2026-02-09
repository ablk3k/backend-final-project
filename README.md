KaRima restaurant API 
WEB Technologies 2 – Final project
Teacher: Samat Tankeyev 
Made by: Alpamys Abylaikhan 
Project “KaRima” is a secure RESTful backend API built with Node.js, Express, MongoDB (Atlas), and Mongoose using a professional MVC (Model–View–Controller) architecture. 
It implements: 
- Modular MVC structure 
- Two related objects with full CRUD 
- Authentication with JWT 
- Password hashing with bcrypt 
- Role-Based Access Control (RBAC) 
- Public + Protected + Admin routes 
Project Architecture (MVC) 
The project is structured using the MVC pattern for scalability and maintainability.  
# KaRima API 
This repository provides the backend API for the KaRima restaurant web app. The API implements authentication, menu management and reservations using Node.js, Express and MongoDB (Mongoose). 
Quick status: runs with Node.js + Express and uses a MongoDB connection from `./config/db.js`. 
Requirements: 
- Node: v14+ 
- MongoDB: running instance or connection string in environment 
Setup & Run 
- Install dependencies: 
npm install 
- Environment: copy .env (not included) and set: 
- PORT (optional, default 5000) 
- MONGO_URI (MongoDB connection string) 
- JWT_SECRET (for auth tokens) 
- any mailer settings used by utils/mailer.js 
Start server: 
npm start 
API Base: /api 
Endpoints
- Auth (/api/auth) 
- POST /register — register a new user (body: `name`, `email`, `password`) 
- POST /login — login and receive a JWT (body: `email`, `password`) 
- GET /verify?token=... — verify email token (used by verify workflow) 
- Menu (`/api/menu`) 
- GET / — list menu items 
- GET /:id — get menu item by id 
- POST / — create menu item (protected; see `middleware/auth.js`) 
- PUT /:id — update menu item (protected) 
- DELETE /:id — delete menu item (protected) 
Authentication & Security 
- Passwords are hashed with `bcrypt`. 
- Authentication uses JWT — include the token in the `Authorization` header: 
Role-Based Access Control (RBAC) 
- `POST`, `PUT`, `DELETE` endpoints are restricted to admin users where applicable; `GET` endpoints are public or protected depending on the route. 
Error handling
- The app uses `middleware/errorHandler.js` and returns JSON errors with an `error` message and status code. 
Development notes 
- Static frontend is served from the `public/` folder. 
- Routes are wired in `app.js` with the `routes/` files. 
      
  
     
  
