# AuthSecure — Authentication Done Safely

A secure authentication web application built with React, Vite, and Supabase Authentication.

## Overview

AuthSecure allows users to create an account, sign in, manage their account, and reset or change their password through a clean and responsive interface.

## Features

- User registration with full name, email, and password
- User sign-in and sign-out
- Password visibility toggle
- Forgot password and password reset flow
- Change password from account settings
- Session persistence across page refreshes
- Email verification status
- Authentication feedback messages
- Responsive blue-themed user interface

## Technologies Used

- React
- Vite
- JavaScript
- Supabase Authentication
- HTML and CSS

## Getting Started

### Prerequisites

- Node.js and npm
- A Supabase account
- A Supabase project

### Installation

1. Clone or download this project.
2. Open the project folder in a terminal.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root and add your Supabase project credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   ```

5. In Supabase, configure Authentication URL settings. For local development, add your actual local development URL to the allowed Redirect URLs.

6. Start the development server:

   ```bash
   npm run dev
   ```

7. Open the local URL shown in the terminal.

## Security Notes

- Authentication is handled by Supabase rather than a custom password-storage system.
- Passwords are not stored in the application's own database by this frontend.
- Supabase project credentials must be configured using environment variables.
- Never commit real secrets or private credentials to a public repository.
- User access and session handling should be tested before production deployment.

## Project Status

Core authentication and password recovery flows have been implemented and tested locally. Further testing and production configuration may be needed before deployment.

## Author

Created as an internship project: **Authentication Done Safely**.