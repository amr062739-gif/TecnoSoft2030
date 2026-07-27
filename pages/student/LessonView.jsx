import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ArrowRight, FileText, Video, Code, ExternalLink } from 'lucide-react'

function getYouTubeEmbedUrl(url) {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  const match = url?.match(regex)
  if (match) return `https://www.youtube.com/embed/${match[1]}`
  return url
}

function getPdfEmbedUrl(url) {
  // Google Drive direct link conversion
  if (url?.includes('drive.google.com')) {
    const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
    if (fileId) return `https://drive.google.com/file/d/${fileId}/preview`
  }
  return url
}

export default function LessonView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLesson()
  }, [id])

  const fetchLesson = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*, course:courses(title)')
      .eq('id', id)
      .single()
    setLesson(data)
    setLoading(false)
  }

  if (loading) return <div className="flex-center" style={{ padding: 80 }}><div className="spinner"></div></div>
  if (!lesson) return <div className="empty-state"><p>الدرس غير موجود</p></div>

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <button className="btn btn-secondary btn-sm mb-16" onClick={() => navigate('/student/lessons')}>
          <ArrowRight size={16} /> العودة للدروس
        </button>
        <div className="flex-gap mb-8">
          <h2>{lesson.title}</h2>
          <span className={`badge ${lesson.type === 'html' ? 'badge-warning' : lesson.type === 'pdf' ? 'badge-danger' : 'badge-primary'}`}>
            {lesson.type === 'html' ? 'HTML' : lesson.type === 'pdf' ? 'PDF' : 'فيديو'}
          </span>
        </div>
        <div className="flex-gap">
          <span className="badge badge-muted">📚 {lesson.course?.title}</span>
          {lesson.description && <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{lesson.description}</p>}
        </div>
      </div>

      {/* Content */}
      <div className="lesson-viewer">
        {lesson.type === 'html' && (
          <>
            {lesson.content_url ? (
              <iframe src={lesson.content_url} title={lesson.title} style={{ width: '100%', minHeight: 600, border: 'none' }} />
            ) : lesson.html_content ? (
              <div
                style={{ padding: 32, background: 'white', color: '#1a1a2e', minHeight: 400, lineHeight: 1.8, direction: 'rtl' }}
                dangerouslySetInnerHTML={{ __html: lesson.html_content }}
              />
            ) : (
              <div className="empty-state"><p>لا يوجد محتوى لهذا الدرس</p></div>
            )}
          </>
        )}

        {lesson.type === 'pdf' && lesson.content_url && (
          <>
            <iframe
              src={getPdfEmbedUrl(lesson.content_url)}
              title={lesson.title}
              style={{ width: '100%', height: 700, border: 'none' }}
            />
            <div style={{ padding: 16, borderTop: '1px solid var(--glass-border)', textAlign: 'center' }}>
              <a href={lesson.content_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink size={14} /> فتح في تبويب جديد
              </a>
            </div>
          </>
        )}

        {lesson.type === 'video' && lesson.content_url && (
          <div style={{ padding: 20 }}>
            <div className="video-embed">
              <iframe
                src={getYouTubeEmbedUrl(lesson.content_url)}
                title={lesson.title}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <a href={lesson.content_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                <ExternalLink size={14} /> فتح في موقع الفيديو
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
