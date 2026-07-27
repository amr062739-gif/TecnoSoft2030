import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, ClipboardList, X, AlertCircle, Calendar } from 'lucide-react'

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ course_id: '', title: '', description: '', due_date: '', max_score: 100 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCourse, setFilterCourse] = useState('')

  useEffect(() => {
    fetchAssignments()
    fetchCourses()
  }, [])

  const fetchAssignments = async () => {
    const { data } = await supabase
      .from('assignments')
      .select('*, course:courses(title), submissions(count)')
      .order('created_at', { ascending: false })
    setAssignments(data || [])
    setLoading(false)
  }

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, title').order('title')
    setCourses(data || [])
  }

  const openModal = (assignment = null) => {
    setEditing(assignment)
    setForm(assignment ? {
      course_id: assignment.course_id || '',
      title: assignment.title || '',
      description: assignment.description || '',
      due_date: assignment.due_date ? assignment.due_date.slice(0, 16) : '',
      max_score: assignment.max_score || 100,
    } : { course_id: courses[0]?.id || '', title: '', description: '', due_date: '', max_score: 100 })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        course_id: form.course_id,
        title: form.title,
        description: form.description,
        due_date: form.due_date || null,
        max_score: parseInt(form.max_score) || 100,
      }
      if (editing) {
        const { error } = await supabase.from('assignments').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('assignments').insert(payload)
        if (error) throw error
      }
      setShowModal(false)
      fetchAssignments()
    } catch (err) {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const deleteAssignment = async (id) => {
    if (!confirm('حذف الواجب سيحذف جميع حلول الطلاب له. هل أنت متأكد؟')) return
    await supabase.from('assignments').delete().eq('id', id)
    fetchAssignments()
  }

  const isExpired = (due_date) => due_date && new Date(due_date) < new Date()
  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  const filtered = filterCourse ? assignments.filter(a => a.course_id === filterCourse) : assignments

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>الواجبات والمهام</h2>
          <p>إنشاء وإدارة الواجبات المُرسَلة للطلاب</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> إضافة واجب
        </button>
      </div>

      {/* Filter */}
      <div className="flex-gap mb-24">
        <select className="form-control" style={{ maxWidth: 220 }} value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">جميع المواد</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} واجب</span>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={64} />
          <h3>لا توجد واجبات بعد</h3>
          <p>أنشئ أول واجب لطلابك</p>
          <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} /> إضافة واجب</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(assignment => (
            <div className="assignment-card" key={assignment.id}>
              <div className="flex-between">
                <div style={{ flex: 1 }}>
                  <div className="flex-gap mb-8">
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{assignment.title}</h3>
                    {isExpired(assignment.due_date) && <span className="badge badge-danger">منتهي</span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 12 }}>
                    {assignment.description}
                  </p>
                  <div className="flex-gap" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <span className="badge badge-primary">📚 {assignment.course?.title}</span>
                    <span className="badge badge-success">⭐ {assignment.max_score} درجة</span>
                    <span className="badge badge-cyan">📋 {assignment.submissions?.[0]?.count || 0} حل مُسلَّم</span>
                    {assignment.due_date && (
                      <span className={`badge ${isExpired(assignment.due_date) ? 'badge-danger' : 'badge-warning'}`}>
                        <Calendar size={11} /> {formatDate(assignment.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-gap" style={{ marginRight: 16, flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal(assignment)}><Pencil size={14} /></button>
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteAssignment(assignment.id)}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3>{editing ? 'تعديل الواجب' : 'إضافة واجب جديد'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}
              <form onSubmit={handleSave}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">المادة الدراسية *</label>
                    <select className="form-control" value={form.course_id}
                      onChange={e => setForm(p => ({ ...p, course_id: e.target.value }))} required>
                      <option value="">اختر المادة</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">أعلى درجة</label>
                    <input type="number" className="form-control" value={form.max_score} min={1} max={1000}
                      onChange={e => setForm(p => ({ ...p, max_score: e.target.value }))} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">عنوان الواجب *</label>
                  <input className="form-control" placeholder="مثال: واجب الأسبوع الأول" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label">وصف الواجب / الأسئلة *</label>
                  <textarea className="form-control" placeholder="اكتب تفاصيل الواجب والأسئلة هنا..." value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={5} required />
                </div>

                <div className="form-group">
                  <label className="form-label">موعد التسليم (اختياري)</label>
                  <input type="datetime-local" className="form-control" value={form.due_date}
                    onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} dir="ltr" />
                </div>

                <div className="flex-gap mt-8">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : (editing ? 'حفظ التعديلات' : 'إضافة الواجب')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
