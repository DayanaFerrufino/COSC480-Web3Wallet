import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import "./App.css";

const CONTRACT_ADDRESS = "0x8d8186d74F6ccB8533C4bBF9392De81E5554501C";

const ABI = [
  "function taskCount() view returns (uint256)",
  "function getTask(uint256 taskId) view returns (tuple(uint256 id, address poster, address worker, string title, string description, string proofUrl, uint256 bounty, uint8 status, uint256 createdAt))",
  "function postTask(string memory title, string memory description) public payable",
  "function claimTask(uint256 taskId) public",
  "function submitWork(uint256 taskId, string memory proofUrl) public",
  "function approveWork(uint256 taskId) public",
  "function cancelTask(uint256 taskId) public",
];

const STATUS_LABELS = [
  "Open",
  "Claimed",
  "Submitted",
  "Completed",
  "Cancelled",
];
const STATUS_CLASSES = [
  "open",
  "claimed",
  "submitted",
  "completed",
  "cancelled",
];
const SEPOLIA_CHAIN_ID = "0xaa36a7";

const CATEGORY_ICONS = ["💻", "🎨", "📝", "🔧", "📊", "🎯", "🚀", "🔒"];

function hashToIcon(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_ICONS[Math.abs(hash) % CATEGORY_ICONS.length];
}

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("browse");
  const [modal, setModal] = useState(null);
  const [postModal, setPostModal] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postBounty, setPostBounty] = useState("");
  const [proofInputs, setProofInputs] = useState({});

  const getProvider = () => new ethers.BrowserProvider(window.ethereum);
  const getContract = async (withSigner = false) => {
    const provider = getProvider();
    const runner = withSigner ? await provider.getSigner() : provider;
    return new ethers.Contract(CONTRACT_ADDRESS, ABI, runner);
  };

  const fetchTasks = useCallback(async () => {
    try {
      const contract = await getContract();
      const count = Number(await contract.taskCount());
      const fetched = [];
      for (let i = 1; i <= count; i++) {
        try {
          const t = await contract.getTask(i);
          fetched.push({
            id: Number(t.id),
            poster: t.poster,
            worker: t.worker,
            title: t.title,
            description: t.description,
            proofUrl: t.proofUrl,
            bounty: t.bounty,
            status: Number(t.status),
            createdAt: Number(t.createdAt),
          });
        } catch {}
      }
      setTasks(fetched.reverse());
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    }
  }, []);

  const checkNetwork = async () => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    setWrongNetwork(chainId !== SEPOLIA_CHAIN_ID);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected. Install it at metamask.io");
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
      await fetchTasks();
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) return;
    window.ethereum.request({ method: "eth_accounts" }).then(([addr]) => {
      if (addr) {
        setWallet(addr);
        checkNetwork();
        fetchTasks();
      }
    });
    window.ethereum.on("accountsChanged", ([addr]) => setWallet(addr || null));
    window.ethereum.on("chainChanged", () => checkNetwork());
  }, []);

  useEffect(() => {
    if (wallet) fetchTasks();
  }, [wallet, fetchTasks]);

  const doTx = async (fn, successMsg) => {
    setLoading(true);
    setTxStatus("pending");
    setTxHash(null);
    try {
      const tx = await fn();
      setTxHash(tx.hash);
      await tx.wait();
      setTxStatus("confirmed");
      await fetchTasks();
      if (successMsg)
        setTimeout(
          () => setModal({ type: "success", message: successMsg }),
          300,
        );
    } catch (e) {
      setTxStatus("error");
      setModal({
        type: "error",
        message: e?.reason || e?.shortMessage || "Transaction failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const postTask = async () => {
    if (!postTitle.trim() || !postDesc.trim() || !postBounty) return;
    const contract = await getContract(true);
    setPostModal(false);
    await doTx(
      () =>
        contract.postTask(postTitle.trim(), postDesc.trim(), {
          value: ethers.parseEther(postBounty),
        }),
      `Task posted! ${postBounty} ETH locked in contract.`,
    );
    setPostTitle("");
    setPostDesc("");
    setPostBounty("");
  };

  const claimTask = (id) =>
    getContract(true).then((c) =>
      doTx(() => c.claimTask(id), "Task claimed! Submit your work when done."),
    );
  const submitWork = (id) => {
    const proof = proofInputs[id]?.trim();
    if (!proof) return;
    getContract(true).then((c) =>
      doTx(
        () => c.submitWork(id, proof),
        "Work submitted! Waiting for poster approval.",
      ),
    );
    setProofInputs((p) => ({ ...p, [id]: "" }));
  };
  const approveWork = (id) =>
    getContract(true).then((c) =>
      doTx(() => c.approveWork(id), "Approved! Bounty sent to worker."),
    );
  const cancelTask = (id) =>
    getContract(true).then((c) =>
      doTx(() => c.cancelTask(id), "Task cancelled. Bounty refunded."),
    );

  const short = (addr) =>
    addr && addr !== ethers.ZeroAddress
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : "—";
  const fmtEth = (wei) =>
    wei != null ? Number(ethers.formatEther(wei)).toFixed(4) : "—";
  const fmtDate = (ts) =>
    ts
      ? new Date(ts * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })
      : "";

  const openCount = tasks.filter((t) => t.status === 0).length;
  const totalLocked = tasks
    .filter((t) => t.status < 3)
    .reduce((s, t) => s + Number(ethers.formatEther(t.bounty || 0n)), 0);
  const completedCount = tasks.filter((t) => t.status === 3).length;

  const displayTasks = tasks.filter((t) => {
    if (tab === "mine")
      return (
        wallet &&
        (t.poster.toLowerCase() === wallet.toLowerCase() ||
          (t.worker && t.worker.toLowerCase() === wallet.toLowerCase()))
      );
    if (filterStatus !== "all") return t.status === Number(filterStatus);
    return true;
  });

  const renderCard = (task) => {
    const isPoster =
      wallet && task.poster.toLowerCase() === wallet.toLowerCase();
    const isWorker =
      wallet &&
      task.worker &&
      task.worker.toLowerCase() === wallet.toLowerCase();
    const icon = hashToIcon(task.title);

    return (
      <div className="task-card" key={task.id}>
        <div className="card-top">
          <div className="card-icon">{icon}</div>
          <div className="card-top-right">
            <span className={`status-pill ${STATUS_CLASSES[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
        </div>

        <h3 className="card-title">{task.title}</h3>
        <p className="card-desc">{task.description}</p>

        <div className="card-divider" />

        <div className="card-meta">
          <div className="card-meta-item">
            <span className="meta-label">Bounty</span>
            <span className="meta-value bounty-value">
              {fmtEth(task.bounty)} ETH
            </span>
          </div>
          <div className="card-meta-item">
            <span className="meta-label">Posted by</span>
            <span className="meta-value">{short(task.poster)}</span>
          </div>
          <div className="card-meta-item">
            <span className="meta-label">Date</span>
            <span className="meta-value">{fmtDate(task.createdAt)}</span>
          </div>
          {task.worker && task.worker !== ethers.ZeroAddress && (
            <div className="card-meta-item">
              <span className="meta-label">Worker</span>
              <span className="meta-value">{short(task.worker)}</span>
            </div>
          )}
        </div>

        {task.proofUrl && (
          <a
            href={task.proofUrl}
            target="_blank"
            rel="noreferrer"
            className="proof-link"
          >
            <span>View submitted work</span>
            <span className="proof-arrow">↗</span>
          </a>
        )}

        {wallet && !wrongNetwork && (
          <div className="card-actions">
            {task.status === 0 && !isPoster && (
              <button
                className="btn btn-primary"
                onClick={() => claimTask(task.id)}
                disabled={loading}
              >
                Claim Task →
              </button>
            )}
            {task.status === 0 && isPoster && (
              <button
                className="btn btn-ghost"
                onClick={() => cancelTask(task.id)}
                disabled={loading}
              >
                Cancel & Refund
              </button>
            )}
            {task.status === 1 && isWorker && (
              <div className="submit-proof-row">
                <input
                  className="proof-input"
                  placeholder="Proof URL (GitHub, Loom, Drive…)"
                  value={proofInputs[task.id] || ""}
                  onChange={(e) =>
                    setProofInputs((p) => ({ ...p, [task.id]: e.target.value }))
                  }
                />
                <button
                  className="btn btn-blue"
                  onClick={() => submitWork(task.id)}
                  disabled={loading || !proofInputs[task.id]?.trim()}
                >
                  Submit
                </button>
              </div>
            )}
            {task.status === 2 && isPoster && (
              <button
                className="btn btn-green"
                onClick={() => approveWork(task.id)}
                disabled={loading}
              >
                ✓ Approve & Pay {fmtEth(task.bounty)} ETH
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="nav-logo">TB</div>
            <span className="nav-name">TaskBounty</span>
            <span className="nav-network">Sepolia</span>
          </div>
          <div className="nav-right">
            {txStatus === "pending" && (
              <a
                href={
                  txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : "#"
                }
                target="_blank"
                rel="noreferrer"
                className="tx-pill pending"
              >
                <span className="tx-dot" />
                Confirming…
              </a>
            )}
            {txStatus === "confirmed" && (
              <a
                href={
                  txHash ? `https://sepolia.etherscan.io/tx/${txHash}` : "#"
                }
                target="_blank"
                rel="noreferrer"
                className="tx-pill confirmed"
              >
                ✓ Confirmed ↗
              </a>
            )}
            {wallet ? (
              <div className="wallet-chip">
                <span className="wallet-dot" />
                {short(wallet)}
              </div>
            ) : (
              <button
                className="btn btn-primary nav-connect"
                onClick={connectWallet}
                disabled={connecting}
              >
                {connecting ? "Connecting…" : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </nav>

      {wrongNetwork && wallet && (
        <div className="network-bar">
          Switch MetaMask to <strong>Sepolia testnet</strong> to interact with
          the app
        </div>
      )}

      {/* HERO */}
      <div className="hero">
        <div className="hero-inner">
          <div className="hero-text center">
            <h1 className="hero-title small">
              Ready to earn or post a bounty?
            </h1>
            <p className="hero-sub">
              Claim tasks, submit work, and get paid in ETH.
            </p>
          </div>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-num">{openCount}</span>
              <span className="stat-label">Open tasks</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{totalLocked.toFixed(3)}</span>
              <span className="stat-label">ETH locked</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{completedCount}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{tasks.length}</span>
              <span className="stat-label">Total tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main className="main">
        {/* Toolbar */}
        <div className="toolbar">
          <div className="tab-group">
            <button
              className={`tab-btn ${tab === "browse" ? "active" : ""}`}
              onClick={() => setTab("browse")}
            >
              All Tasks
            </button>
            <button
              className={`tab-btn ${tab === "mine" ? "active" : ""}`}
              onClick={() => setTab("mine")}
            >
              My Tasks
            </button>
          </div>

          <div className="toolbar-right">
            {tab === "browse" && (
              <select
                className="filter-select"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="0">Open</option>
                <option value="1">Claimed</option>
                <option value="2">Submitted</option>
                <option value="3">Completed</option>
                <option value="4">Cancelled</option>
              </select>
            )}
            <button
              className="btn btn-primary"
              onClick={() => (wallet ? setPostModal(true) : connectWallet())}
            >
              + Post a Task
            </button>
          </div>
        </div>

        {/* Grid */}
        {displayTasks.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p className="empty-title">
              {tab === "mine" ? "No tasks yet" : "No tasks found"}
            </p>
            <p className="empty-sub">
              {tab === "mine"
                ? "Post a task or claim one to get started."
                : "Be the first to post a bounty task."}
            </p>
            <button
              className="btn btn-primary"
              onClick={() => (wallet ? setPostModal(true) : connectWallet())}
            >
              Post a Task →
            </button>
          </div>
        ) : (
          <div className="task-grid">{displayTasks.map(renderCard)}</div>
        )}
      </main>

      {/* POST MODAL */}
      {postModal && (
        <div className="overlay" onClick={() => setPostModal(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <div>
                <h2 className="dialog-title">Post a Task</h2>
                <p className="dialog-sub">
                  ETH is locked until you approve the work
                </p>
              </div>
              <button
                className="dialog-close"
                onClick={() => setPostModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="dialog-body">
              <div className="field">
                <label className="field-label">Task Title</label>
                <input
                  className="field-input"
                  placeholder="e.g. Build a smart contract for my NFT project"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">Description</label>
                <textarea
                  className="field-input field-textarea"
                  placeholder="Describe deliverables, requirements, and deadline…"
                  value={postDesc}
                  onChange={(e) => setPostDesc(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="field">
                <label className="field-label">Bounty Amount</label>
                <div className="bounty-input-wrap">
                  <input
                    className="field-input bounty-input"
                    placeholder="0.01"
                    type="number"
                    step="0.001"
                    min="0"
                    value={postBounty}
                    onChange={(e) => setPostBounty(e.target.value)}
                  />
                  <span className="bounty-unit">ETH</span>
                </div>
                <p className="field-hint">
                  Locked in the contract until you approve the completed work.
                </p>
              </div>
            </div>

            <div className="dialog-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setPostModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={postTask}
                disabled={
                  loading ||
                  !postTitle.trim() ||
                  !postDesc.trim() ||
                  !postBounty
                }
              >
                {loading
                  ? "Posting…"
                  : `Lock ${postBounty || "0"} ETH & Post →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULT MODAL */}
      {modal && (
        <div className="overlay" onClick={() => setModal(null)}>
          <div
            className="dialog dialog-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`modal-icon-wrap ${modal.type}`}>
              {modal.type === "success" ? "✓" : "✕"}
            </div>
            <p className="modal-msg">{modal.message}</p>
            {txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="etherscan-btn"
              >
                View on Etherscan ↗
              </a>
            )}
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: "0.75rem" }}
              onClick={() => setModal(null)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      <footer className="footer">
        <span>
          Contract:{" "}
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
          >
            {short(CONTRACT_ADDRESS)}
          </a>
        </span>
        <button className="footer-refresh" onClick={fetchTasks}>
          Refresh ↻
        </button>
      </footer>
    </div>
  );
}
