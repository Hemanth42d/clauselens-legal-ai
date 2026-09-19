require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;
const mode = process.env.GEMINI_API_KEY
  ? 'Gemini AI'
  : process.env.OPENAI_API_KEY
    ? 'OpenAI'
    : 'Demo Mode';

app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`ClauseLens server :${PORT} [${mode}]`);
  }
});
