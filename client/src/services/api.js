import axios from 'axios'

const TOKEN_KEY = 'cl_token'

const api = axios.create({
  baseURL: '/api',
  timeout: 90000,   // 90s — AI analysis on large documents can take 40-60s
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

// Normalise errors
api.interceptors.response.use(
  res => res.data,
  err => {
    const message = err.response?.data?.error || err.message || 'An unexpected error occurred'
    // Surface HTTP status so callers can distinguish 401 from others
    const error = new Error(message)
    error.status = err.response?.status
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = (name, email, password) =>
  api.post('/auth/register', { name, email, password })

export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password })

export const logoutUser = () =>
  api.post('/auth/logout')

export const getMe = () =>
  api.get('/auth/me')

// ── Documents ─────────────────────────────────────────────────────────────────
export const listDocuments       = ()    => api.get('/documents')
export const getDocument         = (id)  => api.get(`/documents/${id}`)
export const getDocumentSections = (id)  => api.get(`/documents/${id}/sections`)

export const uploadDocument = (file) => {
  const form = new FormData()
  form.append('document', file)
  const token = localStorage.getItem(TOKEN_KEY)
  return axios.post('/api/documents/upload', form, {
    timeout: 60000,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  }).then(r => r.data).catch(err => {
    const msg = err.response?.data?.error || err.message || 'Upload failed'
    return Promise.reject(new Error(msg))
  })
}

export const loadDemoDocument = (documentId = 'employment-v2') =>
  api.post('/documents/demo', { documentId })

export const downloadSampleUrl = '/api/documents/sample'

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analyzeDocument    = (documentId) => api.post('/analysis/analyze',     { documentId })
export const extractClauses     = (documentId) => api.post('/analysis/clauses',     { documentId })
export const extractObligations = (documentId) => api.post('/analysis/obligations', { documentId })
export const extractTimeline    = (documentId) => api.post('/analysis/timeline',    { documentId })

// ── Q&A ───────────────────────────────────────────────────────────────────────
export const askQuestion           = (question, documentId) => api.post('/qa/ask', { question, documentId })
export const getSuggestedQuestions = ()                      => api.get('/qa/suggested')

// ── Comparison ────────────────────────────────────────────────────────────────
export const compareDocuments = (documentAId, documentBId) =>
  api.post('/comparison/compare', { documentAId, documentBId })

// ── Consultation ──────────────────────────────────────────────────────────────
export const generateConsultationBrief = (documentId, concern) =>
  api.post('/consultation/brief', { documentId, concern })

// ── Health ────────────────────────────────────────────────────────────────────
export const checkHealth = () => api.get('/health')
