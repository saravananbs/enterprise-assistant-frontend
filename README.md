# E-Pilot – Frontend

E-Pilot is an enterprise AI assistant platform that intelligently routes user queries into different processing pipelines such as:

Email Drafting & Routing
Policy Question Answering (Advanced RAG)
Personal Assistant with Tool Calling
Intelligent Intent Classification

This repository contains the React-based frontend application that interacts with the E-Pilot backend graph engine.

# Project Overview

The E-Pilot Frontend provides:

Conversational Chat UI
Email draft review & action selection (accept / reject / edit)
Policy-based Q&A display
Tool invocation result rendering
Real-time interaction with backend state graph

The frontend communicates with the backend that uses a StateGraph-based orchestration engine to dynamically route requests.

# Architecture Overview

User → React Frontend → Backend API → LangGraph StateGraph Engine → LLM / RAG / Tools → Response → Frontend


# Backend Flow (High Level)

1.User sends message

2.Backend classifies intent:
- policy_graph
- email_graph
- personal_graph
- others

Corresponding graph processes the request
Response returned to frontend

# Tech Stack

- React
- Node.js
- Fetch / Axios (API communication)
- Modern CSS / Tailwind (if applicable)
- Backend: FastAPI + LangGraph + LLMs

# Project Structure

src/
 ├── components/
 │    ├── ChatWindow.jsx
 │    ├── MessageBubble.jsx
 │    ├── EmailReviewPanel.jsx
 │    └── Loader.jsx
 │
 ├── pages/
 │    └── ChatPage.jsx
 │
 ├── services/
 │    └── api.js
 │
 ├── App.jsx
 └── main.jsx


# Setup & Run Instructions

- Clone Repository
git clone <your-frontend-repo-url>
cd epilot-frontend
- Install Dependencies
npm install
- Configure Environment Variables
Create a .env file:
VITE_BACKEND_URL=http://localhost:8000
(Adjust backend URL accordingly)
- Run Development Server
npm run dev
App will start at:
http://localhost:5173


# Integration
This frontend is designed to work with the E-Pilot backend.