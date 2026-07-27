import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { BookOpen, ClipboardList, CheckCircle, Clock, Star, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function StudentDashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ lessons: 0, assignments: 0, submitted: 0, graded: 0 })
  const [recentAssignments, setRecentAssignments] = useState([])
  const [mySubmissions, setMySubmissions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    try {
      const [
        { count: lessons },
        { count: assignments },
        { count: submitted },
        { count: graded }
      ] = await Promise.all([
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('assignments').select('*', { count: 'exact', head: true }),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('student_id', profile.id),
        supabase.from('submissions').select('*', { count: 'exact', head: true }).eq('student_id', profile.id).eq('status', 'graded'),
      ])
      setStats({ lessons, assignments, submitted, graded })

      // Recent assignments
      const { data: recent } = await supabase
        .from('assignments')
        .select('*, course:courses(title)')
        .order('created_at', { ascending: false })
        .limit(4)
      setRecentAssignments(recent || [])

      // My recent submissions with grades
      const { data: subs } = await supabase
        .from('submissions')
        .select('*, assignment:assignments(title, max_score)')
        .eq('student_id', profile.id)
        .eq('status', 'graded')
        .order('graded_at', { ascending: false })
        .limit(3)
      setMySubmissions(subs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'الدروس المتاحة', value: stats.lessons, icon: BookOpen, color: 'purple' },
    { label: 'الواجبات', value: stats.assignments, icon: ClipboardList, color: 'cyan' },
    { label: 'واجبات سلّمتها', value: stats.submitted, icon: CheckCircle, color: 'green' },
    { label: 'تم تصحيحها', value: stats.graded, icon: Star, color: 'orange' },
  ]

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })
  const isOverdue = (due_date) => due_date && new Date(due_date) < new Date()

  return (
    <div>
      <div className="page-header">
        <h2>مرحباً {profile?.full_name?.split(' ')[0]} 👋</h2>
        <p>إليك ملخص نشاطك على منصة Tecno Soft</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${color}`}><Icon size={22} /></div>
            <div className="stat-info">
              <h3>{loading ? '...' : value}</h3>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent Assignments */}
        <div className="card">
          <div className="card-header">
            <h3>📋 آخر الواجبات</h3>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/student/assignments')}>عرض الكل</button>
          </div>
          {recentAssignments.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>لا توجد واجبات بعد</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {recentAssignments.map(a => (
                <div key={a.id} style={{ padding: '12px 20px', borderBottom: '1px solid var(--glass-border)', cursor: 'pointer' }}
                  onClick={() => navigate(`/student/assignments`)}>
                  <div className="flex-between">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{a.title}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{a.course?.title}</p>
                    </div>
                    {a.due_date && (
                      <span className={`badge ${isOverdue(a.due_date) ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: 10 }}>
                        <Clock size={10} /> {formatDate(a.due_date)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Graded Submissions */}
        <div className="card">
          <div className="card-header">
            <h3>⭐ درجاتي الأخيرة</h3>
          </div>
          {mySubmissions.length === 0 ? (
            <div className="empty-state" style={{ padding: 30 }}>
              <p>لا توجد درجات بعد</p>
            </div>
          ) : (
            <div style={{ padding: '8px 0' }}>
              {mySubmissions.map(s => (
                <div key={s.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--glass-border)' }}>
                  <div className="flex-between">
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14 }}>{s.assignment?.title}</p>
                      {s.feedback && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                          💬 {s.feedback}
                        </p>
                      )}
                    </div>
                    <div className="score-circle" style={{ width: 52, height: 52 }}>
                      <span className="score-num" style={{ fontSize: 16 }}>{s.score}</span>
                      <span className="score-max">/{s.assignment?.max_score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
