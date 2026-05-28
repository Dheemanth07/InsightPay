# InsightPay
Smart Digital Wallet & Personal Finance Platform built for secure money management. It supports user authentication, wallet balance tracking, money transfers, QR-based payments, saved cards, and categorised transaction history.

The project is currently under active development.

## Features

- User registration and login with JWT authentication
- Wallet balance management
- Add money to wallet
- Send money to another user
- QR code payment flow
- Transaction history with sender/receiver direction
- Transaction categories
- Default and system-managed categories
- Saved card support using tokenized card data
- Prisma ORM with MySQL
- React frontend with a Vite setup

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios

### Backend
- Node.js
- Express
- Prisma
- MySQL
- JWT
- bcrypt
- Helmet
- Express Rate Limit
- QR Code generation

## Project Structure

```txt
insightpay/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   ├── cards/
│       │   ├── categories/
│       │   ├── qr/
│       │   ├── transactions/
│       │   └── wallet/
│       ├── middlewares/
│       ├── utils/
│       ├── app.js
│       └── server.js
│
└── frontend/
    └── src/
        ├── app/
        ├── features/
        ├── pages/
        └── shared/
```

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- MySQL
- npm

## Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/insightpay"
JWT_SECRET="your_jwt_secret"
QR_SECRET="your_qr_secret"
PORT=5000
```

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate Prisma Client:

```bash
npx prisma generate
```

Start the backend server:

```bash
npm run dev
```

The backend runs on:

```txt
http://localhost:5000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the URL shown in the terminal, usually:

```txt
http://localhost:5173
```

## Core API Areas

- `/auth` - user authentication
- `/wallet` - wallet balance, add money, send money, transaction history
- `/transactions` - transaction management
- `/categories` - transaction categories
- `/cards` - saved card operations
- `/qr` - QR payment generation, validation, and confirmation

## Database

InsightPay uses Prisma with MySQL. The main models include:

- `User`
- `Transaction`
- `Category`
- `Card`

Transactions support different types and methods, including manual wallet activity and QR-based payments.
