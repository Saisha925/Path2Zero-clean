/**
 * Standalone API server for development. Run with: npx tsx server/run-api-server.ts
 * Vite proxies /server to this server when using the dev script.
 */
import { createServer } from "node:http";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { config } from "dotenv";

// Load environment variables from backend/.env
config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "backend", ".env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.API_PORT) || 3001;

const routes: Record<string, string> = {
  "/server/api/authenticate-certificate": path.join(__dirname, "api", "authenticate-certificate.ts"),
  "/server/api/list-certificate": path.join(__dirname, "api", "list-certificate.ts"),
  "/server/api/marketplace-listings": path.join(__dirname, "api", "marketplace-listings.ts"),
  "/server/api/create-payment-intent": path.join(__dirname, "api", "create-payment-intent.ts"),
};

createServer(async (req, res) => {
  const url = req.url?.split("?")[0] ?? "";
  const handlerPath = routes[url];
  if (!handlerPath) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: "Not found" }));
    return;
  }

  try {
    const mod = await import(pathToFileURL(handlerPath).href);
    const handler = mod?.default;
    if (typeof handler !== "function") {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ success: false, error: "Invalid handler" }));
      return;
    }
    await Promise.resolve(handler(req, res));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: false, error: (err as Error).message }));
  }
}).listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
