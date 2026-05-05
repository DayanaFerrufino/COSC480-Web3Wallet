import express from "express";
import cors from "cors";
import { SiweMessage } from "siwe";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { randomBytes } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const app = express();
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

// Store nonces temporarily (in production use Redis)
const nonces = new Map();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
);

// Generate nonce
app.post("/auth/nonce", (req, res) => {
  const { address } = req.body;
  const nonce = randomBytes(16).toString("hex");
  nonces.set(address.toLowerCase(), nonce);
  // expire after 5 minutes
  setTimeout(() => nonces.delete(address.toLowerCase()), 5 * 60 * 1000);
  res.json({ nonce });
});

// Verify signature
app.post("/auth/verify", async (req, res) => {
  try {
    const { message, signature } = req.body;
    const siweMessage = new SiweMessage(message);

    // verify the signature
    const { data: fields } = await siweMessage.verify({ signature });

    // check nonce matches
    const storedNonce = nonces.get(fields.address.toLowerCase());
    if (fields.nonce !== storedNonce) {
      return res.status(422).json({ error: "Invalid nonce" });
    }

    // clear used nonce
    nonces.delete(fields.address.toLowerCase());

    // create a JWT via Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: `${fields.address.toLowerCase()}@taskbounty.local`,
      options: {
        data: { wallet_address: fields.address.toLowerCase() },
      },
    });

    if (error) throw error;

    res.json({ token: data.properties.access_token });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: e.message });
  }
});

app.listen(3001, () => console.log("Auth server running on port 3001"));
