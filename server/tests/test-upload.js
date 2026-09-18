/**
 * Quick integration test for the upload endpoint.
 * Run: node tests/test-upload.js
 */
const fs   = require('fs');
const path = require('path');
const http = require('http');

const SAMPLE = path.join(__dirname, '../data/demo/ClauseLens_Sample_Employment_Agreement.txt');
const BOUNDARY = '----FormBoundary7MA4YWxkTrZu0gW';

function buildFormData(filename, content) {
  const CRLF = '\r\n';
  const header = [
    `--${BOUNDARY}`,
    `Content-Disposition: form-data; name="document"; filename="${filename}"`,
    `Content-Type: text/plain`,
    '',
    '',
  ].join(CRLF);
  const footer = `${CRLF}--${BOUNDARY}--${CRLF}`;
  return Buffer.concat([
    Buffer.from(header),
    content,
    Buffer.from(footer),
  ]);
}

async function run() {
  const fileContent = fs.readFileSync(SAMPLE);
  const body = buildFormData('ClauseLens_Sample_Employment_Agreement.txt', fileContent);

  // 1. Upload
  const uploadResult = await request('POST', '/api/documents/upload', body, {
    'Content-Type': `multipart/form-data; boundary=${BOUNDARY}`,
    'Content-Length': body.length,
  });
  console.log('Upload:', uploadResult.documentId, '| title:', uploadResult.title);

  const docId = uploadResult.documentId;
  if (!docId) { console.error('Upload failed'); process.exit(1); }

  // 2. Analyze
  const analysis = await request('POST', '/api/analysis/analyze', { documentId: docId });
  console.log(`Analysis: ${analysis.clauseCount} clauses, ${analysis.obligationCount} obligations, ${analysis.sectionCount} sections`);
  console.log(`  Attention: high=${analysis.attentionCounts?.high} medium=${analysis.attentionCounts?.medium} low=${analysis.attentionCounts?.low}`);

  // 3. Clauses
  const clauses = await request('POST', '/api/analysis/clauses', { documentId: docId });
  console.log(`Clauses: ${clauses.total} total, categories: ${Object.keys(clauses.grouped || {}).join(', ')}`);

  // 4. Obligations
  const obs = await request('POST', '/api/analysis/obligations', { documentId: docId });
  console.log(`Obligations: ${obs.total} total, employee=${obs.byParty.employee.length} company=${obs.byParty.company.length}`);

  // 5. Timeline
  const tl = await request('POST', '/api/analysis/timeline', { documentId: docId });
  console.log(`Timeline: ${tl.total} events`);

  // 6. Q&A
  const qa = await request('POST', '/api/qa/ask', { question: 'What is the notice period?', documentId: docId });
  console.log(`Q&A: confidence=${qa.confidence} | answer=${qa.answer?.slice(0, 70)}...`);

  // 7. Q&A - not found
  const nf = await request('POST', '/api/qa/ask', { question: 'What is the helicopter license fee?', documentId: docId });
  console.log(`Q&A not found: notFound=${nf.notFound}`);

  // 8. Consultation brief
  const brief = await request('POST', '/api/consultation/brief', { documentId: docId });
  console.log(`Consultation: ${brief.questionsForLawyer?.length} questions`);

  // 9. getDocument
  const doc = await request('GET', `/api/documents/${docId}`);
  console.log(`getDocument: title="${doc.document?.title}" sections=${doc.document?.sections?.length}`);

  console.log('\n✅ All upload-flow checks passed!');
}

function request(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const isJSON = !(extraHeaders['Content-Type'] || '').includes('multipart');
    const payload = body instanceof Buffer
      ? body
      : body ? Buffer.from(JSON.stringify(body)) : null;

    const headers = {
      ...(isJSON && payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}),
      ...extraHeaders,
    };

    const req = http.request({
      hostname: 'localhost', port: 3001, path, method, headers,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error(`Non-JSON response: ${data.slice(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

run().catch(err => { console.error('FAILED:', err.message); process.exit(1); });
