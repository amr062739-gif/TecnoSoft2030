import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminStudents from './pages/admin/Students'
import AdminCourses from './pages/admin/Courses'
import AdminLessons from './pages/admin/Lessons'
import AdminAssignments from './pages/admin/Assignments'
import AdminSubmissions from './pages/admin/Submissions'

// Student Pages
import StudentDashboard from './pages/student/Dashboard'
import StudentLessons from './pages/student/Lessons'
import StudentAssignments from './pages/student/Assignments'
import LessonView from './pages/student/LessonView'
import SubmitAssignment from './pages/student/SubmitAssignment'

// Shared
import AdminLayout from './components/shared/AdminLayout'
import StudentLayout from './components/shared/StudentLayout'

const ProtectedAdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!user || profile?.role !== 'admin') return <Navigate to="/login" replace />
  return children
}

const ProtectedStudentRoute = ({ children }) => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!user || profile?.role !== 'student') return <Navigate to="/login" replace />
  return children
}

const RootRedirect = () => {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/student/dashboard" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedAdminRoute>
          <AdminLayout />
        </ProtectedAdminRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="lessons" element={<AdminLessons />} />
        <Route path="assignments" element={<AdminAssignments />} />
        <Route path="submissions" element={<AdminSubmissions />} />
      </Route>

      {/* Student Routes */}
      <Route path="/student" element={
        <ProtectedStudentRoute>
          <StudentLayout />
        </ProtectedStudentRoute>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="lessons" element={<StudentLessons />} />
        <Route path="lessons/:id" element={<LessonView />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="assignments/:id/submit" element={<SubmitAssignment />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
