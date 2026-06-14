# InsightPay: Smart Digital Wallet & Personal Finance Platform

InsightPay is a secure, full-stack digital wallet and personal finance platform that supports user authentication, multi-method wallet ledger transactions, QR-based payments, tokenized card management, subscription tracking, and automated bill splitting.

---

## Interface Preview 

### UI Screenshots

#### Landing Page
![Landing Page Interface](screenshots/demo_landing.png)

#### Personal Finance Dashboard
![Dashboard Spending Analytics & Ledger](screenshots/demo_dashboard.png)

#### Saved Cards Management
![Saved Cards View](screenshots/demo_cards.png)

---

## Core Features & Engineering Highlights

*   **Secure Authentication & Session Management:** Stateless JWT-based session architecture with bcrypt-hashed credentials and HTTP-only cookie-like practices.
*   **Double-Entry Ledger Architecture:** Financial transfers, balance updates, and settlements are executed within isolated SQL transactions to maintain ledger integrity.
*   **QR-Based Payment Pipeline:** Secure cryptographic signing and verification of dynamic merchant/user QR codes.
*   **Tokenized Card Management:** Dynamic frontend credit card layout rendering with automatic issuer brand recognition (Visa, Mastercard, RuPay, Amex) and tailored visual theme mappings (HDFC, SBI, ICICI, AXIS).
*   **Dynamic Visual Conflict Resolution:** Employs a custom layout constraint resolver that programmatically formats and truncates cardholder names dynamically to fit text boundaries (under 14 characters) and prevent overlap with valid-thru dates.
*   **Interactive Spending Analytics:** Visual spend distributions by category using fully interactive custom CSS-rendered charts and tooltips.
*   **Split-Bill Requests:** Integrated ledger request triggers to split balances and record settling transactions among users.

---

## Technical Architecture & Design Decisions

### ACID-Compliant Financial Transfers
To eliminate double-spend vulnerabilities and ensure race-condition resilience during balance transfers and split settlements, the platform utilizes database-level row locks and isolated `Prisma.$transaction` calls. If any step of the debit-credit pipeline fails (e.g. sender has insufficient funds, receiver account is deactivated, database writes timeout), the entire ledger write is rolled back safely:

```javascript
// Sample transaction enforcement block in the wallet ledger repository
await prisma.$transaction(async (tx) => {
  // 1. Lock sender wallet and check balance
  const senderWallet = await tx.wallet.update({
    where: { userId: senderId },
    data: { balance: { decrement: amount } }
  });
  
  if (senderWallet.balance < 0) {
    throw new Error("Insufficient funds");
  }

  // 2. Increment receiver wallet
  await tx.wallet.update({
    where: { userId: receiverId },
    data: { balance: { increment: amount } }
  });

  // 3. Record transaction entry
  await tx.transaction.create({
    data: { senderId, receiverId, amount, type: 'TRANSFER', status: 'SUCCESS' }
  });
});
```

### Decoupled Codebase Structure
The codebase follows a clean separation of concerns, grouping components by feature boundary:

```txt
insightpay/
├── backend/                  # Node.js + Express API service
│   ├── prisma/               # Schema configuration and migrations
│   └── src/                  # Express endpoints grouped by resource boundaries
│       ├── features/         # auth, cards, categories, qr, transactions, wallet, splits
│       ├── middlewares/      # auth check, rate limiting, error handlers
│       └── server.js
│
└── frontend/                 # React SPA
    └── src/
        ├── app/              # Router and global provider definitions
        ├── features/         # Page components and state hooks isolated by domain
        └── shared/           # Generic buttons, input templates, logos, API hooks
```

---

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | Scalable, typed SPA execution |
| **Styling** | Tailwind CSS | Utility-first component layouts |
| **Database** | MySQL, Prisma ORM | SQL storage engine & transactional migration engine |
| **Backend** | Node.js, Express | RESTful API service orchestrator |
| **Security** | bcrypt, Helmet, Express Rate Limit | API request defense & hashing integrity |

---

## Database Schema Outline

*   **User:** Hashed credentials, profile mapping, and relationship links.
*   **Transaction:** Ledger tracking containing amount, type (`TRANSFER`, `ADD_MONEY`, `QR_PAY`), category, and status.
*   **Card:** Saved payment cards referencing user accounts.
*   **Category:** Financial grouping structures supporting default system configurations and customized user categories.
*   **Subscription:** Recursive billing tracker tied to card tokens.
*   **SplitRequest:** Collaborative ledger records for peer-to-peer bill splitting.

---

## Getting Started

### Prerequisites
*   Node.js (v18+)
*   MySQL Server Instance
*   npm

### Backend Setup
1. Navigate to directory and install dependencies:
    ```bash
    cd backend
    npm install
    ```
2. Configure `.env` environment file:
    ```env
    DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/insightpay"
    JWT_SECRET="your_secure_jwt_secret"
    QR_SECRET="your_secure_qr_secret"
    PORT=8000
    ```
3. Run database migrations and generate Prisma clients:
    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```
4. Run the Express dev server:
    ```bash
    npm run dev
    ```

### Frontend Setup
1. Navigate to directory and install dependencies:
    ```bash
    cd ../frontend
    npm install
    ```
2. Start the Vite dev server:
    ```bash
    npm run dev
    ```
3. Launch `http://localhost:5173` in your browser.

