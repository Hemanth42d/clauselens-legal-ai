const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId:      { type: String, required: true, unique: true },
  userId:          { type: String, index: true },
  title:           { type: String },
  version:         { type: String },
  disclaimer:      { type: String },
  metadata:        { type: mongoose.Schema.Types.Mixed },
  summary:         { type: mongoose.Schema.Types.Mixed },
  sections:        { type: Array },
  clauses:         { type: Array },
  obligations:     { type: Array },
  timeline:        { type: Array },
  attentionAreas:  { type: Array },
  isUploaded:      { type: Boolean, default: false },
  isDemo:          { type: Boolean, default: false, index: true },
  createdAt:       { type: Date, default: Date.now },
});

// Compound index for the most common query: list user's docs + demo docs
documentSchema.index({ userId: 1, isDemo: 1 });

module.exports = mongoose.model('Document', documentSchema);
