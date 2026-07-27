import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { CheckSquare, X, Star, MessageSquare, AlertCircle, Eye } from 'lucide-react'

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedSub, setSelectedSub] = useState(null)
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' })
  const [grading, setGrading] = useState(false)
  const [gradeError, setGradeError] = useState('')

  useEffect(() => { fetchSubmissions() }, [])

  const fetchSubmissions = async () => {
    const { data } = await supabase
      .from('submissions')
      .select(`
        id, text_answer, score, feedback, status, submitted_at, graded_at,
        student:profiles!submissions_student_id_fkey(full_name, email),
        assignment:assignments!submissions_assignment_id_fkey(title, max_score, course:courses(title))
      `)
      .order('submitted_at', { ascending: false })
    setSubmissions(data || [])
    setLoading(false)
  }

  const openGradeModal = (sub) => {
    setSelectedSub(sub)
    setGradeForm({ score: sub.score ?? '', feedback: sub.feedback ?? '' })
    setGradeError('')
  }

  const handleGrade = async (e) => {
    e.preventDefault()
    setGradeError('')
    const score = parseInt(gradeForm.score)
    if (isNaN(score) || score < 0 || score > selectedSub.assignment.max_score) {
      setGradeError(`الدرجة يجب أن تكون بين 0 و ${selectedSub.assignment.max_score}`)
      return
    }
    setGrading(true)
    try {
      const { error } = await supabase.from('submissions').update({
        score,
        feedback: gradeForm.feedback,
        status: 'graded',
        graded_at: new Date().toISOString()
      }).eq('id', selectedSub.id)
      if (error) throw error
      setSelectedSub(null)
      fetchSubmissions()
    } catch {
      setGradeError('حدث خطأ أثناء الحفظ')
    } finally {
      setGrading(false)
    }
  }

  const getStatusInfo = (status) => ({
    pending: { label: 'معلق', cls: 'badge-warning' },
    graded: { label: 'مصحح', cls: 'badge-success' },
    returned: { label: 'مُعاد', cls: 'badge-primary' },
  }[status] || { label: status, cls: 'badge-muted' })

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const filtered = filterStatus ? submissions.filter(s => s.status === filterStatus) : submissions
  const pending = submissions.filter(s => s.status === 'pending').length

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>حلول الطلاب</h2>
          <p>مراجعة الواجبات المُسلَّمة وإعطاء الدرجات</p>
        </div>
        {pending > 0 && (
          <span className="badge badge-warning" style={{ fontSize: 14, padding: '8px 16px' }}>
            ⏳ {pending} حل بانتظار التصحيح
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="tabs">
        {[
          { value: '', label: 'الكل' },
          { value: 'pending', label: '⏳ معلق' },
          { value: 'graded', label: '✅ مصحح' },
        ].map(t => (
          <button key={t.value} className={`tab-btn ${filterStatus === t.value ? 'active' : ''}`}
            onClick={() => setFilterStatus(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <CheckSquare size={64} />
          <h3>لا توجد حلول</h3>
          <p>لم يُسلِّم الطلاب أي واجبات بعد</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الواجب</th>
                <th>المادة</th>
                <th>تاريخ التسليم</th>
                <th>الحالة</th>
                <th>الدرجة</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => {
                const { label, cls } = getStatusInfo(sub.status)
                return (
                  <tr key={sub.id}>
                    <td>
                      <div>
                        <strong>{sub.student?.full_name}</strong>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }} dir="ltr">{sub.student?.email}</div>
                      </div>
                    </td>
                    <td>{sub.assignment?.title}</td>
                    <td><span className="badge badge-muted">{sub.assignment?.course?.title}</span></td>
                    <td style={{ fontSize: 12 }}>{formatDate(sub.submitted_at)}</td>
                    <td><span className={`badge ${cls}`}>{label}</span></td>
                    <td>
                      {sub.score !== null
                        ? <span style={{ fontWeight: 700, color: 'var(--success)' }}>{sub.score} / {sub.assignment?.max_score}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>
                      }
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => openGradeModal(sub)}>
                        {sub.status === 'pending' ? <><Star size={13} /> تصحيح</> : <><Eye size={13} /> عرض</>}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Grade Modal */}
      {selectedSub && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedSub(null)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>📝 تصحيح الواجب</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedSub(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {/* Info */}
              <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20 }}>
                <div className="flex-between mb-8">
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>الطالب</p>
                    <p style={{ fontWeight: 700 }}>{selectedSub.student?.full_name}</p>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>الواجب</p>
                    <p style={{ fontWeight: 700 }}>{selectedSub.assignment?.title}</p>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  تاريخ التسليم: {formatDate(selectedSub.submitted_at)}
                </p>
              </div>

              {/* Student Answer */}
              <div className="form-group">
                <label className="form-label">إجابة الطالب</label>
                <div style={{
                  background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)',
                  borderRadius: 'var(--radius-md)', padding: 14, fontSize: 14, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto'
                }}>
                  {selectedSub.text_answer}
                </div>
              </div>

              {gradeError && <div className="alert alert-error"><AlertCircle size={16} />{gradeError}</div>}

              <form onSubmit={handleGrade}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">
                      الدرجة (من {selectedSub.assignment?.max_score}) *
                    </label>
                    <input type="number" className="form-control" placeholder="0"
                      min={0} max={selectedSub.assignment?.max_score}
                      value={gradeForm.score} onChange={e => setGradeForm(p => ({ ...p, score: e.target.value }))} required />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 0 }}>
                    {gradeForm.score !== '' && (
                      <div className="score-circle" style={{ marginBottom: 0 }}>
                        <span className="score-num">{gradeForm.score || '0'}</span>
                        <span className="score-max">/{selectedSub.assignment?.max_score}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">ملاحظات وتغذية راجعة</label>
                  <textarea className="form-control" placeholder="اكتب ملاحظاتك للطالب هنا (اختياري)..."
                    value={gradeForm.feedback} onChange={e => setGradeForm(p => ({ ...p, feedback: e.target.value }))} rows={3} />
                </div>

                <div className="flex-gap">
                  <button type="submit" className="btn btn-success" disabled={grading}>
                    {grading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : <><Star size={16} /> حفظ الدرجة</>}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedSub(null)}>إغلاق</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
