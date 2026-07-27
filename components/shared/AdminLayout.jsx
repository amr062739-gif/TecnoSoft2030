import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../lib/supabase'
import {
  LayoutDashboard, Users, BookOpen, FileText,
  ClipboardList, CheckSquare, LogOut, GraduationCap
} from 'lucide-react'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' },
  { to: '/admin/students', icon: Users, label: 'إدارة الطلاب' },
  { to: '/admin/courses', icon: BookOpen, label: 'المواد الدراسية' },
  { to: '/admin/lessons', icon: FileText, label: 'الشروحات والدروس' },
  { to: '/admin/assignments', icon: ClipboardList, label: 'الواجبات' },
  { to: '/admin/submissions', icon: CheckSquare, label: 'حلول الطلاب' },
]

export default function AdminLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'A'
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">TS</div>
          <div className="sidebar-logo-text">
            <h1>TECNO SOFT</h1>
            <p>المنصة التعليمية</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-title">القائمة الرئيسية</p>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{getInitials(profile?.full_name)}</div>
            <div className="user-details">
              <p>{profile?.full_name || 'المدير'}</p>
              <span>مدير المنصة</span>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#FF5252' }}>
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
