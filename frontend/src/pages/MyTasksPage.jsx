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
  Megaphone,
  Coins,
  Briefcase,
} from "lucide-react";

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

function getTaskIcon(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();
  const icons = [
    {
      id: "blockchain",
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
      Icon: Bug,
      keywords: ["fix", "debug", "error", "issue", "patch", "broken", "bug"],
    },
    {
      id: "data",
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
      Icon: FlaskConical,
      keywords: ["test", "qa", "testing", "quality"],
    },
    {
      id: "marketing",
      Icon: Megaphone,
      keywords: ["market", "seo", "social", "campaign", "ads", "growth"],
    },
    {
      id: "mobile",
      Icon: Smartphone,
      keywords: ["mobile", "app", "ios", "android"],
    },
  ];
  return (
    icons.find((i) => i.keywords.some((kw) => text.includes(kw)))?.Icon ??
    Briefcase
  );
}

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

export default function MyTasksPage({
  tasks,
  wallet,
  connectWallet,
  setView,
  setSelectedTask,
}) {
  if (!wallet) {
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
  }

  const posted = tasks.filter(
    (t) => t.poster.toLowerCase() === wallet.toLowerCase(),
  );
  const working = tasks.filter(
    (t) =>
      t.worker &&
      t.worker !== ethers.ZeroAddress &&
      t.worker.toLowerCase() === wallet.toLowerCase(),
  );

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
          <p className="my-tasks-sub">Your posted bounties and claimed work</p>
        </div>
      </div>
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
    </>
  );
}
