import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RequireAuth from './components/RequireAuth';

// Import pages
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import QuizPage from './pages/QuizPage';
import QuizResultsPage from './pages/QuizResultsPage';
import EditProfilePage from './pages/EditProfilePage';
import FriendsPage from './pages/FriendsPage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
        <Route
          path="/quiz"
          element={
            <RequireAuth>
              <QuizPage />
            </RequireAuth>
          }
        />
        <Route
          path="/quiz-results"
          element={
            <RequireAuth>
              <QuizResultsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <EditProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/friends"
          element={
            <RequireAuth>
              <FriendsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <RequireAuth>
              <LeaderboardPage />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
