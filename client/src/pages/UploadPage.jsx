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
    /* h-full so the page fills AppLayout's fixed viewport height */
    <div className="flex h-full">

      {/* ── Upload content — scrollable middle ─────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Analyze a document</h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload a PDF to begin. Your document is processed and not stored permanently.
            </p>
          </div>

          {/* ── Side-by-side: upload zone | sample card ─────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">

            {/* Left — drop zone card */}
            <div className="surface-card flex flex-col">
              <div className="px-5 pt-5 pb-2">
                <p className="text-sm font-semibold text-gray-900 mb-1">Upload your document</p>
                <p className="text-xs text-gray-500">PDF · Maximum {MAX_MB} MB</p>
              </div>

              {/* Drop area */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload area — click or drag and drop a PDF"
                onClick={() => !file && inputRef.current?.click()}
                onKeyDown={e => e.key === 'Enter' && !file && inputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`mx-5 mb-4 rounded-lg border-2 border-dashed transition-colors duration-150 cursor-pointer ${
                  dragging ? 'border-blue-400 bg-blue-50'
                  : file   ? 'border-green-300 bg-green-50 cursor-default'
                  :          'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40'
                }`}
              >
                <div className="py-8 px-4 flex flex-col items-center gap-3 text-center">
                  {file ? (
                    <>
                      <CheckCircle2 className="w-9 h-9 text-green-500" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 break-all">{file.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{fmtBytes(file.size)}</p>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); clearFile() }}
                        className="btn-ghost btn-sm text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    </>
                  ) : (
                    <>
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Upload className={`w-5 h-5 ${dragging ? 'text-blue-500' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {dragging ? 'Drop your PDF here' : 'Drag & drop or click'}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">Supports PDF and text files</p>
                      </div>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
                        className="btn-secondary btn-sm"
                      >
                        <FileText className="w-3.5 h-3.5" /> Choose File
                      </button>
                    </>
                  )}
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={e => handleFiles(e.target.files)}
                  className="sr-only"
                />
              </div>

              {/* Error */}
              {(fileError || uploadError) && (
                <div className="mx-5 mb-4 alert-danger" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-sm">{fileError || uploadError}</p>
                </div>
              )}

              {/* Analyze button */}
              <div className="px-5 pb-5 mt-auto">
                <button
                  onClick={handleAnalyze}
                  disabled={!file || !!fileError || uploading}
                  className="btn-primary w-full py-2.5"
                >
                  {uploading ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing…</>
                  ) : (
                    <>Analyze Document <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>

            {/* Right — sample document card */}
            <div className="surface-card flex flex-col p-5 justify-between gap-5">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <Download className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Need a document to try?</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Download our fictional sample employment agreement — it contains realistic
                  clauses perfect for exploring every ClauseLens feature.
                </p>
              </div>

              <div className="space-y-2.5">
                <a
                  href={downloadSampleUrl}
                  download="ClauseLens_Sample_Employment_Agreement.txt"
                  className="btn-secondary w-full justify-center"
                >
                  <Download className="w-4 h-4" /> Download Sample Agreement
                </a>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-tertiary w-full justify-center"
                >
                  Open a sample from Dashboard
                </button>
              </div>

              {/* Privacy note */}
              <div className="flex items-start gap-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
                <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <p>
                  Documents are processed in memory and not stored permanently.
                  Do not upload confidential information you are not authorised to share.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Legal chat sidebar — pinned, h-full matches parent ─────────── */}
      <div className="hidden xl:flex flex-shrink-0 w-80 border-l border-gray-200 bg-white h-full overflow-hidden flex-col">
        <InlineLegalChat />
      </div>

    </div>
  )
}
