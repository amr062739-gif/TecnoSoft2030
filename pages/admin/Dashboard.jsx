import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Users, BookOpen, ClipboardList, CheckSquare, TrendingUp, Clock } from 'lucide-react'

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState({
    students: 0, courses: 0, lessons: 0,
    assignments: 0, submissions: 0, pending: 0
  })
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentSubmissions()
  }, [])

  const fetchStats = async () => {
    try {
      const [
        { count: students },
        { count: courses },
        { count: lessons },
        { count: assignments },
        { count: submissions },
        { count: pending }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('assignments').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ])
      setStats({ students, courses, lessons, assignments, submissions, pending })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentSubmissions = async () => {
    const { data } = await supabase
      .from('submissions')
      .select(`
        id, status, submitted_at, score,
        student:profiles!submissions_student_id_fkey(full_name),
        assignment:assignments!submissions_assignment_id_fkey(title)
      `)
      .order('submitted_at', { ascending: false })
      .limit(5)
    setRecentSubmissions(data || [])
  }

  const statCards = [
    { label: 'الطلاب', value: stats.students, icon: Users, color: 'purple' },
    { label: 'المواد', value: stats.courses, icon: BookOpen, color: 'cyan' },
    { label: 'الدروس', value: stats.lessons, icon: TrendingUp, color: 'green' },
    { label: 'الواجبات', value: stats.assignments, icon: ClipboardList, color: 'orange' },
    { label: 'الحلول المُسلَّمة', value: stats.submissions, icon: CheckSquare, color: 'pink' },
    { label: 'بانتظار التصحيح', value: stats.pending, icon: Clock, color: 'orange' },
  ]

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'معلق', cls: 'badge-warning' },
      graded: { label: 'مصحح', cls: 'badge-success' },
      returned: { label: 'مُعاد', cls: 'badge-primary' },
    }
    return map[status] || { label: status, cls: 'badge-muted' }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric'
  })

  return (
    <div>
      <div className="page-header">
        <h2>لوحة التحكم 👋</h2>
        <p>مرحباً {profile?.full_name}، إليك نظرة عامة على المنصة</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}>
              <Icon size={22} />
            </div>
            <div className="stat-info">
              <h3>{loading ? '...' : value}</h3>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Submissions */}
      <div className="card">
        <div className="card-header">
          <h3>🕐 آخر الحلول المُسلَّمة</h3>
        </div>
        {recentSubmissions.length === 0 ? (
          <div className="empty-state">
            <CheckSquare size={48} />
            <h3>لا توجد حلول بعد</h3>
            <p>ستظهر هنا حلول الطلاب عند تسليمها</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الواجب</th>
                  <th>تاريخ التسليم</th>
                  <th>الحالة</th>
                  <th>الدرجة</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map(sub => {
                  const { label, cls } = getStatusBadge(sub.status)
                  return (
                    <tr key={sub.id}>
                      <td><strong>{sub.student?.full_name}</strong></td>
                      <td>{sub.assignment?.title}</td>
                      <td>{formatDate(sub.submitted_at)}</td>
                      <td><span className={`badge ${cls}`}>{label}</span></td>
                      <td>{sub.score !== null ? `${sub.score}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
