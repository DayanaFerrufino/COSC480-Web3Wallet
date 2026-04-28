import { useState, useEffect, useCallback, useRef } from "react";
import { ethers } from "ethers";
import {
  Code2,
  Paintbrush,
  FileText,
  Bug,
  BarChart2,
  Shield,
  Rocket,
  FlaskConical,
  Smartphone,
  Database,
  Megaphone,
  Globe,
  Coins,
  Wrench,
  Video,
  BookOpen,
  Briefcase,
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  User,
} from "lucide-react";
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

// ── CATEGORIES ──
const CATEGORIES = [
  {
    id: "blockchain",
    label: "Blockchain & Web3",
    Icon: Coins,
    keywords: [
      "solidity",
      "contract",
      "smart",
      "web3",
      "dapp",
      "blockchain",
      "token",
      "nft",
    ],
  },
  {
    id: "dev",
    label: "Development",
    Icon: Code2,
    keywords: [
      "code",
      "dev",
      "develop",
      "frontend",
      "backend",
      "api",
      "script",
      "build",
      "react",
      "node",
    ],
  },
  {
    id: "design",
    label: "Design",
    Icon: Paintbrush,
    keywords: [
      "design",
      "ui",
      "ux",
      "figma",
      "logo",
      "brand",
      "graphic",
      "visual",
      "css",
      "style",
    ],
  },
  {
    id: "writing",
    label: "Writing & Docs",
    Icon: FileText,
    keywords: [
      "write",
      "docs",
      "content",
      "blog",
      "copy",
      "article",
      "documentation",
      "text",
    ],
  },
  {
    id: "bugfix",
    label: "Bug Fix",
    Icon: Bug,
    keywords: ["fix", "debug", "error", "issue", "patch", "broken", "bug"],
  },
  {
    id: "data",
    label: "Data & Analytics",
    Icon: BarChart2,
    keywords: [
      "data",
      "analytics",
      "chart",
      "dashboard",
      "report",
      "spreadsheet",
      "metric",
    ],
  },
  {
    id: "security",
    label: "Security",
    Icon: Shield,
    keywords: [
      "security",
      "audit",
      "hack",
      "protect",
      "pentest",
      "vulnerability",
    ],
  },
  {
    id: "devops",
    label: "DevOps",
    Icon: Rocket,
    keywords: [
      "deploy",
      "launch",
      "ship",
      "release",
      "infrastructure",
      "devops",
      "server",
    ],
  },
  {
    id: "testing",
    label: "Testing",
    Icon: FlaskConical,
    keywords: ["test", "qa", "testing", "quality"],
  },
  {
    id: "marketing",
    label: "Marketing",
    Icon: Megaphone,
    keywords: ["market", "seo", "social", "campaign", "ads", "growth"],
  },
  {
    id: "mobile",
    label: "Mobile",
    Icon: Smartphone,
    keywords: ["mobile", "app", "ios", "android"],
  },
  { id: "other", label: "Other", Icon: Briefcase, keywords: [] },
];

function getCategory(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.id === "other") continue;
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.id;
  }
  return "other";
}

function getTaskIcon(title = "", description = "") {
  const catId = getCategory(title, description);
  return CATEGORIES.find((c) => c.id === catId)?.Icon ?? Briefcase;
}

