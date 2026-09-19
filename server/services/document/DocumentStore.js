const { v4: uuidv4 } = require('uuid');

const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — uploaded docs expire automatically

/**
 * In-memory document store.
 * Demo docs are persisted permanently (no TTL).
 * Uploaded docs expire after 2 hours to limit memory usage.
 */
class DocumentStore {
  constructor() {
    this._docs   = new Map();
    this._timers = new Map();
  }

  register(doc, persist = false) {
    if (!doc || !doc.documentId) {
      throw new Error('Document must have a documentId');
    }
    this._docs.set(doc.documentId, doc);

    if (!persist) {
      if (this._timers.has(doc.documentId)) {
        clearTimeout(this._timers.get(doc.documentId));
      }
      const timer = setTimeout(() => {
        this._docs.delete(doc.documentId);
        this._timers.delete(doc.documentId);
      }, TTL_MS);
      if (timer.unref) timer.unref();
      this._timers.set(doc.documentId, timer);
    }

    return doc;
  }

  get(documentId)  { return this._docs.get(documentId) || null; }
  has(documentId)  { return this._docs.has(documentId); }
  get size()       { return this._docs.size; }

  remove(documentId) {
    if (this._timers.has(documentId)) {
      clearTimeout(this._timers.get(documentId));
      this._timers.delete(documentId);
    }
    return this._docs.delete(documentId);
  }

  list() {
    return Array.from(this._docs.values()).map(doc => ({
      documentId:      doc.documentId,
      title:           doc.title,
      version:         doc.version,
      metadata:        doc.metadata,
      clauseCount:     (doc.clauses      || []).length,
      obligationCount: (doc.obligations  || []).length,
      attentionCounts: {
        high:   (doc.attentionAreas || []).filter(a => a.level === 'high').length,
        medium: (doc.attentionAreas || []).filter(a => a.level === 'medium').length,
        low:    (doc.attentionAreas || []).filter(a => a.level === 'low').length,
      },
      isUploaded: !!doc.isUploaded,
      isDemo:     !!doc.isDemo,
    }));
  }
}

module.exports = new DocumentStore();
