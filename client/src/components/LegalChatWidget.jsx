import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Scale, ChevronDown, Sparkles } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
 * LegalChatWidget
 * Persistent floating chat panel anchored bottom-right across all app routes.
 * Answers legal-terminology / document-process questions only.
 * No document upload — pure informational Q&A.
 * ─────────────────────────────────────────────────────────────────────────────*/

const SUGGESTIONS = [
  'What is a notice period?',
  'What does "indemnification" mean?',
  'What is an NDA?',
  'What is a non-solicitation clause?',
  'What does IP assignment mean?',
  'What is arbitration?',
  'What is a force majeure clause?',
  'What is a liquidated damages clause?',
]

/* Deterministic knowledge base — no API call needed */
const KB = [
  {
    patterns: ['notice period', 'notice'],
    answer: 'A **notice period** is the amount of time an employee or employer must give before ending employment. It begins when written notice is given. Longer notice periods (e.g. 90 days) give both sides more time to plan the transition.',
  },
  {
    patterns: ['indemnification', 'indemnify', 'indemnity'],
    answer: '**Indemnification** is a contractual obligation where one party agrees to compensate the other for specific losses or damages. It is common in service agreements and employment contracts.',
  },
  {
    patterns: ['nda', 'non-disclosure', 'non disclosure', 'confidentiality agreement'],
    answer: 'An **NDA (Non-Disclosure Agreement)** is a legal contract that prohibits one or both parties from sharing confidential information with third parties. They often specify a duration (e.g. 2–5 years) and what constitutes confidential information.',
  },
  {
    patterns: ['non-solicitation', 'non solicitation', 'solicitation'],
    answer: 'A **non-solicitation clause** restricts a departing employee from approaching the company\'s clients or staff for a period after leaving (e.g. 12–18 months). It aims to protect business relationships.',
  },
  {
    patterns: ['ip assignment', 'intellectual property', 'ip clause', 'copyright', 'invention'],
    answer: 'An **IP assignment clause** transfers ownership of intellectual property (code, designs, inventions) created during employment to the employer. Some clauses are broad and may cover personal side projects — always check the scope.',
  },
  {
    patterns: ['arbitration'],
    answer: '**Arbitration** is a private dispute resolution process where an independent arbitrator makes a binding decision instead of a court. It is often faster and more private than litigation, but may limit your access to some court-based remedies.',
  },
  {
    patterns: ['force majeure'],
    answer: 'A **force majeure clause** excuses a party from performance if extraordinary events outside their control occur (e.g. natural disasters, pandemics). It defines what qualifies and what obligations are suspended.',
  },
  {
    patterns: ['liquidated damages', 'liquidated'],
    answer: '**Liquidated damages** are a pre-agreed amount payable if a specific breach occurs (e.g. failing to hand over IP documents). They must be a genuine pre-estimate of loss, not a penalty.',
  },
  {
    patterns: ['probation', 'probationary'],
    answer: 'A **probation period** (typically 3–6 months) is a trial phase of employment where either party can terminate with shorter notice. Performance is assessed, and the arrangement becomes permanent upon successful completion.',
  },
  {
    patterns: ['governing law', 'jurisdiction'],
    answer: '**Governing law** specifies which country\'s or state\'s laws apply to the contract. **Jurisdiction** specifies which courts can hear disputes. Both matter if a dispute arises.',
  },
  {
    patterns: ['severability'],
    answer: 'A **severability clause** states that if one part of the contract is found unenforceable, the rest remains valid. It prevents the whole contract from being voided due to one bad provision.',
  },
  {
    patterns: ['pilon', 'payment in lieu', 'lieu of notice'],
    answer: '**PILON (Payment in Lieu of Notice)** means the employer pays the employee\'s salary for the notice period instead of requiring them to work it. This allows an immediate end to employment.',
  },
  {
    patterns: ['garden leave', 'gardening leave'],
    answer: '**Garden leave** is when an employee on notice is required to stay away from the workplace but remains employed and paid. It prevents them from starting new employment or accessing sensitive information during the notice period.',
  },
  {
    patterns: ['restraint of trade', 'restrictive covenant', 'non-compete', 'non compete'],
    answer: 'A **restraint of trade / non-compete clause** restricts what you can do after leaving (e.g. joining a competitor). Enforceability varies significantly by jurisdiction — always get legal advice on these.',
  },
  {
    patterns: ['ctc', 'cost to company', 'gross salary', 'take home', 'in-hand'],
    answer: '**CTC (Cost to Company)** is the total annual cost of employing you, including salary, benefits, and employer contributions. Your **take-home (in-hand) salary** will be lower after tax deductions and employee contributions.',
  },
  {
    patterns: ['what is clauselens', 'about clauselens', 'how does clauselens work', 'what can you do'],
    answer: '**ClauseLens** is an AI-powered legal document navigator. It analyses PDFs, extracts clauses, identifies attention areas, answers document-specific questions, and helps prepare for legal consultations. Upload a document from the Dashboard to get started.',
  },
]