export default function App() {
  const [wallet, setWallet] = useState(null);
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("browse");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [postModal, setPostModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [postTitle, setPostTitle] = useState("");
  const [postDesc, setPostDesc] = useState("");
  const [postBounty, setPostBounty] = useState("");
  const [proofInput, setProofInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  // Sidebar filters
  const [minBounty, setMinBounty] = useState("");
  const [maxBounty, setMaxBounty] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);

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

  useEffect(() => {
    if (selectedTask) {
      const updated = tasks.find((t) => t.id === selectedTask.id);
      if (updated) setSelectedTask(updated);
    }
  }, [tasks]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    const proof = proofInput.trim();
    if (!proof) return;
    getContract(true).then((c) =>
      doTx(
        () => c.submitWork(id, proof),
        "Work submitted! Waiting for poster approval.",
      ),
    );
    setProofInput("");
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
          year: "numeric",
        })
      : "";
  const fmtTime = (ts) =>
    ts
      ? new Date(ts * 1000).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const openCount = tasks.filter((t) => t.status === 0).length;
  const totalLocked = tasks
    .filter((t) => t.status < 3)
    .reduce((s, t) => s + Number(ethers.formatEther(t.bounty || 0n)), 0);
  const completedCount = tasks.filter((t) => t.status === 3).length;

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const clearFilters = () => {
    setMinBounty("");
    setMaxBounty("");
    setSelectedCategories([]);
    setShowAll(false);
    setSearchQuery("");
  };

  const hasActiveFilters =
    minBounty ||
    maxBounty ||
    selectedCategories.length > 0 ||
    showAll ||
    searchQuery;

  // ── DISPLAY TASKS ──
  const displayTasks = tasks.filter((t) => {
    // By default only show open tasks unless showAll is on
    if (!showAll && t.status !== 0) return false;
    // Hide cancelled always unless showAll
    if (t.status === 4 && !showAll) return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      )
        return false;
    }

    // Bounty range
    const bountyEth = Number(ethers.formatEther(t.bounty || 0n));
    if (minBounty && bountyEth < Number(minBounty)) return false;
    if (maxBounty && bountyEth > Number(maxBounty)) return false;

    // Category
    if (selectedCategories.length > 0) {
      const taskCat = getCategory(t.title, t.description);
      if (!selectedCategories.includes(taskCat)) return false;
    }

    return true;
  });

  // Count tasks per category (from open tasks only unless showAll)
  const baseTasks = showAll
    ? tasks.filter((t) => t.status !== 4)
    : tasks.filter((t) => t.status === 0);
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = baseTasks.filter(
      (t) => getCategory(t.title, t.description) === cat.id,
    ).length;
    return acc;
  }, {});

  // ── TASK CARD ──
  const renderCard = (task) => {
    const TaskIcon = getTaskIcon(task.title, task.description);
    return (
      <div
        className="task-card"
        key={task.id}
        onClick={() => setSelectedTask(task)}
      >
        <div className="card-top">
          <div className="card-icon">
            <TaskIcon size={20} strokeWidth={1.75} />
          </div>
          <span className={`status-pill ${STATUS_CLASSES[task.status]}`}>
            {STATUS_LABELS[task.status]}
          </span>
        </div>
        <h3 className="card-title">{task.title}</h3>
        <p className="card-desc">{task.description}</p>
        <div className="card-divider" />
        <div className="card-footer-row">
          <span className="bounty-badge">{fmtEth(task.bounty)} ETH</span>
          <span className="card-date">{fmtDate(task.createdAt)}</span>
        </div>
        <div className="card-view-hint">View details →</div>
      </div>
    );
  };

  // ── SIDEBAR ──
  const renderSidebar = () => (
    <aside className="sidebar">
      {/* Bounty Range */}
      <div className="sidebar-section">
        <span className="sidebar-heading">Bounty Range</span>
        <div className="bounty-range-row">
          <input
            className="bounty-range-input"
            placeholder="Min ETH"
            type="number"
            min="0"
            step="0.01"
            value={minBounty}
            onChange={(e) => setMinBounty(e.target.value)}
          />
          <span className="bounty-range-sep">—</span>
          <input
            className="bounty-range-input"
            placeholder="Max ETH"
            type="number"
            min="0"
            step="0.01"
            value={maxBounty}
            onChange={(e) => setMaxBounty(e.target.value)}
          />
        </div>
      </div>

      {/* Category */}
      <div className="sidebar-section">
        <span className="sidebar-heading">Category</span>
        <div className="category-list">
          {CATEGORIES.map(({ id, label }) => (
            <label className="category-item" key={id}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(id)}
                onChange={() => toggleCategory(id)}
              />
              <span className="category-label">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Show all statuses toggle */}
      <div className="sidebar-section">
        <div className="show-all-toggle" onClick={() => setShowAll((v) => !v)}>
          <span className="show-all-label">Show all statuses</span>
          <div className={`toggle-switch ${showAll ? "on" : ""}`}>
            <div className="toggle-knob" />
          </div>
        </div>
      </div>

      {/* Clear */}
      {hasActiveFilters && (
        <button className="clear-filters-btn" onClick={clearFilters}>
          ✕ Clear all filters
        </button>
      )}
    </aside>
  );

  // ── MY TASKS ──
  const renderMyTasks = () => {
    if (!wallet)
      return (
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <p className="empty-title">Connect your wallet</p>
          <p className="empty-sub">
            Connect to see your posted and claimed tasks.
          </p>
          <button className="btn btn-primary" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      );

    const posted = tasks.filter(
      (t) => t.poster.toLowerCase() === wallet.toLowerCase(),
    );
    const working = tasks.filter(
      (t) =>
        t.worker &&
        t.worker !== ethers.ZeroAddress &&
        t.worker.toLowerCase() === wallet.toLowerCase(),
    );

    const renderSection = (title, subtitle, items, emptyMsg) => (
      <div className="my-tasks-section">
        <div className="my-tasks-section-header">
          <div>
            <h2 className="my-tasks-section-title">{title}</h2>
            <p className="my-tasks-section-sub">{subtitle}</p>
          </div>
          <span className="my-tasks-count">{items.length}</span>
        </div>
        {items.length === 0 ? (
          <p className="my-tasks-empty">{emptyMsg}</p>
        ) : (
          <div className="task-grid">{items.map(renderCard)}</div>
        )}
      </div>
    );

    return (
      <div className="my-tasks-dashboard">
        {renderSection(
          "Tasks I Posted",
          "Bounties you created and locked ETH into",
          posted,
          "You haven't posted any tasks yet.",
        )}
        {renderSection(
          "Tasks I'm Working On",
          "Tasks you've claimed and are delivering",
          working,
          "You haven't claimed any tasks yet.",
        )}
      </div>
    );
  };

  // ── DETAIL MODAL ──
  const renderDetailModal = () => {
    if (!selectedTask) return null;
    const task = selectedTask;
    const isPoster =
      wallet && task.poster.toLowerCase() === wallet.toLowerCase();
    const isWorker =
      wallet &&
      task.worker &&
      task.worker.toLowerCase() === wallet.toLowerCase();
    const TaskIcon = getTaskIcon(task.title, task.description);
    const canAct = wallet && !wrongNetwork;

    return (
      <div className="overlay" onClick={() => setSelectedTask(null)}>
        <div className="detail-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="detail-header">
            <div className="detail-header-left">
              <div className="detail-icon">
                <TaskIcon size={22} strokeWidth={1.75} />
              </div>
              <div>
                <div className="detail-header-top">
                  <span
                    className={`status-pill ${STATUS_CLASSES[task.status]}`}
                  >
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className="detail-task-id">#{task.id}</span>
                </div>
                <h2 className="detail-title">{task.title}</h2>
              </div>
            </div>
            <button
              className="dialog-close"
              onClick={() => setSelectedTask(null)}
            >
              ✕
            </button>
          </div>

          <div className="detail-body">
            <div className="detail-section">
              <span className="detail-section-label">Description</span>
              <p className="detail-description">{task.description}</p>
            </div>

            <div className="detail-meta-grid">
              <div className="detail-meta-item">
                <span className="meta-label">Bounty</span>
                <span className="meta-value bounty-value detail-bounty">
                  {fmtEth(task.bounty)} ETH
                </span>
              </div>
              <div className="detail-meta-item">
                <span className="meta-label">Posted by</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${task.poster}`}
                  target="_blank"
                  rel="noreferrer"
                  className="meta-value meta-link"
                >
                  {short(task.poster)}
                  {isPoster && <span className="you-badge">you</span>}
                </a>
              </div>
              <div className="detail-meta-item">
                <span className="meta-label">Posted on</span>
                <span className="meta-value">{fmtDate(task.createdAt)}</span>
              </div>
              <div className="detail-meta-item">
                <span className="meta-label">Time</span>
                <span className="meta-value">{fmtTime(task.createdAt)}</span>
              </div>
              {task.worker && task.worker !== ethers.ZeroAddress && (
                <div className="detail-meta-item">
                  <span className="meta-label">Worker</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${task.worker}`}
                    target="_blank"
                    rel="noreferrer"
                    className="meta-value meta-link"
                  >
                    {short(task.worker)}
                    {isWorker && <span className="you-badge">you</span>}
                  </a>
                </div>
              )}
            </div>

            {task.proofUrl && (
              <div className="detail-section">
                <span className="detail-section-label">Submitted Work</span>
                <a
                  href={task.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="proof-link"
                >
                  <span>View submitted work</span>
                  <span className="proof-arrow">↗</span>
                </a>
              </div>
            )}

            {canAct && (
              <div className="detail-actions">
                {task.status === 0 && !isPoster && (
                  <div className="claim-block">
                    <div className="claim-info">
                      <span className="claim-info-title">
                        Ready to work on this?
                      </span>
                      <span className="claim-info-sub">
                        Claiming commits you to deliver. The poster holds{" "}
                        {fmtEth(task.bounty)} ETH in escrow until they approve
                        your work.
                      </span>
                    </div>
                    <button
                      className="btn btn-primary btn-lg"
                      onClick={() => claimTask(task.id)}
                      disabled={loading}
                    >
                      Claim Task →
                    </button>
                  </div>
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
                  <div className="detail-section">
                    <span className="detail-section-label">
                      Submit your work
                    </span>
                    <div className="submit-proof-row">
                      <input
                        className="proof-input"
                        placeholder="Proof URL (GitHub, Loom, Drive…)"
                        value={proofInput}
                        onChange={(e) => setProofInput(e.target.value)}
                      />
                      <button
                        className="btn btn-blue"
                        onClick={() => submitWork(task.id)}
                        disabled={loading || !proofInput.trim()}
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}
                {task.status === 2 && isPoster && (
                  <div className="claim-block">
                    <div className="claim-info">
                      <span className="claim-info-title">
                        Work has been submitted
                      </span>
                      <span className="claim-info-sub">
                        Review the proof above. Approving will instantly send{" "}
                        {fmtEth(task.bounty)} ETH to the worker.
                      </span>
                    </div>
                    <button
                      className="btn btn-green btn-lg"
                      onClick={() => approveWork(task.id)}
                      disabled={loading}
                    >
                      ✓ Approve & Pay {fmtEth(task.bounty)} ETH
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="detail-footer">
            <button
              className="btn btn-message"
              onClick={() => alert("Messaging coming soon!")}
            >
              💬 Message Poster
            </button>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-ghost btn-sm"
            >
              View on Etherscan ↗
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="page">
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
              <div className="nav-dropdown-wrap" ref={dropdownRef}>
                <button
                  className="wallet-chip"
                  onClick={() => setDropdownOpen((o) => !o)}
                >
                  <span className="wallet-dot" />
                  {short(wallet)}
                  <ChevronDown
                    size={13}
                    strokeWidth={2.5}
                    className={`chevron ${dropdownOpen ? "open" : ""}`}
                  />
                </button>
                {dropdownOpen && (
                  <div className="nav-dropdown">
                    <button
                      className="nav-dropdown-item"
                      onClick={() => {
                        setView("myTasks");
                        setDropdownOpen(false);
                      }}
                    >
                      <LayoutDashboard size={15} strokeWidth={1.75} />
                      My Tasks
                    </button>
                    <button className="nav-dropdown-item" disabled>
                      <MessageSquare size={15} strokeWidth={1.75} />
                      Messages<span className="soon-badge">Soon</span>
                    </button>
                    <button className="nav-dropdown-item" disabled>
                      <User size={15} strokeWidth={1.75} />
                      Profile<span className="soon-badge">Soon</span>
                    </button>
                  </div>
                )}
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

      <div className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1 className="hero-title">
              Ready to earn or <span>post a bounty?</span>
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

      <main className="main">
        {view === "myTasks" ? (
          <>
            <div className="my-tasks-header">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setView("browse")}
              >
                ← Back
              </button>
              <div>
                <h1 className="my-tasks-title">My Tasks</h1>
                <p className="my-tasks-sub">
                  Your posted bounties and claimed work
                </p>
              </div>
            </div>
            {renderMyTasks()}
          </>
        ) : (
          <>
            <div className="toolbar">
              <input
                className="search-input"
                placeholder="Search tasks…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="toolbar-right">
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    wallet ? setPostModal(true) : connectWallet()
                  }
                >
                  + Post a Task
                </button>
              </div>
            </div>

            <div className="browse-layout">
              {renderSidebar()}
              <div className="browse-content">
                {displayTasks.length === 0 ? (
                  <div className="empty">
                    <div className="empty-icon">📋</div>
                    <p className="empty-title">No tasks found</p>
                    <p className="empty-sub">
                      {hasActiveFilters
                        ? "Try adjusting your filters."
                        : "Be the first to post a bounty task."}
                    </p>
                    {!hasActiveFilters && (
                      <button
                        className="btn btn-primary"
                        onClick={() =>
                          wallet ? setPostModal(true) : connectWallet()
                        }
                      >
                        Post a Task →
                      </button>
                    )}
                    {hasActiveFilters && (
                      <button className="btn btn-ghost" onClick={clearFilters}>
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="task-grid">
                    {displayTasks.map(renderCard)}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

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

      {renderDetailModal()}

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
