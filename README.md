# EatDish Project

EatDish is a full-stack recipe and cooking platform built with React on the frontend and Express/MongoDB on the backend. The app supports recipe browsing, filtering, reviews, chat, premium features, payment handling, and admin management.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, React Toastify, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose
- Integrations: Cloudinary, PayOS, Nodemailer, JWT, Google OAuth, Groq/OpenAI

## Main Features

- Browse and search recipes
- Filter recipes by keyword, ingredients, calories, time, and classification
- View recipe details, comments, and reviews
- User authentication and profile management
- Premium package and payment flow
- Community, chat, and notification features
- Admin dashboard for managing users, recipes, settings, reports, and content

## Project Structure

```text
EatDish-Project/
├── client/   # React + Vite frontend
├── server/   # Express + MongoDB backend
├── eatdish.sql
└── documentation files
```

## Requirements

- Node.js 18+ recommended
- npm
- MongoDB database
- Cloudinary account for image uploads
- PayOS credentials if you want to test payments
- SMTP credentials for email features

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/tuanthu1/eatdish.git
cd eatdish
```

### 2. Install frontend dependencies

```bash
cd client
npm install
```

### 3. Install backend dependencies

```bash
cd ../server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside `server/` and fill in the values used by the backend controllers and services.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

EMAIL_USER=your_email_account
EMAIL_PASS=your_email_password
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
```

If the frontend needs custom environment values, add a `.env` file in `client/` as well.

### 5. Run the backend

```bash
cd server
npm run dev
```

### 6. Run the frontend

Open a second terminal:

```bash
cd client
npm run dev
```

## Available Scripts

### Client

- `npm run dev` - start Vite development server
- `npm run build` - build production assets
- `npm run preview` - preview the production build
- `npm run lint` - run ESLint

### Server

- `npm run dev` - start backend with Nodemon
- `npm start` - start backend in production mode

## Notes

- The backend is split into controllers, routes, models, middleware, and utils for easier maintenance.
- Recipe filtering already supports classification-based behavior such as category and meal type.
- Check the SQL file and existing backend models before importing data or changing schema-related logic.

## License

No license has been defined yet. Add one if you want to publish the project publicly.
