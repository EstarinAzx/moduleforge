import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import WorldOverviewPage from './pages/WorldOverviewPage'
import EntryEditorPage from './pages/EntryEditorPage'

function App() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/worlds/:worldId" element={<WorldOverviewPage />} />
                <Route path="/worlds/:worldId/entries/:entryId" element={<EntryEditorPage />} />
            </Route>

            {/* Redirect root to dashboard (will redirect to login if not authenticated) */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
    )
}

export default App
