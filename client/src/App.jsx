import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import RoleGuard from './components/RoleGuard'
import DashboardLayout from './components/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import Surveys from './pages/Surveys'
import SurveyForm from './pages/SurveyForm'
import SurveyTake from './pages/SurveyTake'
import SurveyResponses from './pages/SurveyResponses'
import SurveyAnalytics from './pages/SurveyAnalytics'
import Recognitions from './pages/Recognitions'
import Announcements from './pages/Announcements'
import Profile from './pages/Profile'
import Analytics from './pages/Analytics'
import Users from './pages/Users'
import Rewards from './pages/Rewards'
import Search from './pages/Search'
import Pulse from './pages/Pulse'
import Feedback from './pages/Feedback'
import FeedbackInbox from './pages/FeedbackInbox'
import Events from './pages/Events'
import Leaderboard from './pages/Leaderboard'
import Kanban from './pages/Kanban'

function App() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader" />
        <p>Loading WorkSphere…</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="surveys" element={<Surveys />} />
        <Route path="kanban" element={<Kanban />} />
        <Route path="surveys/new" element={<SurveyForm />} />
        <Route path="surveys/:id/edit" element={<SurveyForm />} />
        <Route path="surveys/:id/take" element={<SurveyTake />} />
        <Route path="surveys/:id/responses" element={<SurveyResponses />} />
        <Route path="surveys/:id/analytics" element={<RoleGuard allowedRoles={['admin', 'hr']}><SurveyAnalytics /></RoleGuard>} />
        <Route path="recognitions" element={<Recognitions />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="announcements/:id" element={<Announcements />} />
        <Route path="profile" element={<Profile />} />
        <Route path="search" element={<Search />} />
        <Route path="pulse" element={<Pulse />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="feedback-inbox" element={<RoleGuard allowedRoles={['admin', 'hr']}><FeedbackInbox /></RoleGuard>} />
        <Route path="events" element={<Events />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="analytics" element={<RoleGuard allowedRoles={['admin', 'hr']}><Analytics /></RoleGuard>} />
        <Route path="users" element={<RoleGuard allowedRoles={['admin']}><Users /></RoleGuard>} />
        <Route path="rewards" element={<RoleGuard allowedRoles={['admin']}><Rewards /></RoleGuard>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
