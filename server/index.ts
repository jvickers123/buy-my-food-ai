import "dotenv/config";
import express from "express";
import { addToTescoBasket, type CheckoutItem } from "./tesco.ts";

const app = express();
app.use(express.json());

const PORT = Number(process.env.CHECKOUT_PORT ?? 8787);

// Streams progress back to the browser as Server-Sent Events so the Order
// screen can narrate each step while the visible browser does the work.
app.post("/api/checkout", async (req, res) => {
  const items: CheckoutItem[] = Array.isArray(req.body?.items)
    ? req.body.items
    : [];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    if (items.length === 0) {
      send("error", { error: "No items were sent to checkout." });
      return;
    }
    const result = await addToTescoBasket(items, (msg) =>
      send("progress", { message: msg })
    );
    send("done", result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[checkout] failed:", message);
    send("error", { error: message });
  } finally {
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Tesco checkout server listening on http://localhost:${PORT}`);
});
