🗳️ Online College Voting System

A secure, scalable, and modern online voting platform built using the MERN Stack
College Major Project Submission

🌟 Project Overview

The Online College Voting System is a full-stack web application designed to conduct secure, transparent, and efficient college elections.
It supports multiple user roles (Voters, Candidates, Admins), real-time election management, OTP-based verification, and interactive dashboards.

The application is developed using the MERN Stack — MongoDB, Express.js, React.js, and Node.js — and delivers a modern, responsive, and visually engaging UI using Tailwind CSS, Framer Motion, and Shadcn UI.

🚀 Technology Stack
🔧 Backend

Node.js & Express.js — RESTful API architecture

MongoDB & Mongoose — Schema-based database modeling

JWT (JSON Web Tokens) — Secure authentication and role-based authorization

Nodemailer & Twilio — Email and mobile OTP verification

PDFKit & ExcelJS — Election result export (PDF & Excel)

🎨 Frontend

React.js (Vite) — Fast and modern frontend framework

TypeScript — Type-safe and scalable development

Tailwind CSS — Utility-first responsive styling

Framer Motion — Smooth animations and transitions

Shadcn UI — Accessible and reusable UI components

Recharts — Visual representation of election data

✨ Key Features
🔐 Triple-Layer Security

JWT-based authentication

Email & mobile OTP verification

Admin approval workflow for registrations

👥 Role-Based Access Control

Voters

View active elections

Vote only once per election

Candidates

Apply for positions

Manage profile, photo, and election symbol

Admins

Create and manage elections

Approve users and candidates

Monitor real-time voting statistics

🎯 Modern UI/UX

Animated page transitions

Confetti animation on successful voting

Live election countdown timers

Dark & Light mode support

🛠️ Administrative Capabilities

Election and position management

Result export in PDF and Excel formats

Real-time analytics dashboard

📂 Project Structure
online-college-voting/
├── backend/                # Express.js Server
│   ├── src/
│   │   ├── config/         # Database & environment configuration
│   │   ├── controllers/    # Business logic (Auth, Admin, Voting)
│   │   ├── models/         # Mongoose schemas (User, Election, Vote)
│   │   ├── routes/         # REST API endpoints
│   │   └── services/       # OTP, Email, Export services
│   └── uploads/            # Uploaded images
│
└── frontend/               # React Client
    ├── src/
    │   ├── components/     # Reusable UI components
    │   ├── pages/          # Application pages
    │   ├── context/        # Global state management
    │   └── lib/            # API utilities and helpers

🛠️ Installation & Setup
📌 Prerequisites

Node.js (v16 or later)

MongoDB (Local or MongoDB Atlas)

🔧 Backend Setup
cd backend

npm install

cp .env.example .env
# Update MongoDB URI and credentials in .env

# Optional: Seed Super Admin
npm run seed:admin

npm run dev


➡️ Backend runs on http://localhost:5000

🎨 Frontend Setup
cd frontend

npm install

cp .env.example .env

npm run dev


➡️ Frontend runs on http://localhost:5173

🔁 Application Workflow
👤 User Registration Flow

User submits registration form

System sends OTP to email and mobile

User verifies OTPs

Account marked as Verified (Pending Admin Approval)

Admin approves the account

User gains access to voting features

🗳️ Voting Process

Voter logs in

Views active elections

Selects candidates and submits vote

System validates:

Election is active

User has not voted before

Vote stored securely and anonymously

UI displays success animation

🧠 Viva / Interview Q&A

Q1: Why did you choose the MERN stack?
A: MERN provides a unified JavaScript ecosystem, supports scalability, and enables seamless frontend-backend communication using JSON.

Q2: How do you ensure one user votes only once?
A: A unique compound index on { electionId, userId } prevents duplicate votes at the database level.

Q3: How is OTP security handled?
A: OTPs are hashed using bcrypt before storage, ensuring they cannot be read even by database administrators.

Q4: What role does JWT play in the project?
A: JWT enables stateless authentication, reducing server overhead while maintaining secure user sessions.

Q5: How does the election timer function?
A: The backend enforces voting deadlines using timestamps, while the frontend displays a live countdown.

☁️ Deployment Guide
🗄️ MongoDB Atlas

Create a MongoDB cluster

Configure network access

Copy the connection URI

Add it to backend .env

🚀 Backend Deployment (Render)

Root Directory: backend

Build Command: npm install

Start Command: npm start

Add environment variables from .env

🌐 Frontend Deployment (Vercel / Netlify / Render)

Root Directory: frontend

Build Command: npm run build

Output Directory: dist

Set VITE_API_BASE_URL to backend URL

❤️ Final Note

This project demonstrates secure system design, role-based access control, real-time interactions, and modern UI/UX practices, making it ideal for a College Major Project and real-world deployment.