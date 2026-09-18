import { useState, useRef } from 'react'
import { Send, MessageSquare, Lightbulb, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react'
import { askQuestion } from '../../services/api'
import SourceTag from '../../components/ui/SourceTag'

const CONFIDENCE_CONFIG = {
  high:   { label: 'High confidence',   cls: 'text-green-600', Icon: CheckCircle2 },
  medium: { label: 'Medium confidence', cls: 'text-yellow-600', Icon: AlertCircle },
  low:    { label: 'Low confidence',    cls: 'text-gray-400',   Icon: HelpCircle  },
}

const SUGGESTED = [
  'What is the notice period?',
  'What happens if I resign?',
  'Is there a training repayment clause?',
  'How long does confidentiality last?',
  'Who owns intellectual property?',
  'What are my major obligations?',
  'What should I clarify before signing?',
  'Does the contract automatically renew?',
]

function Answer({ item }) {
  const conf = CONFIDENCE_CONFIG[item.confidence] || CONFIDENCE_CONFIG.low
  const ConfIcon = conf.Icon

  return (
    <div className="space-y-4">
      {/* Question */}
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-blue-500 text-white rounded-lg rounded-br-sm px-4 py-2.5">
          <p className="text-sm">{item.question}</p>
        </div>
      </div>

      {/* Answer */}
      <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm p-4 space-y-3 shadow-sm">
        {item.outOfScope && (
          <div className="alert-warning text-xs">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
            <p>This question is outside the scope of document-based assistance.</p>
          </div>
        )}

        <div>
          <p className="overline mb-1.5">Answer</p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{item.answer}</p>
        </div>

        {item.suggestion && (
          <p className="text-xs text-gray-500 italic">{item.suggestion}</p>
        )}

        {item.evidence && !item.notFound && !item.outOfScope && (
          <div>
            <p className="overline mb-1.5">Evidence</p>
            <blockquote className="doc-quote">{item.evidence}</blockquote>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <SourceTag section={item.sourceSection} page={item.sourcePage} />
          <span className={`inline-flex items-center gap-1 text-xs ${conf.cls}`}>
            <ConfIcon className="w-3 h-3" aria-hidden="true" />
            {conf.label}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function QAPanel({ documentId }) {
  const [messages, setMessages] = useState([])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)

  const submit = async (q) => {
    const question = (q || input).trim()
    if (!question || loading) return
    setInput(''); setLoading(true)
    try {
      const result = await askQuestion(question, documentId)
      setMessages(prev => [...prev, { question, ...result, id: Date.now() }])
    } catch (err) {
      setMessages(prev => [...prev, {
        question, answer: `Error: ${err.message}`, confidence: 'low', id: Date.now(),
      }])
    } finally {
      setLoading(false)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 100)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-blue-500" aria-hidden="true" />
        <h2 className="text-sm font-semibold text-gray-900">Ask about this document</h2>
      </div>

      {/* Conversation */}
      <div className="flex-1 overflow-y-auto space-y-5 min-h-0 pr-1 mb-4">
        {messages.length === 0 && (
          <div className="py-8 text-center">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-gray-500">Ask a question about this document.</p>
            <p className="text-xs text-gray-400 mt-1">Every answer is grounded in the document text.</p>
          </div>
        )}
        {messages.map(msg => <Answer key={msg.id} item={msg} />)}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 150, 300].map(delay => (
                  <div
                    key={delay}
                    className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div className="mb-3 flex-shrink-0">
          <div className="flex items-center gap-1.5 mb-2">
            <Lightbulb className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
            <span className="text-xs text-gray-500 font-medium">Suggested questions</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED.map(q => (
              <button
                key={q}
                onClick={() => submit(q)}
                className="text-xs px-2.5 py-1.5 rounded-full bg-gray-100 border border-gray-200
                           text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200
                           transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex-shrink-0 border border-gray-300 rounded-lg bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
        <div className="flex items-end gap-2 p-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Ask a question about this document…"
            rows={2}
            maxLength={500}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
            aria-label="Question input"
            disabled={loading}
          />
          <button
            onClick={() => submit()}
            disabled={!input.trim() || loading}
            className="btn-primary p-2 flex-shrink-0"
            aria-label="Send"
          >
            <Send className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <p className="text-xs text-gray-400 px-3 pb-2">Press Enter to send · Answers are grounded in the document</p>
      </div>
    </div>
  )
}
