# Quizzard

![Quizzard Logo](https://img.icons8.com/color/96/000000/wizard.png)

Quizzard is a quiz-based learning platform that rewards users with magical powers as they grow their knowledge. Users earn mana and increase their "mage meter" by taking quizzes, competing with friends, and improving their scores over time.

## 🌟 Features

- **User Authentication**: Secure login and registration system
- **Interactive Quizzes**: Engaging quiz interface with varied topics and difficulty levels
- **Progress Tracking**: Track your mana and mage meter as you complete quizzes
- **Leaderboards**: Compete with friends and see global rankings
- **Friend System**: Add and connect with friends to challenge each other
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Live Demo

Experience Quizzard live:

- Frontend: [https://quizzard-frontend.vercel.app](https://quizzard-frontend-9dje4uxec-spencerdavis226s-projects.vercel.app)
- Backend API: [https://quizzard-backend.onrender.com](https://quizzard-backend-gq70.onrender.com)

## 🛠️ Tech Stack

### Frontend

- **React**: UI framework built with functional components and hooks
- **TypeScript**: Type-safe code with better developer experience
- **Vite**: Fast build tool and development server
- **CSS**: Custom styling with a focus on user experience
- **React Router**: Client-side routing for single-page application

### Backend

- **Node.js**: JavaScript runtime for the server
- **Express**: Lightweight web framework
- **TypeScript**: Type-safe server development
- **MongoDB**: NoSQL database for storing user data, quizzes, and scores
- **Mongoose**: MongoDB object modeling for Node.js
- **JWT**: JSON Web Tokens for secure authentication

## 🏗️ Project Structure

```
/
├── frontend/         # React frontend application
│   ├── src/          # Source code
│   │   ├── api/      # API service functions
│   │   ├── components/# Reusable UI components
│   │   ├── pages/    # Application pages/views
│   │   └── utils/    # Utility functions
│   └── ...           # Configuration files
│
├── backend/          # Node.js/Express backend API
│   ├── src/          # Source code
│   │   ├── config/   # Configuration settings
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/ # Express middleware
│   │   ├── models/   # Database models
│   │   ├── routes/   # API routes
│   │   └── __tests__/ # Test files
│   └── ...           # Configuration files
└── ...
```

## 🧙‍♂️ Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MongoDB account (or local MongoDB installation)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/quizzard.git
   cd quizzard
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Set up environment variables in backend/.env:

   ```
   PORT=5005
   MONGO_URI=mongodb+srv://yourusername:yourpassword@cluster.mongodb.net/quizzard
   JWT_SECRET=your_jwt_secret
   ```

4. Install frontend dependencies:

   ```bash
   cd ../frontend
   npm install
   ```

5. Start the backend server:

   ```bash
   cd ../backend
   npm run dev
   ```

6. Start the frontend development server:

   ```bash
   cd ../frontend
   npm run dev
   ```

7. Open your browser and navigate to `http://localhost:5173`

## 📝 API Documentation

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### User

- `GET /api/user/me` - Get current user info
- `PUT /api/user/me` - Update user profile
- `DELETE /api/user/me` - Delete user account
- `POST /api/user/change-password` - Change password

### Quiz

- `GET /api/quiz` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers

### Friends

- `GET /api/user/friends` - Get user's friends
- `POST /api/user/friends` - Add a friend
- `DELETE /api/user/friends` - Remove a friend

### Leaderboard

- `GET /api/leaderboard/global` - Get global leaderboard
- `GET /api/leaderboard/friends` - Get friends leaderboard

## 🧪 Testing

Run backend tests:

```bash
cd backend
npm test
```

## 📱 Mobile Support

Quizzard is designed to be responsive and works on mobile browsers as well as desktop.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙌 Acknowledgements

- [OpenTrivia Database](https://opentdb.com/) - Quiz questions API
- [React Documentation](https://reactjs.org/)
- [Express.js](https://expressjs.com/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
