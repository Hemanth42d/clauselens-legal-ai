/**
 * DocumentStore — lightweight in-memory store for uploaded documents.
 *
 * Uploaded documents are processed once and stored here for the duration
 * of the server session. No database required.
 *
 * Documents are keyed by their documentId (e.g. "upload-1234567890").
 * Demo documents (employment-v1, employment-v2) are registered at startup
 * by DemoAIService and are always available.
 */

class DocumentStore {
  constructor() {
    this._docs = new Map();
    // Optional TTL: auto-expire uploaded docs after 2 hours to limit memory use
    this._timers = new Map();
    this.TTL_MS = 2 * 60 * 60 * 1000;
  }

  /**
   * Register a document object. Overwrites any existing doc with same ID.
   * @param {object} doc — full document object (must have .documentId)
   * @param {boolean} persist — if true, skip TTL expiry (for demo docs)
   */
  register(doc, persist = false) {
    if (!doc || !doc.documentId) throw new Error('Document must have a documentId');
    this._docs.set(doc.documentId, doc);

    if (!persist) {
      // Clear any existing timer
      if (this._timers.has(doc.documentId)) {
        clearTimeout(this._timers.get(doc.documentId));
      }
      const timer = setTimeout(() => {
        this._docs.delete(doc.documentId);
        this._timers.delete(doc.documentId);
      }, this.TTL_MS);
      // Allow Node to exit even if timer is pending
      if (timer.unref) timer.unref();
      this._timers.set(doc.documentId, timer);
    }

    return doc;
  }

  /**
   * Retrieve a document by ID. Returns null if not found.
   */
  get(documentId) {
    return this._docs.get(documentId) || null;
  }

  /**
   * Check whether a document is registered.
   */
  has(documentId) {
    return this._docs.has(documentId);
  }

  /**
   * List all registered documents (lightweight summaries).
   */
  list() {
    return Array.from(this._docs.values()).map(doc => ({
      documentId:   doc.documentId,
      title:        doc.title,
      version:      doc.version,
      metadata:     doc.metadata,
      clauseCount:  (doc.clauses || []).length,
      obligationCount: (doc.obligations || []).length,
      attentionCounts: {
        high:   (doc.attentionAreas || []).filter(a => a.level === 'high').length,
        medium: (doc.attentionAreas || []).filter(a => a.level === 'medium').length,
        low:    (doc.attentionAreas || []).filter(a => a.level === 'low').length,
      },
      isUploaded: !!doc.isUploaded,
      isDemo:     !!doc.isDemo,
    }));
  }

  /**
   * Remove a document by ID.
   */
  remove(documentId) {
    if (this._timers.has(documentId)) {
      clearTimeout(this._timers.get(documentId));
      this._timers.delete(documentId);
    }
    return this._docs.delete(documentId);
  }

  get size() {
    return this._docs.size;
  }
}

// Singleton — shared across the entire server process
module.exports = new DocumentStore();
