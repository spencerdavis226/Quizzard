# Quizzard - Frontend

## Overview

Quizzard is a trivia quiz application built with React + TypeScript that lets users test their knowledge through quizzes from the Open Trivia Database. Users earn two types of points as they answer questions:

- **Mana**: Total correct answers (lifetime)
- **Mage Meter**: Running accuracy % of correct answers

## Features

- **User Authentication**: Secure login/registration with JWT tokens
- **Quiz Experience**: Take 10-question quizzes with immediate feedback
- **User Dashboard**: View personal stats and navigation to main features
- **Profile Management**: Update username, email, or password, and account deletion
- **Friends System**: Add/remove friends and view their stats
- **Leaderboard**: Compare yourself with others globally or just friends
- **Mobile-Responsive Design**: Optimized for all devices

## Project Structure

```
frontend/
  src/
    api/           # API client functions for backend communication
    components/    # Reusable UI components
    pages/         # Page components with their CSS files
    utils/         # Utility functions (token management, etc.)
    App.tsx        # Main app component with routing
    main.tsx       # Entry point
```

## Key Components

### Pages

- **LoginPage/RegisterPage**: User authentication forms
- **DashboardPage**: Central hub showing user stats and navigation options
- **QuizPage**: Interactive quiz experience with questions and answers
- **QuizResultsPage**: Summary of quiz performance and updated stats
- **EditProfilePage**: User profile management (username/email/password)
- **FriendsPage**: Friends management interface
- **LeaderboardPage**: Global and friends ranking comparison

### State Management

The application uses React's Context API for maintaining authentication state across the app. Local component state is used for UI interactions and form handling.

## API Integration

The frontend communicates with the backend through a set of API client functions:

- **auth.ts**: Authentication-related API calls (login, register, etc.)
- **user.ts**: User management, profile updates, friends, and leaderboard data

## Authentication Flow

1. User logs in or registers
2. JWT token is received and stored in localStorage
3. Token is included in all subsequent API requests
4. Protected routes check for valid token before rendering

## Quiz Flow

1. User starts a quiz from the dashboard
2. Questions are fetched from the backend (which gets them from Open Trivia DB)
3. User progresses through questions with visual feedback
4. Results are submitted to update user's stats
5. Summary page displays performance metrics

## Running the Application

```
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Environment Configuration

Create a `.env` file in the frontend root with:

```
VITE_API_URL=http://localhost:5005 # Your backend API URL
```

## Browser Support

Quizzard supports all modern browsers (Chrome, Firefox, Safari, Edge).

## Responsive Design

The UI is fully responsive with specific optimizations for:

- Mobile phones (< 500px)
- Tablets (500px - 1024px)
- Desktops (> 1024px)

## Accessibility

- Semantic HTML elements
- ARIA attributes where appropriate
- Keyboard navigation support
- Sufficient color contrast ratios

## Future Enhancements

See DEVELOPMENT_NOTES.md for planned future features and enhancements.
