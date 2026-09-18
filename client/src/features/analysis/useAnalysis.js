import { useState, useEffect, useCallback } from 'react'
import {
  getDocument, analyzeDocument, extractClauses,
  extractObligations, extractTimeline,
} from '../../services/api'

export function useAnalysis(documentId) {
  const [document,    setDocument]    = useState(null)
  const [analysis,    setAnalysis]    = useState(null)
  const [clauses,     setClauses]     = useState(null)
  const [obligations, setObligations] = useState(null)
  const [timeline,    setTimeline]    = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  const load = useCallback(async () => {
    if (!documentId) return
    setLoading(true)
    setError(null)
    try {
      const [docData, analysisData, clauseData, obligationData, timelineData] =
        await Promise.all([
          getDocument(documentId),
          analyzeDocument(documentId),
          extractClauses(documentId),
          extractObligations(documentId),
          extractTimeline(documentId),
        ])
      setDocument(docData.document)
      setAnalysis(analysisData)
      setClauses(clauseData)
      setObligations(obligationData)
      setTimeline(timelineData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => { load() }, [load])

  return { document, analysis, clauses, obligations, timeline, loading, error, reload: load }
}
