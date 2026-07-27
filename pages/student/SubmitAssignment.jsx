import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { ArrowRight, Send, CheckCircle, Star, AlertCircle, Clock } from 'lucide-react'

export default function SubmitAssignment() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [assignment, setAssignment] = useState(null)
  const [submission, setSubmission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile?.id) fetchData()
  }, [profile, id])

  const fetchData = async () => {
    const [{ data: asgn }, { data: sub }] = await Promise.all([
      supabase.from('assignments').select('*, course:courses(title)').eq('id', id).single(),
      supabase.from('submissions').select('*').eq('assignment_id', id).eq('student_id', profile.id).single()
    ])
    setAssignment(asgn)
    if (sub) {
      setSubmission(sub)
      setAnswer(sub.text_answer)
    }
    setLoading(false)
  }

  const isOverdue = () => assignment?.due_date && new Date(assignment.due_date) < new Date()
  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim()) {
      setError('يرجى كتابة إجابتك')
      return
    }
    setError('')
    setSubmitting(true)

    try {
      const { error: insertError } = await supabase.from('submissions').insert({
        assignment_id: id,
        student_id: profile.id,
        text_answer: answer.trim(),
        status: 'pending',
      })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => navigate('/student/assignments'), 2500)
    } catch (err) {
      if (err.code === '23505') {
        setError('لقد سلّمت هذا الواجب مسبقاً')
      } else {
        setError('حدث خطأ أثناء التسليم. حاول مرة أخرى.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="flex-center" style={{ padding: 80 }}><div className="spinner"></div></div>
  if (!assignment) return <div className="empty-state"><p>الواجب غير موجود</p></div>

  return (
    <div>
      <button className="btn btn-secondary btn-sm mb-16" onClick={() => navigate('/student/assignments')}>
        <ArrowRight size={16} /> العودة للواجبات
      </button>

      <div className="page-header">
        <h2>{assignment.title}</h2>
        <div className="flex-gap mt-8">
          <span className="badge badge-primary">📚 {assignment.course?.title}</span>
          <span className="badge badge-muted">⭐ {assignment.max_score} درجة</span>
          {assignment.due_date && (
            <span className={`badge ${isOverdue() ? 'badge-danger' : 'badge-warning'}`}>
              <Clock size={11} /> {formatDate(assignment.due_date)}
            </span>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Assignment Description */}
        <div className="card">
          <div className="card-header">
            <h3>📋 تفاصيل الواجب</h3>
          </div>
          <div className="card-body">
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 15 }}>
              {assignment.description}
            </div>
          </div>
        </div>

        {/* Submit Form */}
        <div className="card">
          <div className="card-header">
            <h3>{submission ? '📝 إجابتي' : '✍️ كتابة الإجابة'}</h3>
            {submission && (
              <span className={`badge ${submission.status === 'graded' ? 'badge-success' : 'badge-warning'}`}>
                {submission.status === 'graded' ? '✅ مصحح' : '⏳ قيد المراجعة'}
              </span>
            )}
          </div>
          <div className="card-body">
            {success ? (
              <div style={{ textAlign: 'center', padding: 32 }}>
                <CheckCircle size={64} color="var(--success)" style={{ marginBottom: 16 }} />
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>تم تسليم الواجب! 🎉</h3>
                <p style={{ color: 'var(--text-secondary)' }}>سيتم توجيهك تلقائياً...</p>
              </div>
            ) : (
              <>
                {submission?.status === 'graded' && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: 'rgba(0,230,118,0.08)', border: '1px solid rgba(0,230,118,0.2)',
                    borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 20
                  }}>
                    <div className="score-circle">
                      <span className="score-num">{submission.score}</span>
                      <span className="score-max">/{assignment.max_score}</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>درجتك: {submission.score} / {assignment.max_score}</p>
                      {submission.feedback && (
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                          💬 {submission.feedback}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-error">
                    <AlertCircle size={16} /> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="form-group mb-0">
                    <label className="form-label">
                      {submission ? 'إجابتك المُسلَّمة' : 'اكتب إجابتك هنا *'}
                    </label>
                    <textarea
                      id="answer-textarea"
                      className="form-control"
                      placeholder="اكتب إجابتك هنا بالتفصيل..."
                      value={answer}
                      onChange={e => setAnswer(e.target.value)}
                      rows={10}
                      required
                      disabled={!!submission}
                      style={{ minHeight: 200 }}
                    />
                    {!submission && (
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        {answer.length} حرف
                      </p>
                    )}
                  </div>

                  {!submission && (
                    <div className="mt-16">
                      {isOverdue() ? (
                        <div className="alert alert-error">
                          <Clock size={16} /> انتهى وقت تسليم هذا الواجب
                        </div>
                      ) : (
                        <button
                          id="submit-assignment-btn"
                          type="submit"
                          className="btn btn-primary btn-lg w-full"
                          disabled={submitting}
                          style={{ justifyContent: 'center' }}
                        >
                          {submitting
                            ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                            : <><Send size={18} /> تسليم الواجب</>
                          }
                        </button>
                      )}
                    </div>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
