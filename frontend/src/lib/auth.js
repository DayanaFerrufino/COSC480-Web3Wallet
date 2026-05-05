import { Buffer } from "buffer";
import { SiweMessage } from "siwe";
import { ethers } from "ethers";
import { supabase } from "./supabase";

window.Buffer = Buffer;

export const signInWithWallet = async (address, signer) => {
  // checksum the address
  const checksummedAddress = ethers.getAddress(address);

  const { nonce } = await fetch("http://localhost:3001/auth/nonce", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address: checksummedAddress }),
  }).then((r) => r.json());

  const message = new SiweMessage({
    domain: window.location.host,
    address: checksummedAddress,
    statement: "Sign in to TaskBounty",
    uri: window.location.origin,
    version: "1",
    chainId: 11155111,
    nonce,
  });

  const signature = await signer.signMessage(message.prepareMessage());

  const { token } = await fetch("http://localhost:3001/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, signature }),
  }).then((r) => r.json());

  await supabase.auth.setSession({ access_token: token, refresh_token: token });
  await supabase.from("users").upsert({ address: checksummedAddress });

  localStorage.setItem("tb_token", token);
  return token;
};

export const signOut = async () => {
  localStorage.removeItem("tb_token");
  await supabase.auth.signOut();
};
