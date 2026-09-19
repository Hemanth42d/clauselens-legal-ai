require('dotenv').config();
const app  = require('./app');

const PORT = process.env.PORT || 3001;
const mode = process.env.OPENAI_API_KEY ? 'AI Mode (OpenAI)' : 'Demo Mode';

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`ClauseLens server running on :${PORT} [${mode}]`);
  }
});
