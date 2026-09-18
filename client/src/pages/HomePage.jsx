import { Link } from 'react-router-dom'
import {
  Search, GitCompare, CheckSquare, Clock,
  BookOpen, Shield, ArrowRight, FileText,
  Star, Zap, Lock,
} from 'lucide-react'

/* ── How-it-works steps ─────────────────────────────────────────────────── */
const STEPS = [
  { n: '01', title: 'Create account', desc: 'Sign up free in seconds — no credit card.',   color: 'bg-blue-500'   },
  { n: '02', title: 'Upload PDF',      desc: 'Drop in any legal document up to 10 MB.',     color: 'bg-red-400'    },
  { n: '03', title: 'Get analysis',    desc: 'Clauses, obligations, and attention areas.',   color: 'bg-yellow-400' },
  { n: '04', title: 'Ask questions',   desc: 'Query the document in plain English.',         color: 'bg-green-500'  },
  { n: '05', title: 'Prepare',         desc: 'Export a lawyer consultation brief.',          color: 'bg-orange-400' },
]

/* ── Fake document preview lines ────────────────────────────────────────── */
const DOC_LINES = [
  { w: 'w-full',  color: 'bg-gray-200' },
  { w: 'w-5/6',  color: 'bg-gray-200' },
  { w: 'w-4/5',  color: 'bg-gray-200' },
  { w: 'w-full',  color: 'bg-gray-200' },
  { w: 'w-3/4',  color: 'bg-gray-200' },
  { w: 'w-full',  color: 'bg-yellow-200' }, // highlighted
  { w: 'w-5/6',  color: 'bg-yellow-200' }, // highlighted
  { w: 'w-4/5',  color: 'bg-gray-200' },
  { w: 'w-full',  color: 'bg-gray-200' },
  { w: 'w-2/3',  color: 'bg-red-200' },    // flagged
]

