import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, FileText, Video, Code, X, AlertCircle, ExternalLink } from 'lucide-react'

const TYPES = [
  { value: 'html', label: 'محتوى HTML', icon: Code, color: 'lesson-type-html' },
  { value: 'pdf', label: 'ملف PDF', icon: FileText, color: 'lesson-type-pdf' },
  { value: 'video', label: 'رابط فيديو', icon: Video, color: 'lesson-type-video' },
]

export default function AdminLessons() {
  const [lessons, setLessons] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ course_id: '', title: '', description: '', type: 'html', content_url: '', html_content: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCourse, setFilterCourse] = useState('')

  useEffect(() => {
    fetchLessons()
    fetchCourses()
  }, [])

  const fetchLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*, course:courses(title)')
      .order('created_at', { ascending: false })
    setLessons(data || [])
    setLoading(false)
  }

  const fetchCourses = async () => {
    const { data } = await supabase.from('courses').select('id, title').order('title')
    setCourses(data || [])
  }

  const openModal = (lesson = null) => {
    setEditing(lesson)
    setForm(lesson ? {
      course_id: lesson.course_id || '',
      title: lesson.title || '',
      description: lesson.description || '',
      type: lesson.type || 'html',
      content_url: lesson.content_url || '',
      html_content: lesson.html_content || '',
    } : { course_id: courses[0]?.id || '', title: '', description: '', type: 'html', content_url: '', html_content: '' })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    if ((form.type === 'pdf' || form.type === 'video') && !form.content_url) {
      setError('يرجى إدخال الرابط')
      setSaving(false)
      return
    }
    if (form.type === 'html' && !form.html_content && !form.content_url) {
      setError('يرجى إدخال محتوى HTML أو رابط ملف HTML')
      setSaving(false)
      return
    }

    try {
      const payload = {
        course_id: form.course_id,
        title: form.title,
        description: form.description,
        type: form.type,
        content_url: form.content_url || null,
        html_content: form.type === 'html' ? form.html_content : null,
      }
      if (editing) {
        const { error } = await supabase.from('lessons').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('lessons').insert(payload)
        if (error) throw error
      }
      setShowModal(false)
      fetchLessons()
    } catch (err) {
      setError('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const deleteLesson = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الدرس؟')) return
    await supabase.from('lessons').delete().eq('id', id)
    fetchLessons()
  }

  const getTypeInfo = (type) => TYPES.find(t => t.value === type) || TYPES[0]

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })

  const filtered = filterCourse ? lessons.filter(l => l.course_id === filterCourse) : lessons

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>الشروحات والدروس</h2>
          <p>إضافة وإدارة الدروس والشروحات للطلاب</p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={16} /> إضافة درس
        </button>
      </div>

      {/* Filter */}
      <div className="flex-gap mb-24">
        <select className="form-control" style={{ maxWidth: 220 }} value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">جميع المواد</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} درس</span>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>لا توجد دروس بعد</h3>
          <p>أضف أول درس لطلابك</p>
          <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16} /> إضافة درس</button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(lesson => {
            const typeInfo = getTypeInfo(lesson.type)
            const Icon = typeInfo.icon
            return (
              <div className="lesson-card" key={lesson.id}>
                <div className="flex-between mb-8">
                  <div className={`lesson-type-icon ${typeInfo.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-gap">
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => openModal(lesson)}><Pencil size={14} /></button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteLesson(lesson.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{lesson.title}</h3>
                {lesson.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.5 }}>{lesson.description}</p>}
                <div className="flex-gap" style={{ flexWrap: 'wrap', marginTop: 12 }}>
                  <span className="badge badge-muted">📚 {lesson.course?.title}</span>
                  <span className={`badge ${lesson.type === 'html' ? 'badge-warning' : lesson.type === 'pdf' ? 'badge-danger' : 'badge-primary'}`}>
                    {typeInfo.label}
                  </span>
                </div>
                {lesson.content_url && (
                  <a href={lesson.content_url} target="_blank" rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm mt-8" style={{ display: 'inline-flex' }}>
                    <ExternalLink size={12} /> فتح الرابط
                  </a>
                )}
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>{formatDate(lesson.created_at)}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h3>{editing ? 'تعديل الدرس' : 'إضافة درس جديد'}</h3>
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
                    <label className="form-label">نوع الشرح *</label>
                    <select className="form-control" value={form.type}
                      onChange={e => setForm(p => ({ ...p, type: e.target.value, content_url: '', html_content: '' }))}>
                      {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">عنوان الدرس *</label>
                  <input className="form-control" placeholder="مثال: مقدمة في المتغيرات" value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                </div>

                <div className="form-group">
                  <label className="form-label">الوصف</label>
                  <textarea className="form-control" placeholder="وصف مختصر للدرس..." value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
                </div>

                {form.type === 'html' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">رابط ملف HTML (اختياري)</label>
                      <input className="form-control" placeholder="https://example.com/lesson.html" value={form.content_url}
                        onChange={e => setForm(p => ({ ...p, content_url: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">أو اكتب محتوى HTML مباشرة</label>
                      <textarea className="form-control" placeholder="<h1>عنوان الدرس</h1><p>محتوى الدرس هنا...</p>"
                        value={form.html_content} onChange={e => setForm(p => ({ ...p, html_content: e.target.value }))}
                        rows={6} style={{ fontFamily: 'monospace', direction: 'ltr', fontSize: 13 }} />
                    </div>
                  </>
                )}

                {form.type === 'pdf' && (
                  <div className="form-group">
                    <label className="form-label">رابط ملف PDF *</label>
                    <input className="form-control" placeholder="https://example.com/lesson.pdf" value={form.content_url}
                      onChange={e => setForm(p => ({ ...p, content_url: e.target.value }))} dir="ltr" required />
                    <p className="form-error" style={{ color: 'var(--text-muted)' }}>
                      💡 يمكنك رفع PDF على Google Drive وانسخ رابط المشاركة
                    </p>
                  </div>
                )}

                {form.type === 'video' && (
                  <div className="form-group">
                    <label className="form-label">رابط الفيديو *</label>
                    <input className="form-control" placeholder="https://www.youtube.com/watch?v=..." value={form.content_url}
                      onChange={e => setForm(p => ({ ...p, content_url: e.target.value }))} dir="ltr" required />
                    <p className="form-error" style={{ color: 'var(--text-muted)' }}>
                      💡 يدعم روابط YouTube وVimeo وغيرها
                    </p>
                  </div>
                )}

                <div className="flex-gap mt-16">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : (editing ? 'حفظ التعديلات' : 'إضافة الدرس')}
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
