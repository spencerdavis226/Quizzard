# Quizzard Backend API Documentation

## Overview

The Quizzard backend provides a RESTful API for managing users, quizzes, leaderboards, and authentication. Below is the documentation for all available endpoints.

---

## Authentication

### POST `/api/auth/register`

**Description:** Register a new user.

- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully"
  }
  ```
- **Status Codes:**
  - 201: User registered successfully
  - 400: Validation error or duplicate email/username

### POST `/api/auth/login`

**Description:** Log in an existing user.

- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response:**
  ```json
  {
    "token": "string"
  }
  ```
- **Status Codes:**
  - 200: Login successful
  - 401: Invalid credentials

---

## User Management

### GET `/api/user/me`

**Description:** Fetch the profile of the authenticated user.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Response:**
  ```json
  {
    "_id": "string",
    "username": "string",
    "email": "string",
    "mana": "number",
    "mageMeter": "number",
    "friends": ["string"]
  }
  ```
- **Status Codes:**
  - 200: Profile fetched successfully
  - 401: Unauthorized

### PUT `/api/user/me`

**Description:** Update the profile of the authenticated user.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Request Body:**
  ```json
  {
    "username": "string",
    "email": "string"
  }
  ```
- **Response:**
  ```json
  {
    "_id": "string",
    "username": "string",
    "email": "string"
  }
  ```
- **Status Codes:**
  - 200: Profile updated successfully
  - 400: Validation error
  - 401: Unauthorized

### DELETE `/api/user/me`

**Description:** Delete the authenticated user's account.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Response:**
  ```json
  {
    "message": "Account deleted successfully"
  }
  ```
- **Status Codes:**
  - 200: Account deleted successfully
  - 401: Unauthorized

---

## Quiz Management

### GET `/api/quiz`

**Description:** Fetch 10 quiz questions.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Query Parameters:**
  - `category` (optional): string
  - `difficulty` (optional): string
- **Response:**
  ```json
  [
    {
      "question": "string",
      "correct_answer": "string",
      "incorrect_answers": ["string"]
    }
  ]
  ```
- **Status Codes:**
  - 200: Questions fetched successfully
  - 400: Failed to fetch questions
  - 401: Unauthorized

### POST `/api/quiz/submit`

**Description:** Submit a quiz score and update user stats.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Request Body:**
  ```json
  {
    "category": "string",
    "difficulty": "string",
    "questionCount": "number",
    "correctAnswers": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Score submitted successfully",
    "user": {
      "mana": "number",
      "mageMeter": "number"
    },
    "score": {
      "category": "string",
      "difficulty": "string",
      "questionCount": "number",
      "correctAnswers": "number",
      "percentage": "number"
    }
  }
  ```
- **Status Codes:**
  - 200: Score submitted successfully
  - 400: Invalid quiz data
  - 401: Unauthorized

---

## Leaderboard

### GET `/api/leaderboard/global`

**Description:** Fetch the global leaderboard sorted by `mana` or `mageMeter`.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Query Parameters:**
  - `sortBy` (optional): `mana` or `mageMeter` (default: `mana`)
- **Response:**
  ```json
  {
    "leaderboard": [
      {
        "username": "string",
        "mana": "number",
        "mageMeter": "number"
      }
    ]
  }
  ```
- **Status Codes:**
  - 200: Leaderboard fetched successfully
  - 401: Unauthorized

### GET `/api/leaderboard/friends`

**Description:** Fetch the friends leaderboard sorted by `mana` or `mageMeter`.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Query Parameters:**
  - `sortBy` (optional): `mana` or `mageMeter` (default: `mana`)
- **Response:**
  ```json
  {
    "leaderboard": [
      {
        "username": "string",
        "mana": "number",
        "mageMeter": "number"
      }
    ]
  }
  ```
- **Status Codes:**
  - 200: Leaderboard fetched successfully
  - 401: Unauthorized

---

## Friend Management

### POST `/api/user/friends`

**Description:** Add a friend by username.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Request Body:**
  ```json
  {
    "username": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Friend added successfully",
    "user": {
      "friends": ["string"]
    }
  }
  ```
- **Status Codes:**
  - 200: Friend added successfully
  - 400: Already friends or invalid request
  - 404: Friend not found
  - 401: Unauthorized

### DELETE `/api/user/friends`

**Description:** Remove a friend by username.

- **Headers:**
  - Authorization: `Bearer <token>`
- **Request Body:**
  ```json
  {
    "username": "string"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Friend removed successfully",
    "user": {
      "friends": ["string"]
    }
  }
  ```
- **Status Codes:**
  - 200: Friend removed successfully
  - 400: Not friends or invalid request
  - 404: Friend not found
  - 401: Unauthorized

---

## User Stats

### POST `/api/user/stats`

**Description:** Update user stats (mana and mageMeter).

- **Headers:**
  - Authorization: `Bearer <token>`
- **Request Body:**
  ```json
  {
    "mana": "number",
    "mageMeter": "number"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User stats updated successfully",
    "user": {
      "mana": "number",
      "mageMeter": "number"
    }
  }
  ```
- **Status Codes:**
  - 200: Stats updated successfully
  - 401: Unauthorized

---

## Notes

- All endpoints requiring authentication must include a valid JWT in the `Authorization` header.
- Ensure proper validation of request bodies to avoid errors.

---

## Running the Backend

Refer to the main `README.md` for setup and running instructions.
