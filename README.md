<div align="center">
  <img src="app/logo.png" alt="The Ultron Logo" width="120" />
  <h1>🤖 THE ULTRON</h1>
  <p><strong>Next-Gen Autonomous Robotic Tour Services</strong></p>
  
  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)](https://nextjs.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
  [![Stripe](https://img.shields.io/badge/Stripe-Payments-6366f1?style=flat&logo=stripe)](https://stripe.com/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
</div>

<br />

## 🌟 Overview

Welcome to the official web platform for **The Ultron** – an autonomous, robotic tour guide system designed to revolutionize the tourism experience. 

Our application serves as the primary gateway for users to interact with **Friday**, our advanced AI booking assistant, to securely reserve, pay for, and manage their robotic tour sessions at premier locations such as Eco Park Newtown and the Indian Museum, Kolkata.

## ✨ Key Features

*   **🎙️ Friday AI Booking Agent:** A state-of-the-art conversational UI that guides users through the reservation process.
*   **🎟️ Instant Digital Passes:** Automatic generation of high-resolution, secure PDF tickets with embedded QR codes.
*   **📧 Automated Delivery:** Reliable, real-time ticket delivery straight to the customer's inbox via Nodemailer.
*   **💳 Secure Checkout:** Integration with Stripe for seamless, trustworthy payment processing and deposit handling.
*   **🔒 Enterprise-Grade Security:** Powered by Supabase Auth and Row Level Security (RLS) to ensure customer data is strictly protected.
*   **✨ Immersive UI:** A stunning, dark-mode-first interface featuring 3D Spline integrations and smooth Framer Motion animations.

## 🛠️ Technology Stack

*   **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
*   **Database & Auth:** [Supabase](https://supabase.com/)
*   **Payments:** [Stripe](https://stripe.com/)
*   **PDF Generation:** `jspdf` & `qrcode.react`
*   **Email Services:** `nodemailer`

## 🚀 Getting Started

### Prerequisites
*   Node.js 18.x or higher
*   A Supabase project
*   A Stripe Developer Account
*   A Gmail account for SMTP delivery

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/DiptarajSinha/TheUltron.git
   cd TheUltron
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Duplicate the `.env.example` file and rename it to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   *Fill in your Supabase, Stripe, and Nodemailer credentials in the new file.*

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000` to interact with The Ultron platform.

## 🛡️ Security
This platform has been rigorously audited for production readiness. Key features include full client-side RLS enforcement, zero hard-coded secrets, parameter-secured server actions, and protected API endpoints. 

## 📜 Copyright & License

Copyright © 2026 **The Ultron Robotics**. All rights reserved.

This software and associated documentation files (the "Software") are proprietary. Unauthorized copying, modification, distribution, or use of this Software, via any medium, is strictly prohibited without the express written consent of The Ultron Robotics.

---
<div align="center">
  <i>Empowering exploration through autonomous intelligence.</i>
</div>
