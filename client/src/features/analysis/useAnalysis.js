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
      // Fetch the document metadata first, then fire AI requests sequentially
      // to avoid simultaneously hammering the AI API and triggering rate limits.
      const docData = await getDocument(documentId)
      setDocument(docData.document)

      // Small stagger between each AI request to avoid overload
      const analysisData = await analyzeDocument(documentId)
      setAnalysis(analysisData)

      await new Promise(r => setTimeout(r, 300))
      const clauseData = await extractClauses(documentId)
      setClauses(clauseData)

      await new Promise(r => setTimeout(r, 300))
      const obligationData = await extractObligations(documentId)
      setObligations(obligationData)

      await new Promise(r => setTimeout(r, 300))
      const timelineData = await extractTimeline(documentId)
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
