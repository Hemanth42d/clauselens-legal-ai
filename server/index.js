require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  const mode = process.env.OPENAI_API_KEY ? 'AI Mode (OpenAI)' : 'Demo Mode';
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║        ClauseLens Server             ║`);
  console.log(`╚══════════════════════════════════════╝`);
  console.log(`  Listening on: http://localhost:${PORT}`);
  console.log(`  Mode: ${mode}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
