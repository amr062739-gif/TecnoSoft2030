import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { signOut } from '../../lib/supabase'
import {
  LayoutDashboard, BookOpen, ClipboardList, LogOut
} from 'lucide-react'

const navItems = [
  { to: '/student/dashboard', icon: LayoutDashboard, label: 'لوحتي' },
  { to: '/student/lessons', icon: BookOpen, label: 'الدروس والشروحات' },
  { to: '/student/assignments', icon: ClipboardList, label: 'الواجبات' },
]

export default function StudentLayout() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'ط'
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
            <p>بوابة الطالب</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-title">القائمة</p>
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
              <p>{profile?.full_name || 'الطالب'}</p>
              <span>طالب</span>
            </div>
          </div>
          <button className="nav-item" onClick={handleLogout} style={{ color: '#FF5252' }}>
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
