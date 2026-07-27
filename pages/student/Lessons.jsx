import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { BookOpen, FileText, Video, Code, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TYPE_INFO = {
  html: { label: 'HTML', icon: Code, color: 'lesson-type-html', badge: 'badge-warning' },
  pdf: { label: 'PDF', icon: FileText, color: 'lesson-type-pdf', badge: 'badge-danger' },
  video: { label: 'فيديو', icon: Video, color: 'lesson-type-video', badge: 'badge-primary' },
}

export default function StudentLessons() {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterCourse, setFilterCourse] = useState('')
  const [search, setSearch] = useState('')

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

  const filtered = lessons.filter(l => {
    const matchCourse = !filterCourse || l.course_id === filterCourse
    const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase())
    return matchCourse && matchSearch
  })

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div>
      <div className="page-header">
        <h2>الدروس والشروحات</h2>
        <p>جميع الدروس والمحتوى التعليمي المتاح لك</p>
      </div>

      {/* Filters */}
      <div className="flex-gap mb-24" style={{ flexWrap: 'wrap' }}>
        <select className="form-control" style={{ maxWidth: 220 }} value={filterCourse} onChange={e => setFilterCourse(e.target.value)}>
          <option value="">جميع المواد</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <div className="search-bar" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={16} />
          <input type="text" className="form-control" placeholder="بحث في الدروس..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} درس</span>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: 60 }}><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={64} />
          <h3>لا توجد دروس</h3>
          <p>لم يتم إضافة دروس بعد. تابع المنصة!</p>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(lesson => {
            const info = TYPE_INFO[lesson.type] || TYPE_INFO.html
            const Icon = info.icon
            return (
              <div className="lesson-card" key={lesson.id} onClick={() => navigate(`/student/lessons/${lesson.id}`)}>
                <div className="flex-between mb-12">
                  <div className={`lesson-type-icon ${info.color}`}>
                    <Icon size={22} />
                  </div>
                  <span className={`badge ${info.badge}`}>{info.label}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{lesson.title}</h3>
                {lesson.description && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                    {lesson.description}
                  </p>
                )}
                <div className="flex-gap">
                  <span className="badge badge-muted">📚 {lesson.course?.title}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10 }}>{formatDate(lesson.created_at)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
