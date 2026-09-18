import { useState, useRef, useEffect } from 'react'
import { Send, Scale, Sparkles, Lightbulb } from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
 * InlineLegalChat — embedded in Dashboard/Upload right sidebar.
 * Same knowledge base as LegalChatWidget, but always visible (no toggle).
 * ─────────────────────────────────────────────────────────────────────────────*/

const SUGGESTIONS = [
  'What is a notice period?',
  'What does indemnification mean?',
  'What is an NDA?',
  'What is non-solicitation?',
  'Who owns work IP?',
  'What is arbitration?',
]

const KB = [
  { patterns: ['notice period', 'notice'], answer: '**Notice period** — the time either party must give before ending employment. Common periods are 30, 60, or 90 days. The longer the period, the more planning time is required for both sides.' },
  { patterns: ['indemnification', 'indemnify', 'indemnity'], answer: '**Indemnification** — a clause where one party agrees to compensate the other for specific losses or legal costs. Common in service contracts and employment agreements.' },
  { patterns: ['nda', 'non-disclosure', 'non disclosure', 'confidentiality agreement'], answer: '**NDA (Non-Disclosure Agreement)** — prohibits sharing confidential information. Usually specifies what counts as confidential, who it applies to, and for how long (often 2–5 years after employment ends).' },
  { patterns: ['non-solicitation', 'non solicitation', 'solicitation'], answer: '**Non-solicitation** — restricts an employee from approaching the company\'s clients or staff for a period after leaving (e.g. 12–18 months). The lookback window for "material contact" matters as much as the duration.' },
  { patterns: ['ip', 'intellectual property', 'copyright', 'invention', 'work product', 'who owns'], answer: '**IP assignment** — work created using company time or resources generally belongs to the employer. Check if the clause covers personal side projects and whether there\'s a disclosure requirement before you start.' },
  { patterns: ['arbitration'], answer: '**Arbitration** — a private dispute resolution process. An arbitrator (not a judge) makes a binding decision. Faster and more private than court, but may limit some legal remedies.' },
  { patterns: ['force majeure'], answer: '**Force majeure** — excuses a party from performance during extraordinary events (disasters, pandemics). Check exactly what qualifies and whether it suspends or terminates obligations.' },
  { patterns: ['liquidated damages', 'liquidated'], answer: '**Liquidated damages** — a pre-agreed compensation amount for a specific breach. Valid if it\'s a genuine estimate of loss; unenforceable if it\'s a penalty.' },
  { patterns: ['probation', 'probationary'], answer: '**Probation period** — a trial phase (typically 3–6 months) with shorter notice on either side. Performance is assessed and employment is confirmed in writing on completion.' },
  { patterns: ['governing law', 'jurisdiction'], answer: '**Governing law** — which country\'s laws apply. **Jurisdiction** — which courts can hear disputes. Both matter if a disagreement arises, especially across borders.' },
  { patterns: ['severability'], answer: '**Severability** — if one clause is unenforceable, the rest of the contract remains valid. Prevents the whole agreement from failing because of one bad provision.' },
  { patterns: ['pilon', 'payment in lieu', 'lieu of notice'], answer: '**PILON (Payment in Lieu of Notice)** — the employer pays the salary equivalent of the notice period instead of requiring the employee to work it out. Allows immediate separation.' },
  { patterns: ['garden leave', 'gardening leave'], answer: '**Garden leave** — employee stays away from work during notice but remains employed and paid. Prevents access to sensitive information and new employment during the notice period.' },
  { patterns: ['non-compete', 'non compete', 'restraint of trade'], answer: '**Non-compete / restraint of trade** — limits what you can do after leaving, such as joining a competitor. Enforceability varies widely by jurisdiction — always seek legal advice on these.' },
  { patterns: ['ctc', 'cost to company', 'gross salary', 'take home'], answer: '**CTC (Cost to Company)** — total annual employment cost including salary and benefits. Your actual take-home pay will be lower after tax deductions and employee contributions.' },
  { patterns: ['training', 'training cost', 'recovery', 'bond'], answer: '**Training cost recovery** — if the company funds training and you resign within a set period, you may owe back a portion of the cost. Check the cap amount, the time window, and whether it applies if the company terminates you.' },
  { patterns: ['clauselens', 'how does it work', 'what can you do', 'about'], answer: '**ClauseLens** analyses legal documents to identify important clauses, answer questions grounded in the text, compare versions, and prepare consultation briefs. Upload a PDF from the Upload page to get started.' },
]

const OUT_OF_SCOPE = ['sue', 'lawsuit', 'legal action', 'file a case', 'should i sign', 'is this enforceable', 'is this legal', 'will i win']

function findAnswer(q) {
  const lower = q.toLowerCase()
  if (OUT_OF_SCOPE.some(p => lower.includes(p))) {
    return "I can explain legal terms and document concepts, but I can't advise on legal strategy or whether to sign. For that, please consult a qualified legal professional."
  }
  let best = null, bestScore = 0
  for (const entry of KB) {
    for (const p of entry.patterns) {
      if (lower.includes(p) && p.length > bestScore) { bestScore = p.length; best = entry }
    }
  }
  return best?.answer || "I'm here to explain legal terms — try asking about a specific clause type, like 'notice period', 'confidentiality', or 'IP assignment'."
}

function FormattedText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
          : part.split('\n').map((line, j, arr) => (
              <span key={`${i}-${j}`}>{line}{j < arr.length - 1 && <br />}</span>
            ))
      )}
    </span>
  )
}

function TypingDots() {
  return (
    <div className="flex gap-1 items-center px-3 py-2.5 bg-gray-100 rounded-xl rounded-bl-sm w-fit">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
          style={{ animation: `typing-bounce 1s ease-in-out ${i * 200}ms infinite` }} />
      ))}
    </div>
  )
}

export default function InlineLegalChat() {
  const [messages, setMessages] = useState([
    { id: 0, role: 'assistant', text: 'Ask me about any legal term or clause concept — notice periods, confidentiality, IP, arbitration, and more.' },
  ])
  const [input,  setInput]  = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const send = async (text) => {
    const q = (text || input).trim()
    if (!q) return
    setInput('')
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: q }])
    setTyping(true)
    await new Promise(r => setTimeout(r, 150 + Math.random() * 350))
    setTyping(false)
    setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: findAnswer(q) }])
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-200 flex-shrink-0 bg-blue-500">
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">Legal Assistant</p>
          <p className="text-xs text-blue-100 mt-0.5">Legal terms &amp; concepts</p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="px-3 py-1.5 bg-yellow-50 border-b border-yellow-100 flex-shrink-0">
        <p className="text-xs text-yellow-700">Explains concepts only — not legal advice.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5">
                <Sparkles className="w-3 h-3 text-blue-500" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white rounded-br-sm'
                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? <FormattedText text={msg.text} /> : msg.text}
            </div>
          </div>
        ))}
        {typing && <div className="flex justify-start"><div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mr-1.5 mt-0.5"><Sparkles className="w-3 h-3 text-blue-500" /></div><TypingDots /></div>}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions — only while no replies */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="flex items-center gap-1 mb-2"><Lightbulb className="w-3 h-3 text-gray-400" /><span className="text-xs text-gray-400 font-medium">Try asking</span></div>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 rounded-full px-2.5 py-1 transition-colors">
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
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Ask about a legal term…"
            rows={1}
            maxLength={300}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
            disabled={typing}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || typing}
            className="w-7 h-7 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Send"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
