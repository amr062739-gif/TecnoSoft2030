import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { UserPlus, Trash2, Copy, Check, Mail, Search, X, AlertCircle } from 'lucide-react'

export default function AdminStudents() {
  const { profile } = useAuth()
  const [students, setStudents] = useState([])
  const [invitations, setInvitations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchStudents()
    fetchInvitations()
  }, [])

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
    setStudents(data || [])
    setLoading(false)
  }

  const fetchInvitations = async () => {
    const { data } = await supabase
      .from('invitations')
      .select('*')
      .eq('used', false)
      .order('created_at', { ascending: false })
    setInvitations(data || [])
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    setInviteError('')
    setGeneratedLink('')
    setInviting(true)

    try {
      // Check if invitation already sent to this email
      const { data: existing } = await supabase
        .from('invitations')
        .select('id')
        .eq('email', inviteEmail)
        .eq('used', false)
        .single()

      if (existing) {
        setInviteError('تم إرسال دعوة لهذا البريد مسبقاً')
        setInviting(false)
        return
      }

      const { data, error } = await supabase
        .from('invitations')
        .insert({ email: inviteEmail, admin_id: profile.id })
        .select()
        .single()

      if (error) throw error

      const baseUrl = window.location.origin + window.location.pathname
      const link = `${baseUrl}#/register?token=${data.token}`
      setGeneratedLink(link)
      setInviteEmail('')
      fetchInvitations()
    } catch (err) {
      setInviteError('حدث خطأ أثناء إنشاء الدعوة')
    } finally {
      setInviting(false)
    }
  }

  const copyLink = async (link, id) => {
    await navigator.clipboard.writeText(link)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const deleteStudent = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return
    await supabase.from('profiles').delete().eq('id', id)
    fetchStudents()
  }

  const deleteInvitation = async (id) => {
    await supabase.from('invitations').delete().eq('id', id)
    fetchInvitations()
  }

  const getInviteLink = (token) => {
    const baseUrl = window.location.origin + window.location.pathname
    return `${baseUrl}#/register?token=${token}`
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'short', day: 'numeric'
  })

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h2>إدارة الطلاب</h2>
          <p>إنشاء دعوات وإدارة حسابات الطلاب</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setShowInviteModal(true); setGeneratedLink(''); }}>
          <UserPlus size={16} />
          دعوة طالب
        </button>
      </div>

      {/* Students Table */}
      <div className="card mb-24">
        <div className="card-header">
          <h3>الطلاب المسجلون ({students.length})</h3>
          <div className="search-bar">
            <Search size={16} />
            <input
              type="text"
              className="form-control"
              placeholder="بحث..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex-center" style={{ padding: 40 }}>
            <div className="spinner"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Mail size={48} />
            <h3>لا يوجد طلاب بعد</h3>
            <p>أرسل دعوات للطلاب ليتمكنوا من التسجيل</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>البريد الإلكتروني</th>
                  <th>تاريخ الانضمام</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td>
                      <div className="flex-gap">
                        <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {s.full_name?.charAt(0) || 'ط'}
                        </div>
                        <strong>{s.full_name}</strong>
                      </div>
                    </td>
                    <td dir="ltr" style={{ textAlign: 'right' }}>{s.email}</td>
                    <td>{formatDate(s.created_at)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm btn-icon"
                        onClick={() => deleteStudent(s.id)}
                        title="حذف"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>الدعوات المُرسَلة ({invitations.length})</h3>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>البريد الإلكتروني</th>
                  <th>تاريخ الإنشاء</th>
                  <th>ينتهي في</th>
                  <th>رابط الدعوة</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(inv => {
                  const link = getInviteLink(inv.token)
                  return (
                    <tr key={inv.id}>
                      <td dir="ltr" style={{ textAlign: 'right' }}>{inv.email}</td>
                      <td>{formatDate(inv.created_at)}</td>
                      <td>{formatDate(inv.expires_at)}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => copyLink(link, inv.id)}
                        >
                          {copiedId === inv.id ? <Check size={14} /> : <Copy size={14} />}
                          {copiedId === inv.id ? 'تم النسخ!' : 'نسخ الرابط'}
                        </button>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => deleteInvitation(inv.id)}>
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowInviteModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>دعوة طالب جديد</h3>
              <button className="btn btn-secondary btn-icon" onClick={() => setShowInviteModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              {inviteError && (
                <div className="alert alert-error">
                  <AlertCircle size={16} />
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInvite}>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني للطالب</label>
                  <input
                    id="invite-email"
                    type="email"
                    className="form-control"
                    placeholder="student@example.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>

                <button type="submit" className="btn btn-primary w-full" disabled={inviting} style={{ justifyContent: 'center' }}>
                  {inviting ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : <><Mail size={16} /> إنشاء رابط الدعوة</>}
                </button>
              </form>

              {generatedLink && (
                <div style={{ marginTop: 20 }}>
                  <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 8 }}>
                    ✅ تم إنشاء رابط الدعوة! انسخه وأرسله للطالب:
                  </p>
                  <div className="invite-link-box">
                    <span>{generatedLink}</span>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => copyLink(generatedLink, 'new')}
                    >
                      {copiedId === 'new' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                    ⚠️ الرابط صالح لمدة 7 أيام فقط
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
