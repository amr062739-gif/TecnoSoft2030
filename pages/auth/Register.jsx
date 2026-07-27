import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, verifyInvitation, useInvitation } from '../../lib/supabase'
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!token) {
      setError('رابط الدعوة غير صالح أو مفقود')
      setLoading(false)
      return
    }
    checkInvitation()
  }, [token])

  const checkInvitation = async () => {
    try {
      const { data, error: invError } = await verifyInvitation(token)
      if (invError || !data) {
        setError('رابط الدعوة غير صالح أو منتهي الصلاحية')
      } else {
        setInvitation(data)
      }
    } catch {
      setError('حدث خطأ أثناء التحقق من الدعوة')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }

    if (form.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }

    setSubmitting(true)

    try {
      // Register user with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            role: 'student',
          }
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Mark invitation as used
      await useInvitation(token)

      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError('حدث خطأ أثناء إنشاء الحساب')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">TS</div>
          <h1>TECNO SOFT</h1>
          <p>المنصة التعليمية المتكاملة</p>
        </div>

        {error && !invitation ? (
          <div>
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
            <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
              يرجى التواصل مع مدير المنصة للحصول على رابط دعوة صالح
            </p>
          </div>
        ) : success ? (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle size={64} color="var(--success)" style={{ marginBottom: 16 }} />
            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>تم إنشاء حسابك!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              سيتم توجيهك لصفحة تسجيل الدخول خلال ثوان...
            </p>
          </div>
        ) : (
          <>
            <h2 className="auth-title">إنشاء حساب جديد</h2>
            <p className="auth-subtitle">
              مرحباً! تم دعوتك للانضمام إلى منصة Tecno Soft
              {invitation?.email && (
                <span style={{ display: 'block', color: 'var(--primary-light)', fontSize: '13px', marginTop: '4px' }}>
                  {invitation.email}
                </span>
              )}
            </p>

            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">الاسم الكامل</label>
                <input
                  id="reg-name"
                  type="text"
                  name="fullName"
                  className="form-control"
                  placeholder="أدخل اسمك الكامل"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  className="form-control"
                  value={invitation?.email || ''}
                  disabled
                  dir="ltr"
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-control"
                    placeholder="6 أحرف على الأقل"
                    value={form.password}
                    onChange={handleChange}
                    required
                    dir="ltr"
                    style={{ paddingLeft: '44px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', left: '12px', top: '50%',
                      transform: 'translateY(-50%)', background: 'none',
                      border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px',
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">تأكيد كلمة المرور</label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="أعد كتابة كلمة المرور"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  dir="ltr"
                />
              </div>

              <button
                id="reg-submit"
                type="submit"
                className="btn btn-primary btn-lg w-full"
                disabled={submitting}
                style={{ justifyContent: 'center', marginTop: '8px' }}
              >
                {submitting ? (
                  <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></span>
                ) : (
                  <>
                    <UserPlus size={18} />
                    إنشاء الحساب
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
