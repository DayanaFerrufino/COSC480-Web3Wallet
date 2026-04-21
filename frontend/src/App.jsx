import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";

// ─── PASTE YOUR DEPLOYED CONTRACT ADDRESS HERE ───────────────────────────────
const CONTRACT_ADDRESS = "0x54BFd99AFCEEd6Ca573E65568Da2f0AF43e3729c";

const ABI = [
  "function message() view returns (string)",
  "function lastSender() view returns (address)",
  "function fee() view returns (uint256)",
  "function owner() view returns (address)",
  "function getBalance() view returns (uint256)",
  "function update(string memory newMessage) public payable",
  "function withdraw() public",
  "event MessageUpdated(address indexed sender, string oldMessage, string newMessage, uint256 paid)",
];
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [message, setMessage] = useState("");
  const [lastSender, setLastSender] = useState("");
  const [fee, setFee] = useState(null);
  const [balance, setBalance] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [input, setInput] = useState("");
  const [txStatus, setTxStatus] = useState(null); // null | "pending" | "confirmed" | "error"
  const [txHash, setTxHash] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [modal, setModal] = useState(null);

  const SEPOLIA_CHAIN_ID = "0xaa36a7";

  const getProvider = () => new ethers.BrowserProvider(window.ethereum);

  const getContract = async (withSigner = false) => {
    const provider = getProvider();
    const runner = withSigner ? await provider.getSigner() : provider;
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, runner);
  };

  const fetchContractData = useCallback(async () => {
    try {
      const contract = await getContract();
      const [msg, sender, feeWei, bal, ownerAddr] = await Promise.all([
        contract.message(),
        contract.lastSender(),
        contract.fee(),
        contract.getBalance(),
        contract.owner(),
      ]);
      setMessage(msg);
      setLastSender(sender);
      setFee(feeWei);
      setBalance(bal);
      if (wallet) {
        setIsOwner(wallet.toLowerCase() === ownerAddr.toLowerCase());
      }
    } catch (e) {
      console.error("Failed to read contract:", e);
    }
  }, [wallet]);

  const checkNetwork = async () => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    setWrongNetwork(chainId !== SEPOLIA_CHAIN_ID);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install it at metamask.io");
      return;
    }
    if (connecting) return;
    try {
      setConnecting(true);
      const [address] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setWallet(address);
      await checkNetwork();
      await fetchContractData();
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  const updateMessage = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setTxStatus("pending");
    setTxHash(null);
    setErrorMsg(null);
    try {
      const contract = await getContract(true);
      const tx = await contract.update(input.trim(), { value: fee });
      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("confirmed");
      setInput("");
      await fetchContractData();
    } catch (e) {
      setTxStatus("error");
      setErrorMsg(e?.reason || e?.shortMessage || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    setLoading(true);
    try {
      const contract = await getContract(true);
      const tx = await contract.withdraw();
      await tx.wait();
      await fetchContractData();
      setModal({ type: "success", message: "Funds withdrawn successfully!" });
    } catch (e) {
      setModal({ type: "error", message: e?.reason || "Withdraw failed" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then(([addr]) => {
      if (addr) {
        setWallet(addr);
        checkNetwork();
        fetchContractData();
      }
    });
    window.ethereum.on("accountsChanged", ([addr]) => setWallet(addr || null));
    window.ethereum.on("chainChanged", () => checkNetwork());
  }, []);

  useEffect(() => {
    if (wallet) fetchContractData();
  }, [wallet, fetchContractData]);

  const short = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";
  const fmtEth = (wei) => (wei != null ? ethers.formatEther(wei) : "—");

  return (
    <div className="app">
      <div className="grid-bg" />

      <div className="card">
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <p className="eyebrow" style={{ margin: 0 }}>
              Ethereum · Sepolia Testnet
            </p>
            {wallet ? (
              <div className="wallet-badge">
                <span className="dot" />
                {short(wallet)}
              </div>
            ) : (
              <button
                className="connect-btn"
                onClick={connectWallet}
                disabled={connecting}
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
          <h1 className="title">Paid Billboard</h1>
        </div>

        {wrongNetwork && wallet && (
          <div className="banner warning">
            Switch MetaMask to the <strong>Sepolia</strong> testnet
          </div>
        )}

        {/* Current message */}
        <div className="message-box">
          <p className="label">Current billboard message</p>
          <p className="message-text">
            {message || <span className="muted">Loading…</span>}
          </p>
          <p className="meta">
            Set by <span className="address">{short(lastSender)}</span>
          </p>
          <button
            className="refresh-btn"
            onClick={fetchContractData}
            title="Refresh"
          >
            ↻
          </button>
        </div>

        {/* Fee info */}
        {fee != null && (
          <div className="fee-row">
            <span className="label">Fee to update</span>
            <span className="fee-amount">{fmtEth(fee)} ETH</span>
          </div>
        )}

        {/* Update form */}
        {wallet && !wrongNetwork && (
          <div className="update-section">
            <p className="label">Your message</p>
            <div className="input-row">
              <input
                className="text-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Pay ${fmtEth(fee)} ETH to update…`}
                onKeyDown={(e) => e.key === "Enter" && updateMessage()}
                disabled={loading}
              />
              <button
                className="submit-btn"
                onClick={updateMessage}
                disabled={loading || !input.trim()}
              >
                {loading ? "Sending…" : `Pay & Post →`}
              </button>
            </div>

            {txStatus === "pending" && (
              <div className="status pending">
                Waiting for confirmation…
                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="etherscan-link"
                  >
                    Etherscan ↗
                  </a>
                )}
              </div>
            )}
            {txStatus === "confirmed" && (
              <div className="status confirmed">
                Message posted on-chain!
                {txHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="etherscan-link"
                  >
                    Etherscan ↗
                  </a>
                )}
              </div>
            )}
            {txStatus === "error" && (
              <div className="status error">{errorMsg}</div>
            )}
          </div>
        )}

        {!wallet && (
          <p className="hint">Connect your wallet to pay and post a message.</p>
        )}

        {/* Owner panel */}
        {isOwner && (
          <div className="owner-panel">
            <p className="label">Owner panel</p>
            <div className="owner-row">
              <span>
                Contract balance: <strong>{fmtEth(balance)} ETH</strong>
              </span>
              <button
                className="withdraw-btn"
                onClick={withdraw}
                disabled={loading || balance === 0n}
              >
                Withdraw
              </button>
            </div>
          </div>
        )}

        <p className="footer">
          Contract:{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {short(CONTRACT_ADDRESS)}
          </a>
        </p>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <p className={`modal-icon ${modal.type}`}>
              {modal.type === "success" ? "✓" : "✕"}
            </p>
            <p className="modal-message">{modal.message}</p>
            <button className="modal-btn" onClick={() => setModal(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
