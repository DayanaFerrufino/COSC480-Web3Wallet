import { SiweMessage } from "siwe";
import { supabase } from "./supabase";

export const signInWithWallet = async (address, signer) => {
  // 1. get nonce from backend
  const { nonce } = await fetch("http://localhost:3001/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  }).then((r) => r.json());

  // 2. build SIWE message
  const message = new SiweMessage({
    domain: window.location.host,
    address,
    statement: "Sign in to TaskBounty",
    uri: window.location.origin,
    version: "1",
    chainId: 11155111,
    nonce,
  });

  // 3. sign with MetaMask
  const signature = await signer.signMessage(message.prepareMessage());

  // 4. verify with backend → get JWT
  const { token } = await fetch("http://localhost:3001/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  }).then((r) => r.json());

  // 5. set session in supabase
  await supabase.auth.setSession({ access_token: token, refresh_token: token });

  // 6. upsert user row
  await supabase.from("users").upsert({ address });

  localStorage.setItem("tb_token", token);
  return token;
};

export const signOut = async () => {
  localStorage.removeItem("tb_token");
  await supabase.auth.signOut();
};
