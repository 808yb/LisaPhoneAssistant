# Lisa - The AI Phone Assistant (Voice Intelligence 24/7)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini_Flash-orange)
![Twilio](https://img.shields.io/badge/Voice-Twilio-red)
![Supabase](https://img.shields.io/badge/DB-Supabase-green)

Lisa is a state-of-the-art **AI-powered phone receptionist** designed for modern businesses. Built on top of **Google Gemini**, **Twilio**, and **Supabase**, Lisa answers incoming calls in real-time, speaks with human-like latency, qualifies leads, checks availabilities, and books appointments completely autonomously.

She transforms the traditional, static "press 1 for sales" IVR systems into a fully conversational, intelligent, and context-aware experience.

---

## What is Lisa about?
Lisa is a multi-tenant B2B SaaS platform. Businesses (like car dealerships, clinics, or real estate agencies) can configure their own instance of Lisa. They provide her with their opening hours, specific guardrails, pricing, and services. 

When a customer calls the business's phone number:
1. Twilio answers the call and routes the audio to Lisa's backend.
2. Lisa transcribes the speech and evaluates the customer's intent using Google Gemini.
3. She responds naturally, querying databases for availability, creating leads, or booking appointments.
4. She uses pre-cached "Smart Fillers" (e.g., "Einen kleinen Moment bitte") to bridge LLM processing times, ensuring a seamless, ultra-low-latency conversational flow.

---

## How does she help?
* **Zero Missed Calls:** Businesses never lose a lead because the line was busy. Lisa works 24/7/365.
* **Instant Resolution:** Instead of waiting in hold queues, customers get immediate answers to common questions (opening hours, prices, services).
* **Automated Booking:** Lisa has direct read/write access to the calendar and resource databases. She can book rental cars, workshop slots, or medical appointments in real time.
* **Cost Efficiency:** Reduces the workload on human receptionists, allowing them to focus on complex, high-value customer interactions.
* **Lead Qualification:** Lisa extracts the caller's name, phone number, and specific concerns, formatting them neatly into the CRM before the human team even takes over.

---

## What can she do? (Key Features)

### 1. Conversational AI & Guardrails
Lisa isn't just a generic chatbot. She operates under strict, dynamic guardrails (`PromptBuilder.ts`). If a caller asks off-topic questions (e.g., general knowledge, politics), she politely redirects the conversation back to the business domain.

### 2. Autonomous Tool Execution
Lisa is equipped with custom tools (Function Calling):
- `save_lead` & `update_lead`: Captures caller information and their core request.
- `check_availability`: Queries the internal calendar for open slots.
- `check_available_resources`: Queries the internal database for specific assets (e.g., available rental cars).
- `check_external_availability`: Connects to a business's **external third-party API** via Webhooks to check live inventory.
- `book_appointment`: Locks in a booking directly into the Supabase database.

### 3. Ultra-Low Latency Architecture
Voice AI is only as good as its latency. Lisa uses **Smart Audio Caching**. While the Gemini LLM takes 2-3 seconds to process complex logic (like checking the database), Lisa instantly plays a contextual filler audio (e.g., "Let me quickly check the calendar for you..."). This masks the AI latency entirely, making the conversation feel perfectly human.

### 4. Multi-Tenant Configuration
Every business has its own "Brain". Through the Lisa HQ Dashboard, companies can customize:
- External API Webhooks & Secrets
- Opening hours & emergency contacts
- Specific LLM Permissions (e.g., "Are you allowed to quote prices?")
- Script variations for Greetings and Farewells

---

## Why this architecture?
The stack was carefully chosen for performance, scalability, and developer experience:

* **Frontend (React + Vite + Tailwind):** Provides a blazing fast, beautiful dashboard for business owners to manage leads, view calendar appointments, and adjust Lisa's settings.
* **Backend (Node.js + Express):** Handles the high-throughput Twilio Webhooks and manages the stateful interactions with the LLM.
* **AI (Google Gemini Flash):** Chosen for its exceptional speed and robust function-calling capabilities, which are critical for live voice interactions.
* **Database (Supabase / PostgreSQL):** Offers real-time subscriptions, secure RLS policies, and scalable relational storage for leads, appointments, and multi-tenant configurations.

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- A Twilio Account (for phone numbers and voice routing)
- A Supabase Project
- Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/808yb/LisaPhoneAssistant.git
   cd LisaPhoneAssistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_key
   SUPABASE_PROJECT_ID=your_supabase_project_id
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   *Note: For Twilio to reach your local server during development, use a tunneling service like [ngrok](https://ngrok.com/): `npx ngrok http 3000`.*

---
*Built to power the next generation of voice intelligence.*