function DocumentMockup() {
  return (
    <div className="animate-float relative w-full max-w-xs mx-auto">
      {/* Shadow layers for depth */}
      <div className="absolute inset-0 translate-x-3 translate-y-3 bg-blue-100 rounded-xl opacity-60" />
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-blue-50 rounded-xl" />

      {/* Main card */}
      <div className="relative bg-white rounded-xl shadow-lg border border-gray-200 p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="h-2 w-24 bg-gray-200 rounded-full" />
        </div>

        {/* Title bar */}
        <div className="h-3 w-40 bg-gray-300 rounded-full" />

        {/* Text lines */}
        <div className="space-y-2 pt-1">
          {DOC_LINES.map((l, i) => (
            <div key={i} className={`h-2 ${l.w} ${l.color} rounded-full`} />
          ))}
        </div>

        {/* Attention badge */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          <div className="h-2 w-32 bg-red-200 rounded-full" />
          <div className="h-2 w-16 bg-red-100 rounded-full ml-auto" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
          <div className="h-2 w-24 bg-yellow-200 rounded-full" />
          <div className="h-2 w-20 bg-yellow-100 rounded-full ml-auto" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <div className="h-2 w-28 bg-green-200 rounded-full" />
          <div className="h-2 w-12 bg-green-100 rounded-full ml-auto" />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="bg-white overflow-x-hidden">

      {/* ── HERO — blue-tinted background ────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #E8F0FE 0%, #ffffff 50%, #E6F4EA 100%)' }}
        aria-labelledby="hero-heading"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-green-200/40 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-yellow-200/30 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left copy */}
            <div>
              {/* Google-dot badge */}
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm mb-8 animate-fade-up">
                <span className="flex gap-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="w-2 h-2 rounded-full bg-yellow-400" />
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                </span>
                <span className="text-xs font-semibold text-gray-600">AI Legal Document Intelligence</span>
              </div>

              <h1
                id="hero-heading"
                className="text-5xl lg:text-6xl font-semibold text-gray-900 leading-tight tracking-tight mb-6 animate-fade-up delay-100"
              >
                Understand<br />
                the <span className="text-blue-500">fine print.</span><br />
                <span className="text-green-600">Know what to</span><br />
                <span className="text-red-400">ask next.</span>
              </h1>

              <p className="text-lg text-gray-600 leading-relaxed mb-8 max-w-lg animate-fade-up delay-200">
                ClauseLens uses AI to help you understand complex legal documents, identify
                important provisions, and prepare questions for a legal professional.
              </p>

              <div className="flex flex-wrap gap-3 mb-6 animate-fade-up delay-300">
                <Link to="/signup" className="btn-primary btn-lg shadow-md hover:shadow-lg transition-shadow">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/signin" className="btn-secondary btn-lg">
                  Sign In
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-xs text-gray-400 animate-fade-up delay-400">
                No credit card required · Documents processed in memory, never stored
              </p>

              {/* Social proof mini row */}
              <div className="flex items-center gap-4 mt-8 animate-fade-up delay-500">
                <div className="flex -space-x-2">
                  {['bg-blue-400', 'bg-green-400', 'bg-yellow-400', 'bg-red-400'].map((c, i) => (
                    <div key={i} className={`w-7 h-7 rounded-full ${c} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-xs text-gray-500">Trusted for document review preparation</p>
                </div>
              </div>
            </div>

            {/* Right — animated document mockup */}
            <div className="hidden lg:block animate-fade-in delay-300">
              <DocumentMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <div className="border-t border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '10+',   label: 'Clause categories',    color: 'text-blue-500'   },
              { value: '100%',  label: 'Source-backed answers', color: 'text-green-600'  },
              { value: '< 30s', label: 'Analysis time',         color: 'text-yellow-600' },
              { value: '0',     label: 'Documents stored',       color: 'text-red-500'    },
            ].map(s => (
              <div key={s.label}>
                <p className={`text-3xl font-bold mb-1 ${s.color}`}>{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Capabilities — rich alternating + grid ────────────────────────── */}
      <section className="py-24 overflow-hidden" aria-labelledby="features-heading">

        {/* Header on a colored band */}
        <div className="bg-gray-50 border-y border-gray-200 py-14 mb-20">
          <div className="max-w-6xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 shadow-sm mb-5">
              <span className="flex gap-0.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Capabilities</span>
            </div>
            <h2 id="features-heading" className="text-4xl font-semibold text-gray-900 mb-4">
              Everything you need to understand<br className="hidden sm:block" /> a legal document
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Every finding traces back to the exact clause it came from — always cited, never hallucinated.
            </p>
          </div>
        </div>

        {/* ── Top 3 — alternating showcase rows ── */}
        <div className="max-w-6xl mx-auto px-6 space-y-16 mb-20">
          {[
            {
              Icon: Search,      iconBg: 'bg-blue-500',   tag: 'Analysis',
              title: 'Clause Detection',
              desc: 'Automatically identifies and categorises every important clause across six categories: financial, termination, restrictions, ownership, disputes, and time. Each clause comes with a plain-English explanation and a direct link to the source text.',
              bullets: ['Financial obligations & salary', 'Termination & notice periods', 'IP ownership & confidentiality'],
              tagColor: 'text-blue-600 bg-blue-50 border-blue-100',
              mockup: (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-lg space-y-3">
                  {[
                    { color: 'bg-blue-500',   label: 'Financial',    val: '3 clauses'  },
                    { color: 'bg-red-400',    label: 'Termination',  val: '2 clauses'  },
                    { color: 'bg-yellow-400', label: 'Restrictions', val: '4 clauses'  },
                    { color: 'bg-green-500',  label: 'Ownership',    val: '2 clauses'  },
                  ].map(r => (
                    <div key={r.label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className={`w-3 h-3 rounded-full ${r.color} flex-shrink-0`} />
                      <span className="text-sm font-medium text-gray-800 flex-1">{r.label}</span>
                      <span className="text-xs text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full">{r.val}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              Icon: FileText,    iconBg: 'bg-red-400',    tag: 'Review',
              title: 'Attention Areas',
              desc: 'Surfaces provisions worth reviewing most — ranked High, Medium, or Low. Each area shows a plain-English explanation, the original clause text, a list of things to verify, and a clickable source citation that jumps to the exact passage.',
              bullets: ['High / Medium / Low attention ranking', 'Expandable "why highlighted" detail', 'One-click source navigation'],
              tagColor: 'text-red-600 bg-red-50 border-red-100',
              mockup: (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-lg space-y-3">
                  {[
                    { level: 'HIGH',   bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-400',    text: '90-day Notice Period'              },
                    { level: 'HIGH',   bg: 'bg-red-50',    border: 'border-red-200',    dot: 'bg-red-400',    text: 'Training Cost Recovery ₹2L'        },
                    { level: 'MEDIUM', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-400', text: 'Auto-renewal Clause'                },
                    { level: 'LOW',    bg: 'bg-green-50',  border: 'border-green-100',  dot: 'bg-green-500',  text: 'Annual Leave Entitlement'           },
                  ].map(r => (
                    <div key={r.text} className={`flex items-center gap-3 p-3 ${r.bg} border ${r.border} rounded-xl`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${r.dot} flex-shrink-0`} />
                      <span className="text-xs font-bold text-gray-500 w-12 flex-shrink-0">{r.level}</span>
                      <span className="text-sm text-gray-800">{r.text}</span>
                    </div>
                  ))}
                </div>
              ),
            },
            {
              Icon: BookOpen,    iconBg: 'bg-yellow-400', tag: 'Q&A',
              title: 'Document Q&A',
              desc: 'Ask anything about the document in plain English — "What is the notice period?", "Who owns IP I create?" Every answer is grounded in the document and includes a quoted evidence block and a source section reference. Never hallucinated.',
              bullets: ['Grounded answers with quoted evidence', 'Source section + page citation', 'Out-of-scope questions handled safely'],
              tagColor: 'text-yellow-700 bg-yellow-50 border-yellow-100',
              mockup: (
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-lg space-y-3">
                  <div className="bg-blue-500 text-white text-xs rounded-lg rounded-br-sm px-3 py-2 ml-8">
                    What is the notice period?
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg rounded-bl-sm px-3 py-2.5 mr-4 space-y-2">
                    <p className="text-xs text-gray-700">The document states that either party must provide <strong>90 days' written notice</strong> following completion of the probation period.</p>
                    <div className="bg-blue-50 border border-blue-100 rounded px-2 py-1">
                      <p className="text-xs font-mono text-gray-500">Section 8.1 · Page 6</p>
                    </div>
                  </div>
                </div>
              ),
            },
          ].map((feat, i) => (
            <div
              key={feat.title}
              className={`grid lg:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'lg:direction-rtl' : ''}`}
            >
              {/* Text side */}
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${feat.iconBg} flex items-center justify-center shadow-md flex-shrink-0`}>
                    <feat.Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${feat.tagColor}`}>
                    {feat.tag}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">{feat.title}</h3>
                <p className="text-base text-gray-500 leading-relaxed mb-5">{feat.desc}</p>
                <ul className="space-y-2">
                  {feat.bullets.map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-gray-700">
                      <span className={`w-4 h-4 rounded-full ${feat.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                  Try it free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mockup side */}
              <div className={`${i % 2 === 1 ? 'lg:order-1' : ''} max-w-sm mx-auto lg:mx-0 w-full`}>
                {feat.mockup}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom 3 — compact grid ── */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                Icon: CheckSquare, iconBg: 'bg-green-500',  tag: 'Extract',  tagColor: 'text-green-700 bg-green-50 border-green-100',
                title: 'Obligation Extractor',
                desc: 'Extracts who must act, by when, and what happens if they don\'t. Obligations are split by party (Employee / Company) with deadlines and consequence.',
              },
              {
                Icon: GitCompare, iconBg: 'bg-orange-400', tag: 'Compare',  tagColor: 'text-orange-700 bg-orange-50 border-orange-100',
                title: 'Version Comparison',
                desc: 'Upload two PDFs and get a structured diff showing every added, removed, and modified clause — with before/after plain-English explanations.',
              },
              {
                Icon: Clock,      iconBg: 'bg-blue-500',   tag: 'Prepare',  tagColor: 'text-blue-600 bg-blue-50 border-blue-100',
                title: 'Lawyer Preparation',
                desc: 'Generates a consultation brief with targeted questions, relevant clauses, key dates, and a document checklist — ready to share with your lawyer.',
              },
            ].map(({ Icon, iconBg, tag, tagColor, title, desc }) => (
              <div key={title} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${tagColor}`}>
                    {tag}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                <Link to="/signup" className="inline-flex items-center gap-1 mt-4 text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors">
                  Get started <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works — dark background for contrast ───────────────────── */}
      <div className="bg-gray-900">
        <section className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="how-heading">
          <div className="text-center mb-14">
            <span className="inline-block bg-white/10 text-white text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 mb-4">
              How it works
            </span>
            <h2 id="how-heading" className="text-3xl font-semibold text-white mb-3">
              From document to clarity in minutes
            </h2>
            <p className="text-gray-400 text-base max-w-lg mx-auto">
              A simple five-step process that works for any legal document.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-white/10" aria-hidden="true" />

            <ol className="grid sm:grid-cols-3 lg:grid-cols-5 gap-6 relative">
              {STEPS.map((step, i) => (
                <li
                  key={step.n}
                  className="flex flex-col items-center text-center gap-3 animate-fade-up"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center z-10 shadow-lg`}>
                    <span className="text-white font-bold text-lg">{step.n}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{step.title}</p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="text-center mt-12">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
              Start for free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

      {/* ── Trust pillars ─────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20" aria-labelledby="trust-heading">
        <div className="text-center mb-14">
          <h2 id="trust-heading" className="text-3xl font-semibold text-gray-900 mb-3">
            Built with safety and clarity in mind
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              Icon: Zap,   color: 'bg-yellow-400', title: 'Fast & accurate',
              desc: 'Analyses your document in under 30 seconds and presents structured, navigable results.',
            },
            {
              Icon: Lock,  color: 'bg-green-500',  title: 'Privacy first',
              desc: 'Documents are processed entirely in memory. Nothing is stored on our servers.',
            },
            {
              Icon: Shield, color: 'bg-blue-500',  title: 'Informational only',
              desc: 'ClauseLens provides educational assistance — never legal advice. We\'re clear about this everywhere.',
            },
          ].map(({ Icon, color, title, desc }) => (
            <div key={title} className="flex gap-4 p-6 bg-gray-50 border border-gray-200 rounded-xl">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, #1A73E8 0%, #0D47A1 100%)' }}>
        <section className="max-w-6xl mx-auto px-6 py-20 text-center" aria-labelledby="cta-heading">
          <div className="flex items-center justify-center gap-1.5 mb-6" aria-hidden="true">
            <span className="w-3 h-3 rounded-full bg-white/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-300" />
            <span className="w-3 h-3 rounded-full bg-green-300" />
            <span className="w-3 h-3 rounded-full bg-red-300" />
          </div>
          <h2 id="cta-heading" className="text-4xl font-semibold text-white mb-4">
            Ready to understand your document?
          </h2>
          <p className="text-blue-100 mb-10 text-lg max-w-lg mx-auto">
            Create a free account and get a full analysis in under a minute.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-3.5 rounded-lg shadow-lg transition-colors text-base"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-medium px-6 py-3.5 rounded-lg transition-colors text-base"
            >
              Sign In
            </Link>
          </div>
          <p className="text-blue-200/70 text-xs mt-6">
            No credit card required · Educational assistance only · Not legal advice
          </p>
        </section>
      </div>

    </div>
  )
}
