import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, X, AlertCircle, ArrowRight,
  Shield, CheckCircle2, Download,
} from 'lucide-react'
import { uploadDocument, downloadSampleUrl } from '../services/api'
import InlineLegalChat from '../components/InlineLegalChat'

const MAX_MB = 10
const MAX_BYTES = MAX_MB * 1024 * 1024

function validateFile(file) {
  if (!file) return 'Please select a file.'
  const ok = file.type === 'application/pdf' ||
             file.type === 'application/x-pdf' ||
             file.name.toLowerCase().endsWith('.pdf') ||
             file.type === 'text/plain' ||
             file.name.toLowerCase().endsWith('.txt')
  if (!ok) return 'Please upload a PDF file.'
  if (file.size > MAX_BYTES) return `File exceeds the ${MAX_MB} MB limit.`
  return null
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export default function UploadPage() {
  const navigate = useNavigate()
  const inputRef = useRef(null)

  const [file,        setFile]        = useState(null)
  const [fileError,   setFileError]   = useState(null)
  const [dragging,    setDragging]    = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const handleFiles = useCallback((files) => {
    const f = files?.[0]
    if (!f) return
    const err = validateFile(f)
    setFileError(err); setUploadError(null)
    setFile(err ? null : f)
  }, [])

  const onDragOver  = e => { e.preventDefault(); setDragging(true) }
  const onDragLeave = e => { e.preventDefault(); setDragging(false) }
  const onDrop      = e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }

  const clearFile = () => {
    setFile(null); setFileError(null); setUploadError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleAnalyze = async () => {
    if (!file) return
    const err = validateFile(file)
    if (err) { setFileError(err); return }
    setUploading(true); setUploadError(null)
    try {
      const result = await uploadDocument(file)
      navigate(`/analysis/${result.documentId}`)
    } catch (e) {
      setUploadError(e.message || "We couldn't analyze this document. Please try another PDF.")
      setUploading(false)
    }
  }

  return (
    <div className="flex min-h-full">

      {/* ── Upload form ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-start justify-center pt-12 pb-12 px-4 sm:px-8">
        <div className="w-full max-w-lg space-y-6">

          {/* Page header */}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Analyze a document</h1>
            <p className="text-sm text-gray-600 mt-1">
              Upload a PDF to begin. Your document is processed and not stored permanently.
            </p>
          </div>

          {/* Drop zone */}
          <div className="surface-card">
            <div
              role="button"
              tabIndex={0}
              aria-label="Upload area — click or drag and drop a PDF"
              onClick={() => !file && inputRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && !file && inputRef.current?.click()}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`m-6 rounded-lg border-2 border-dashed transition-colors duration-150 cursor-pointer ${
                dragging ? 'border-blue-400 bg-blue-50'
                : file   ? 'border-green-300 bg-green-50 cursor-default'
                :          'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
              }`}
            >
              <div className="py-10 px-6 flex flex-col items-center gap-4 text-center">
                {file ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{fmtBytes(file.size)}</p>
                    </div>
                    <button onClick={e => { e.stopPropagation(); clearFile() }} className="btn-ghost btn-sm text-gray-500 hover:text-gray-700">
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      <Upload className={`w-6 h-6 ${dragging ? 'text-blue-500' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{dragging ? 'Drop your PDF here' : 'Upload your PDF'}</p>
                      <p className="text-xs text-gray-500 mt-1">Drag and drop here, or click to choose</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); inputRef.current?.click() }} className="btn-secondary btn-sm">
                      <FileText className="w-3.5 h-3.5" /> Choose PDF
                    </button>
                  </>
                )}
              </div>
              <input ref={inputRef} type="file" accept=".pdf,.txt,application/pdf,text/plain"
                onChange={e => handleFiles(e.target.files)} className="sr-only" />
            </div>

            <p className="text-xs text-gray-500 text-center -mt-2 mb-4">PDF · Maximum {MAX_MB} MB</p>

            {(fileError || uploadError) && (
              <div className="mx-6 mb-4 alert-danger" role="alert">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{fileError || uploadError}</p>
              </div>
            )}

            <div className="px-6 pb-6">
              <button onClick={handleAnalyze} disabled={!file || !!fileError || uploading} className="btn-primary w-full py-2.5">
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</>
                ) : (
                  <>Analyze Document<ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-2.5 text-xs text-gray-500">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
            <p>Your document is processed to generate this analysis. Do not upload documents containing information you are not authorised to share.</p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 divider" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="flex-1 divider" />
          </div>

          {/* Sample download */}
          <div className="surface-card p-5">
            <p className="text-sm font-semibold text-gray-900 mb-1">Need a document to try?</p>
            <p className="text-sm text-gray-600 mb-4">Download our sample employment agreement and upload it above.</p>
            <div className="flex flex-wrap gap-3">
              <a href={downloadSampleUrl} download="ClauseLens_Sample_Employment_Agreement.txt" className="btn-secondary btn-sm">
                <Download className="w-3.5 h-3.5" /> Download Sample Agreement
              </a>
              <button onClick={() => navigate('/dashboard')} className="btn-tertiary btn-sm">
                Open a sample from Dashboard
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Legal chat sidebar ─────────────────────────────────────────── */}
      <div className="hidden xl:flex flex-shrink-0 w-80 border-l border-gray-200 bg-white sticky top-0 h-screen overflow-hidden flex-col">
        <InlineLegalChat />
      </div>

    </div>
  )
}
