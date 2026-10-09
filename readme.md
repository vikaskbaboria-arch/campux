# Campux 🎓

**A college-based marketplace for students.**

Campux is a MERN stack web application that allows college students to buy, sell, and discover items within their college community. It provides a platform for students to create listings, upload product images, and make offers.

## ✨ Features

- 🔐 User authentication with JWT
- 🏫 College-based student community
- 📦 Create, view, and manage product listings
- 🔍 Search and filter listings
- 💰 Make offers on listed products
- 👤 User profiles and college information
- ✅ College verification system
- 💬 Messaging between users 

## 🛠️ Tech Stack

- **Frontend:** React, Vite
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT
- **Image Storage:** Cloudinary
- **API Testing:** Postman

## 📁 Project Structure

```text
campux/
├── frontend/
└── backend/
    ├── controllers/
    ├── models/
    ├── routes/
    ├── middleware/
    ├── utils/
    ├── database/
    ├── scripts/
    ├── app.js
    └── server.js
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/vikaskbaboria-arch/campux
cd campux
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend using your configured start script:

```bash
npm run dev
```

### 3. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

## 🎯 Project Goal

To make buying and selling within college communities easier, safer, and more convenient by connecting students through a dedicated campus marketplace.

## 👨‍💻 Author

**Vikas Baboria**

