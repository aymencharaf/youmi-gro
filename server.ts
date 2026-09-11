import express from "express";
import path from "path";
import http from "http";
import { spawn, ChildProcess } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT || 3000);
const PHP_PORT = Number(process.env.PHP_PORT || 8787);
let phpProcess: ChildProcess | null = null;

// Development PHP bridge: Vite/Express cannot execute public/api.php by itself.
// In development we start PHP's built-in server and proxy /api.php to it,
// so `npm run dev` is enough to run both the React app and the PHP API.
function startPhpDevServer() {
  if (process.env.NODE_ENV === "production") return;
  const publicDir = path.join(process.cwd(), "public");
  phpProcess = spawn("php", ["-S", `127.0.0.1:${PHP_PORT}`, "-t", publicDir], {
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
  });
  phpProcess.stdout?.on("data", (chunk) => console.log(`[PHP] ${chunk.toString().trim()}`));
  phpProcess.stderr?.on("data", (chunk) => console.log(`[PHP] ${chunk.toString().trim()}`));
  phpProcess.on("error", (err) => console.error(`PHP dev server could not start: ${err.message}`));
  phpProcess.on("exit", (code) => {
    if (code !== null && code !== 0) console.error(`PHP dev server stopped with code ${code}`);
    phpProcess = null;
  });
}

function proxyPhpApi(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (process.env.NODE_ENV === "production" || !req.url?.startsWith("/api.php")) return next();
  const target = http.request({
    hostname: "127.0.0.1",
    port: PHP_PORT,
    path: req.originalUrl,
    method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${PHP_PORT}` },
  }, (targetRes) => {
    res.status(targetRes.statusCode || 502);
    Object.entries(targetRes.headers).forEach(([key, value]) => {
      if (value !== undefined) res.setHeader(key, value as any);
    });
    targetRes.pipe(res);
  });
  target.on("error", (err) => {
    if (!res.headersSent) {
      res.status(502).json({ status: "error", message: `PHP API غير متاح. تأكد من تثبيت PHP: ${err.message}` });
    } else res.end();
  });
  req.pipe(target);
}

app.use(proxyPhpApi);

// Parse JSON for Express-owned endpoints after the PHP proxy has had a chance to read the raw body.
app.use(express.json({ limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "TajerPlus E-Commerce Platform" });
});

// Server-side Gemini API Endpoint for Merchants
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(400).json({
        error: "مفتاح GEMINI_API_KEY غير متوفر في متغيرات البيئة.",
      });
    }

    const { type, prompt } = req.body;

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    let systemInstruction = "أنت خبير ذكاء اصطناعي لبناء وتسويق المتاجر الإلكترونية باللغة العربية. اجعل إجاباتك مشجعة واحترافية ومباشرة.";

    if (type === "slogan") {
      systemInstruction = "أنت خبير هوية بصرية وتصميم سلوجان للمتاجر العربية. قم باقتراح 3 شعارات تسويقية مبتكرة وجذابة للغاية لمتجر إلكتروني بناءً على الفكرة أو الاسم. اكتب النتائج في نقاط قصيرة ومبهرة.";
    } else if (type === "product_desc") {
      systemInstruction = "أنت كاتب محتوى تسويقي متخصص في وصف المنتجات للمتاجر الإلكترونية. اكتب وصفاً تسويقياً جذاباً ومواصفات دقيقة في نقاط واضحة تُحفز الزبون على الشراء فوراً.";
    } else if (type === "marketing_post") {
      systemInstruction = "أنت مدير تسويق رقمي. اكتب منشوراً تسويقياً رائعاً لمنصات التواصل الاجتماعي (إنستغرام، سناب شات، تويتر) يتضمن عبارات تسويقية، نقاط القوة، وهاشتاغات ناعمة ومناسبة باللغة العربية.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "حدث خطأ أثناء معالجة الطلب" });
  }
});

async function start() {
  startPhpDevServer();
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();

function shutdown() {
  if (phpProcess) phpProcess.kill();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
