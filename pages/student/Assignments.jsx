import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle, Star, Send, Eye } from 'lucide-react'

export default function StudentAssignments() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (profile?.id) {
      fetchData()
    }
  }, [profile])

  const fetchData = async () => {
    const [{ data: asgns }, { data: subs }] = await Promise.all([
      supabase.from('assignments').select('*, course:courses(title)').order('created_at', { ascending: false }),
      supabase.from('submissions').select('*').eq('student_id', profile.id)
    ])
    setAssignments(asgns || [])
    const subsMap = {}
    ;(subs || []).forEach(s => { subsMap[s.assignment_id] = s })
    setSubmissions(subsMap)
    setLoading(false)
  }

  const isOverdue = (due_date) => due_date && new Date(due_date) < new Date()
  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const filtered = assignments.filter(a => {
    if (filter === 'pending') return !submissions[a.id]
    if (filter === 'submitted') return submissions[a.id]
    return true
  })

  const getStatusInfo = (assignment) => {
    const sub = submissions[assignment.id]
    if (!sub) {
      if (isOverdue(assignment.due_date)) return { label: 'منتهي ولم تُسلِّم', cls: 'badge-danger', icon: Clock }
      return { label: 'لم تُسلِّم بعد', cls: 'badge-warning', icon: ClipboardList }
    }
    if (sub.status === 'graded') return { label: `مصحح - ${sub.score}/${assignment.max_score}`, cls: 'badge-success', icon: Star }
    return { label: 'قيد المراجعة', cls: 'badge-primary', icon: CheckCircle }
  }

  return (
    <div>
      <div className="page-header">
        <h2>الواجبات</h2>
        <p>جميع الواجبات الموكلة إليك</p>
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {[
          { value: 'all', label: 'الكل' },
          { value: 'pending', label: '⏳ لم تُسلِّم' },
          { value: 'submitted', label: '✅ سلّمتها' },
        ].map(t => (
          <button key={t.value} className={`tab-btn ${filter === t.value ? 'active' : ''}`}
            onClick={() => setFilter(t.value)}>{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={64} />
          <h3>لا توجد واجبات</h3>
          <p>لم يتم إضافة واجبات في هذه الفئة</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(assignment => {
            const sub = submissions[assignment.id]
            const statusInfo = getStatusInfo(assignment)
            const StatusIcon = statusInfo.icon
            return (
              <div className="assignment-card" key={assignment.id}>
                <div className="flex-between">
                  <div style={{ flex: 1 }}>
                    <div className="flex-gap mb-8">
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>{assignment.title}</h3>
                      <span className={`badge ${statusInfo.cls}`}>
                        <StatusIcon size={11} /> {statusInfo.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12, whiteSpace: 'pre-wrap' }}>
                      {assignment.description.length > 200 ? assignment.description.slice(0, 200) + '...' : assignment.description}
                    </p>
                    <div className="flex-gap" style={{ flexWrap: 'wrap', gap: 8 }}>
                      <span className="badge badge-primary">📚 {assignment.course?.title}</span>
                      <span className="badge badge-muted">⭐ {assignment.max_score} درجة</span>
                      {assignment.due_date && (
                        <span className={`badge ${isOverdue(assignment.due_date) ? 'badge-danger' : 'badge-warning'}`}>
                          <Clock size={11} /> {formatDate(assignment.due_date)}
                        </span>
                      )}
                    </div>

                    {/* Graded feedback */}
                    {sub?.status === 'graded' && sub.feedback && (
                      <div className="alert alert-success mt-8" style={{ margin: 0, marginTop: 12 }}>
                        <Star size={14} />
                        <div>
                          <strong>ملاحظات المدرس:</strong>
                          <p style={{ margin: 0 }}>{sub.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ marginRight: 16, flexShrink: 0 }}>
                    {!sub ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate(`/student/assignments/${assignment.id}/submit`)}
                        disabled={isOverdue(assignment.due_date)}
                      >
                        <Send size={15} /> تسليم
                      </button>
                    ) : (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/student/assignments/${assignment.id}/submit`)}
                      >
                        <Eye size={14} /> عرض إجابتي
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