const OUT_OF_SCOPE = [
  'sue', 'lawsuit', 'legal action', 'file a case', 'should i sign',
  'is this enforceable', 'is this legal', 'win', 'court',
]

function findAnswer(q) {
  const lower = q.toLowerCase()

  // Safety: out-of-scope check
  if (OUT_OF_SCOPE.some(p => lower.includes(p))) {
    return `I can explain legal terms and document concepts, but I can't advise on legal strategy or whether to sign a contract. For that, please consult a qualified legal professional.\n\nIs there a specific term or clause concept I can explain instead?`
  }

  // KB lookup — score by matched pattern length
  let best = null, bestScore = 0
  for (const entry of KB) {
    for (const pattern of entry.patterns) {
      if (lower.includes(pattern) && pattern.length > bestScore) {
        bestScore = pattern.length
        best = entry
      }
    }
  }

  if (best) return best.answer

  // Fallback
  return `I'm here to explain legal terms and document concepts — things like notice periods, confidentiality clauses, IP assignments, and more.\n\nTry asking me about a specific term from your document, or pick one of the suggestions below.`
}

/* Render markdown-style **bold** */
function FormattedText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
          : part.split('\n').map((line, j, arr) => (
              <span key={`${i}-${j}`}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))
      )}
    </span>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 items-center px-3 py-2.5 bg-gray-100 rounded-xl rounded-bl-sm w-fit">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-gray-400"
          style={{ animation: `typing-bounce 1s ease-in-out ${i * 200}ms infinite` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export default function LegalChatWidget() {
  const [open,     setOpen]     = useState(false)
  const [input,    setInput]    = useState('')
  const [messages, setMessages] = useState([
    {
      id: 0, role: 'assistant',
      text: 'Hi! I can explain legal terms and document concepts — like notice periods, confidentiality clauses, IP assignments, and more.\n\nWhat would you like to know?',
    },
  ])
  const [typing,   setTyping]   = useState(false)
  const [unread,   setUnread]   = useState(0)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing, open])

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0)
  }, [open])

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q) return
    setInput('')

    const userMsg = { id: Date.now(), role: 'user', text: q }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    // Simulate a short thinking delay (150–450ms)
    await new Promise(r => setTimeout(r, 150 + Math.random() * 300))

    const answer = findAnswer(q)
    setTyping(false)
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: answer }])
    if (!open) setUnread(u => u + 1)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14 rounded-full shadow-lg
          flex items-center justify-center
          transition-all duration-200
          ${open
            ? 'bg-gray-700 hover:bg-gray-800 rotate-0'
            : 'bg-blue-500 hover:bg-blue-600'
          }
        `}
        aria-label={open ? 'Close legal assistant' : 'Open legal assistant'}
        aria-expanded={open}
      >
        {open
          ? <ChevronDown className="w-6 h-6 text-white" />
          : <MessageCircle className="w-6 h-6 text-white" />
        }
        {/* Unread badge */}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-400 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat panel ──────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 animate-chat-pop"
          role="dialog"
          aria-label="Legal assistant chat"
          aria-modal="false"
        >
          <div className="bg-white border border-gray-200 rounded-2xl shadow-xl flex flex-col overflow-hidden"
               style={{ maxHeight: '520px' }}>

            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-blue-500 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-none">Legal Assistant</p>
                  <p className="text-xs text-blue-100 mt-0.5">Ask about legal terms &amp; concepts</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Disclaimer strip */}
            <div className="px-3 py-1.5 bg-yellow-50 border-b border-yellow-100 flex-shrink-0">
              <p className="text-xs text-yellow-700">
                <strong>Note:</strong> Explains concepts only — not legal advice.
              </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Sparkles className="w-3 h-3 text-blue-500" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-3 py-2.5 rounded-xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.role === 'assistant'
                      ? <FormattedText text={msg.text} />
                      : msg.text
                    }
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <Sparkles className="w-3 h-3 text-blue-500" />
                  </div>
                  <TypingIndicator />
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions — show when only welcome message */}
            {messages.length === 1 && (
              <div className="px-3 pb-2 flex-shrink-0">
                <p className="text-xs text-gray-400 mb-2 font-medium">Try asking:</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTIONS.slice(0, 4).map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-full px-2.5 py-1 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-100 px-3 py-2.5 flex-shrink-0">
              <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 transition-all">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Ask about a legal term…"
                  rows={1}
                  maxLength={300}
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
                  aria-label="Message input"
                  disabled={typing}
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || typing}
                  className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-colors"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
