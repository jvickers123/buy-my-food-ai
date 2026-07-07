import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Stagehand, type Page } from "@browserbasehq/stagehand";
import { z } from "zod";

export interface CheckoutItem {
  name: string;
  qty: string;
}

export interface AddedLine {
  requested: string;
  matched: string | null;
  added: boolean;
}

export interface CheckoutResult {
  basketUrl: string;
  added: AddedLine[];
}

const TESCO_BASE = "https://www.tesco.com/groceries/en-GB";
const BASKET_URL = `${TESCO_BASE}/trolley`;

type Progress = (message: string) => void;

// Drives a real (visible) Chromium via Stagehand: signs into Tesco, searches
// each basket line, lets the LLM pick the best matching product, adds it, and
// returns a link to the trolley. Runs headed so you can watch it work.
export async function addToTescoBasket(
  items: CheckoutItem[],
  onProgress: Progress = () => {}
): Promise<CheckoutResult> {
  const log: Progress = (msg) => {
    console.log(`[tesco] ${msg}`);
    onProgress(msg);
  };

  const email = process.env.TESCO_EMAIL;
  const password = process.env.TESCO_PASSWORD;
  if (!email || !password) {
    throw new Error("TESCO_EMAIL and TESCO_PASSWORD must be set in .env");
  }
  const model = resolveModel();

  // Chrome writes its logs into the profile dir, so it must exist beforehand.
  const profileDir = path.resolve(process.cwd(), ".tesco-profile");
  fs.mkdirSync(profileDir, { recursive: true });

  const stagehand = new Stagehand({
    env: "LOCAL",
    model,
    verbose: 1,
    localBrowserLaunchOptions: {
      headless: false, // <- the "watch it work" switch
      viewport: { width: 1280, height: 900 },
      // Persist the logged-in session between runs so we can skip login/2FA.
      userDataDir: profileDir,
    },
  });

  await stagehand.init();
  const page = stagehand.context.pages()[0];
  const added: AddedLine[] = [];

  try {
    log("Opening Tesco groceries…");
    await page.goto(`${TESCO_BASE}/`, { waitUntil: "domcontentloaded" });
    await dismissCookies(stagehand, log);

    if (await isSignedIn(stagehand)) {
      log("Already signed in (reused saved session).");
    } else {
      log("Signing in…");
      await signIn(stagehand, page, email, password, log);
    }

    for (const item of items) {
      log(`Searching for "${item.name}"…`);
      await page.goto(
        `${TESCO_BASE}/search?query=${encodeURIComponent(item.name)}`,
        { waitUntil: "domcontentloaded" }
      );

      const products = await stagehand.extract(
        "extract the grocery products shown in the search results, in the order they appear",
        z.array(
          z.object({
            name: z.string().describe("the full product title as shown"),
            price: z.string().optional().describe("price as displayed"),
          })
        )
      );

      if (!Array.isArray(products) || products.length === 0) {
        log(`  No results for "${item.name}".`);
        added.push({ requested: item.name, matched: null, added: false });
        continue;
      }

      const best = products[0];
      log(`  Adding "${best.name}"…`);
      try {
        await stagehand.act(
          `add the product titled "${best.name}" to the basket`
        );
        added.push({ requested: item.name, matched: best.name, added: true });
      } catch (err) {
        log(`  Couldn't add "${best.name}" (${errText(err)}).`);
        added.push({ requested: item.name, matched: best.name, added: false });
      }
    }

    log("Opening your basket…");
    await page.goto(BASKET_URL, { waitUntil: "domcontentloaded" });
    log("Done — your Tesco basket is ready.");

    return { basketUrl: BASKET_URL, added };
  } catch (err) {
    // On failure, tidy up the browser; on success we leave it open so you can
    // see the finished basket.
    await stagehand.close().catch(() => {});
    throw err;
  }
}

async function dismissCookies(stagehand: Stagehand, log: Progress): Promise<void> {
  try {
    const [action] = await stagehand.observe(
      "the button to accept all cookies in the cookie consent banner"
    );
    if (action) {
      await stagehand.act(action);
      log("  Accepted cookie banner.");
    }
  } catch {
    // No banner (or already dismissed) — carry on.
  }
}

async function isSignedIn(stagehand: Stagehand): Promise<boolean> {
  try {
    const result = await stagehand.extract(
      "is a shopper currently signed in? Look for a 'my account', 'sign out', or account name link in the header",
      z.object({ signedIn: z.boolean() })
    );
    return Boolean(result?.signedIn);
  } catch {
    return false;
  }
}

async function signIn(
  stagehand: Stagehand,
  page: Page,
  email: string,
  password: string,
  log: Progress
): Promise<void> {
  const [signInLink] = await stagehand.observe(
    "the sign in link or button in the site header"
  );
  if (signInLink) {
    await stagehand.act(signInLink);
  } else {
    await page.goto("https://secure.tesco.com/account/en-GB/login", {
      waitUntil: "domcontentloaded",
    });
  }
  await dismissCookies(stagehand, log);

  // Pass secrets via variables so the raw values are never sent to the LLM;
  // Stagehand substitutes them locally into the resolved action.
  await stagehand.act("type %email% into the email address field", {
    variables: { email },
  });
  await stagehand.act("type %password% into the password field", {
    variables: { password },
  });
  await stagehand.act("click the sign in button");

  await page.waitForLoadState("networkidle").catch(() => {});
  log("Signed in.");
}

// Chooses the LLM config: a LiteLLM proxy (OpenAI-compatible) when both
// LITELLM_API_KEY and LITELLM_BASE_URL are set, otherwise the direct Anthropic
// provider via ANTHROPIC_API_KEY.
type ModelConfig = NonNullable<ConstructorParameters<typeof Stagehand>[0]>["model"];

function resolveModel(): ModelConfig {
  const liteKey = process.env.LITELLM_API_KEY;
  const liteBase = process.env.LITELLM_BASE_URL;

  if (liteKey && liteBase) {
    return {
      // LiteLLM is OpenAI-compatible; the model name must match your proxy's
      // configured alias (override with LITELLM_MODEL).
      modelName: process.env.LITELLM_MODEL ?? "openai/claude-sonnet-4-6",
      apiKey: liteKey,
      baseURL: liteBase,
    };
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "Set LITELLM_API_KEY + LITELLM_BASE_URL (LiteLLM), or ANTHROPIC_API_KEY, in .env"
    );
  }
  // Auto-loads ANTHROPIC_API_KEY from the environment.
  return "anthropic/claude-sonnet-4-6";
}

function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
