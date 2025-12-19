# Online College Voting System 🗳️

> A generic, secure, and modern voting platform built with the MERN Stack.
> **College Major Project Submission**

## 🌟 Project Overview

This **Online College Voting System** is a full-stack web application designed to facilitate secure, transparent, and efficient campus elections. It supports multiple roles (Voters, Candidates, Admins), real-time election timers, OTP-based verification, and interactive dashboards.

The project is built using the **MERN Stack** (MongoDB, Express.js, React.js, Node.js) and features a "WOW" level UI using **Tailwind CSS**, **Framer Motion**, and **Shadcn UI**.

---

## 🚀 Tech Stack

### Backend
- **Node.js** & **Express.js**: REST API architecture.
- **MongoDB** & **Mongoose**: Database modeling with relationships.
- **JWT**: Secure authentication & role-based access control.
- **Nodemailer** & **Twilio**: OTP services for Email and Mobile verification.
- **PDFKit** & **ExcelJS**: Automated result export generation.

### Frontend
- **React.js (Vite)**: Fast, modern client-side framework.
- **TypeScript**: Type-safe development.
- **Tailwind CSS**: Utility-first styling.
- **Framer Motion**: Smooth animations and micro-interactions.
- **Shadcn UI**: Accessible and reusable UI components.
- **Recharts**: Data visualization for election results.

---

## ✨ Key Features

1.  **Triple-Layer Security**:
    - JWT for session management.
    - Email & Mobile OTP for identity verification.
    - Admin approval workflow for all registrations.

2.  **Role-Based Access**:
    - **Voters**: Vote once per election, view active elections.
    - **Candidates**: Apply for positions, manage profiles (photo/symbol).
    - **Admins**: Manage elections, approve users, view analytics.

3.  **Modern UX/UI**:
    - Animated transitions between pages.
    - Confetti celebration on successful voting.
    - Live countdown timers for elections.
    - Dark/Light mode support.

4.  **Administrative Power**:
    - Create/Edit elections and positions.
    - Export results to PDF/Excel.
    - Monitor real-time voting stats.

---

## 📂 Project Structure

The project follows a Monorepo-style structure:

```
online-college-voting/
├── backend/            # Express.js Server
│   ├── src/
│   │   ├── config/     # DB & Env setup
│   │   ├── controllers/# Logic for Auth, Admin, Votes
│   │   ├── models/     # Mongoose Schemas (User, Election, Vote)
│   │   ├── routes/     # API Endpoints
│   │   └── services/   # OTP, Email, Export services
│   └── uploads/        # Stored images
│
└── frontend/           # React Client
    ├── src/
    │   ├── components/ # Reusable UI & Layouts
    │   ├── pages/      # Route pages (Login, Dashboard)
    │   ├── context/    # Auth state management
    │   └── lib/        # API client & utils
```

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# (Update .env with your MongoDB URI and Credentials)

# Seed Super Admin (Optional but recommended)
# Update seedAdmin.js env vars in .env first!
npm run seed:admin

# Start Server
npm run dev
```

*Backend runs on `http://localhost:5000` by default.*

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start Client
npm run dev
```

*Frontend runs on `http://localhost:5173` by default.*

---

## 📊 Logic Flow Diagrams

### User Registration Flow
1. **User** fills registration form (Student ID, Dept, Email, Mobile).
2. **System** generates OTPs for Email and Mobile.
3. **User** enters OTPs to verify contact info.
4. **System** marks account as "Verified" but "Pending Approval".
5. **Admin** reviews details and clicks "Approve".
6. **User** can now log in and vote.

### Voting Process
1. **Voter** logs in -> Sees "Active Elections".
2. **Voter** clicks "Vote Now" -> Sees ballot with candidates.
3. **Voter** selects candidates -> Confirms choice.
4. **System** checks:
   - Is election active?
   - Has user already voted?
5. **System** records vote anonymously -> Updates Candidate count.
6. **UI** shows Success Animation + Confetti.

---

## 🧠 Viva Questions & Answers

**Q1: Why did you choose the MERN stack?**
*A1: It allows using JavaScript across the entire stack (Node.js for backend, React for frontend), unified JSON data structure (MongoDB), and is highly scalable for real-time applications.*

**Q2: How do you ensure a student votes only once?**
*A2: We use a `Vote` collection in MongoDB with a unique compound index on `{ electionId: 1, userId: 1 }`. If a user tries to vote again, the database throws a duplicate key error, which the backend handles.*

**Q3: How is the OTP secured?**
*A3: OTPs are hashed using `bcrypt` before storing in the database. We compare the hash of the user-entered OTP with the stored hash. This prevents DB admins from seeing valid OTPs.*

**Q4: What is the purpose of JWT?**
*A4: JSON Web Tokens are used for stateless authentication. The server signs a token with a secret key, and the client sends it in the header. This avoids storing session data on the server.*

**Q5: How does the election timer work?**
*A5: The `Election` model has an `endsAt` timestamp. The backend rejects any vote requests received after this time. The frontend uses `setInterval` to calculate the remaining time for display.*

---

## ☁️ Deployment Guide

### 1. Database (MongoDB Atlas)
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Whitelist `0.0.0.0/0` (for public access) or your server IP.
3. Get the Connection String (URI).

### 2. Backend (Render.com)
1. Create a **Web Service** on Render connected to your repo.
2. Root Directory: `backend`.
3. Build Command: `npm install`.
4. Start Command: `npm start`.
5. Add Environment Variables from your `.env`.

### 3. Frontend (Render / Vercel / Netlify)
1. Create a **Static Site** (or Web Service).
2. Root Directory: `frontend`.
3. Build Command: `npm run build`.
4. Publish Directory: `dist`.
5. Set `VITE_API_BASE_URL` to your deployed Backend URL.

---

**Built with ❤️ for the College Major Project.**
