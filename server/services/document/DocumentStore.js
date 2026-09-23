const Document = require('../../models/Document');

/**
 * MongoDB-backed document store.
 */
class DocumentStore {
  async register(doc, persist = true) {
    if (!doc || !doc.documentId) {
      throw new Error('Document must have a documentId');
    }

    try {
      const newDoc = await Document.findOneAndUpdate(
        { documentId: doc.documentId },
        doc,
        { upsert: true, returnDocument: 'after' }   // 'new: true' is deprecated in Mongoose 9
      );
      return newDoc;
    } catch (err) {
      console.error('Failed to register document in DB:', err);
      throw err;
    }
  }

  async get(documentId) {
    try {
      return await Document.findOne({ documentId }).lean();
    } catch (err) {
      console.error('Failed to get document from DB:', err);
      return null;
    }
  }

  async has(documentId) {
    try {
      // findOne with lean is faster than countDocuments for existence checks
      const doc = await Document.findOne({ documentId }, { _id: 1 }).lean();
      return doc !== null;
    } catch (err) {
      return false;
    }
  }

  async remove(documentId) {
    try {
      const result = await Document.deleteOne({ documentId });
      return result.deletedCount > 0;
    } catch (err) {
      return false;
    }
  }

  async list(userId) {
    let query = {};
    if (userId) {
      if (userId === 'demo-user-1') {
        query = { $or: [{ isDemo: true }, { userId }] };
      } else {
        query = { userId };
      }
    }

    try {
      const docs = await Document.find(query).lean();
      return docs.map(doc => ({
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
    } catch (err) {
      console.error('Failed to list documents from DB:', err);
      return [];
    }
  }
}

module.exports = new DocumentStore();
