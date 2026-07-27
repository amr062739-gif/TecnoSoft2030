import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Plus, Pencil, Trash2, BookOpen, X, AlertCircle } from 'lucide-react'

export default function AdminCourses() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [form, setForm] = useState({ title: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*, lessons(count), assignments(count)')
      .order('created_at', { ascending: false })
    setCourses(data || [])
    setLoading(false)
  }

  const openModal = (course = null) => {
    setEditingCourse(course)
    setForm(course ? { title: course.title, description: course.description || '' } : { title: '', description: '' })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editingCourse) {
        const { error } = await supabase.from('courses')
          .update({ title: form.title, description: form.description })
          .eq('id', editingCourse.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('courses')
          .insert({ title: form.title, description: form.description, admin_id: profile.id })
        if (error) throw error
      }
      setShowModal(false)
      fetchCourses()
    } catch (err) {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const deleteCourse = async (id) => {
    if (!confirm('حذف هذه المادة سيحذف جميع دروسها وواجباتها. هل أنت متأكد؟')) return
    await supabase.from('courses').delete().eq('id', id)
    fetchCourses()
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>المواد الدراسية</h2>
          <p>إدارة المواد والكورسات</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> إضافة مادة
        </button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}><div className="spinner"></div></div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} />
          <h3>لا توجد مواد بعد</h3>
          <p>أضف أول مادة دراسية للبدء</p>
          <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} /> إضافة مادة</button>
        </div>
      ) : (
        <div className="grid-3">
          {courses.map(course => (
            <div className="card" key={course.id}>
              <div className="card-body">
                <div className="flex-between mb-16">
                  <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', background: 'rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BookOpen size={22} color="var(--primary-light)" />
                  </div>
                  <div className="flex-gap">
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal(course)}>
                      <Pencil size={14} />
                    </button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteCourse(course.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{course.title}</h3>
                {course.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
                    {course.description}
                  </p>
                )}
                <div className="flex-gap" style={{ flexWrap: 'wrap' }}>
                  <span className="badge badge-primary">📚 {course.lessons?.[0]?.count || 0} درس</span>
                  <span className="badge badge-cyan">📝 {course.assignments?.[0]?.count || 0} واجب</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>{formatDate(course.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>{editingCourse ? 'تعديل المادة' : 'إضافة مادة جديدة'}</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">اسم المادة *</label>
                  <input className="form-control" placeholder="مثال: البرمجة بلغة Python" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">الوصف</label>
                  <textarea className="form-control" placeholder="وصف مختصر للمادة..." value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3} />
                </div>
                <div className="modal-footer" style={{ padding: 0, marginTop: 8 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : (editingCourse ? 'حفظ التعديلات' : 'إضافة المادة')}
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
