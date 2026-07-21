# Ticket Booking System Backend

This backend implements ticket booking, wallet management, event administration, and booking transactions for the Ticket Booking System.

## Features

- User registration and login with JWT authentication
- Admin support with role-based access control
- Wallet top-up, transfer, and ledger transactions
- Event listing, seat reservation, booking confirmation
- Reservation expiry and automatic seat release
- Admin event management, seat bulk creation, booking monitoring, and refunds
- MongoDB transactions for concurrency and atomic operations

## Requirements

- Node.js 20+
- MongoDB running locally or remote

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your MongoDB URI and JWT secret.

4. Seed the default admin user and sample events:
   ```bash
   npm run seed
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/bookings/reserve`
- `POST /api/bookings/confirm`
- `POST /api/wallet/topup`
- `POST /api/wallet/transfer`
- `GET /api/bookings`
- `GET /api/wallet/transactions`
- `POST /api/bookings/:id/cancel`
- Admin routes under `/api/admin`

## Notes

The backend is intentionally built to support atomic reservation and booking operations, avoiding double booking and wallet double-spend through MongoDB transactions.
