# KRÜSt - Adaptive Career Readiness Engine

KRÜSt is an intelligent, full-stack career readiness platform designed to evaluate your technical competencies, pinpoint knowledge gaps, conduct 3-level progressive assessments (Level 1, Level 2, Level 3 with 10 real-time scenario questions each), run 3-level interview coding challenges, compute combined average readiness percentages, enforce an 80% threshold to unlock the AI Personal HR Mock Interview (with voice synthesis and real-time mistake corrections), provide personalized roadmaps, and perform ATS resume audits powered by Google Gemini AI.

---

## 🌟 Key Features

- **🎯 Targeted Career Onboarding**: Select from pre-configured tech industry tracks (e.g., Full Stack Engineer, Data Scientist, DevOps Engineer, AI/ML Specialist, Cyber Security Analyst) or create custom career profiles.
- **📊 3-Level Progressive Core Competencies (10 Questions/Level)**:
  - **Level 1**: Working Scenarios & Fundamental Concepts (10 scenario questions)
  - **Level 2**: Production Edge Cases & System Reliability (10 scenario questions)
  - **Level 3**: High-Scale System Architecture & Failures (10 scenario questions)
  - Combined average score calculated across all 3 levels for the final competency readiness percentage.
- **🔓 80% Threshold Gate for AI Mock Interview**: Candidates must complete all core competencies for their chosen career track with an average score of **≥ 80%** to unlock access to the AI Personal Mock Interview.
- **💻 3-Level Interview Coding Challenges**: 3 distinct levels of coding problems (Easy, Medium, Hard) with an in-browser code compiler and live test runner.
- **🎙️ AI Personal Mock Interview**: In-person interactive interview (HR Round) with AI voice synthesis, speech recognition microphone input, real-time communication & technical scoring, mistake corrections, and unlimited reassessment loops till perfection.
- **🗺️ Interactive Career Roadmaps**: Step-by-step milestone learning paths with progress tracking, module guides, and actionable recommendations.
- **📄 ATS Resume Audit**: AI-powered resume analyzer that evaluates your resume against target job roles, computes ATS compatibility scores, and highlights missing skills or structural improvements.
- **🔒 Multi-User & Cloud Persistence**: Firebase Auth & Firestore integration with local fallback state management.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide React, Recharts, Web Speech API (TTS & Speech Recognition)
- **Backend**: Express.js, Node.js, Vite (Development Middleware Mode)
- **AI Integration**: `@google/genai` SDK with Gemini 2.5 models
- **Build & Compilation**: TSX, ESBuild, Vite

---

## 📋 Prerequisites

Before running KRÜSt locally, ensure you have the following installed on your system:

- **Node.js**: `v18.0.0` or higher (recommended `v20.x`)
- **npm**: `v9.0.0` or higher
- **Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 How to Run locally on Localhost

Follow these step-by-step instructions to set up and start the development server on your local machine:

### 1. Clone or Extract the Project

Navigating into the project root directory:

```bash
cd krust-career-engine
```

### 2. Install Dependencies

Install all necessary frontend and backend packages:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` in your code editor and add your **Gemini API Key**:

```env
# Google Gemini API Key (Required for AI generation, assessment, & ATS features)
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Application URL
APP_URL="http://localhost:3000"
```

> **Note**: If `GEMINI_API_KEY` is not provided, KRÜSt includes built-in graceful local fallbacks for core features so you can still explore the user interface.

### 4. Start the Local Development Server

Run the unified dev server powered by `tsx` and Express with Vite middleware:

```bash
npm run dev
```

Once started, open your web browser and navigate to:

👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🏗️ Building & Running for Production

To build the static frontend assets and bundle the server for production deployment:

### 1. Build the Application

```bash
npm run build
```

This will:
- Compile static assets into the `dist/` directory via Vite.
- Bundle `server.ts` into a self-contained CommonJS file (`dist/server.cjs`) using ESBuild.

### 2. Start the Production Server

```bash
npm run start
```

The production server will listen on `http://localhost:3000` (or `PORT` defined by host environment).

---

## 📜 Available NPM Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Launches the server in development mode with live HMR on port 3000. |
| `npm run build` | Builds frontend production assets and bundles `server.ts` via ESBuild. |
| `npm run start` | Executes the production bundle `dist/server.cjs`. |
| `npm run lint` | Runs the TypeScript compiler check (`tsc --noEmit`) across the codebase. |
| `npm run clean` | Removes built artifacts (`dist/` directory). |

---
---

## 👥 Team Members

This project was built by:
- **PINDIBOINA SAI DEEPAK**
- **MOLAGAMODI KISHORE**
- **MADDIPATLA ROHITH**

---

## 📄 License & Attribution

Done as **Innova Hackathon**. Distributed under the MIT License.
