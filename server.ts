import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/words/:word", async (req, res) => {
    try {
      const word = req.params.word;
      const apiKey = process.env.WORDS_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: "WORDS_API_KEY is not configured" });
      }

      const response = await fetch(`https://wordsapiv1.p.rapidapi.com/words/${word}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'wordsapiv1.p.rapidapi.com'
        }
      });

      if (!response.ok) {
        return res.status(response.status).json({ error: "Failed to fetch from WordsAPI" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("WordsAPI error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
