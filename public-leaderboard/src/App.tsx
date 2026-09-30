import { Navigate, Route, Routes } from 'react-router-dom';
import { LiveLeaderboardPage } from './LiveLeaderboardPage';

export default function App() {
  return (
    <Routes>
      <Route path="/e/:token" element={<LiveLeaderboardPage />} />
      <Route
        path="/"
        element={
          <div className="state">
            Open a shared leaderboard link from the Galafy app.
          </div>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
