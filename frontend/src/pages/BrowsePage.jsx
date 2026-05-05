import { useState } from "react";
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

const CATEGORIES = [
  {
    id: "blockchain",
    label: "Blockchain & Web3",
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
    keywords: ["fix", "debug", "error", "issue", "patch", "broken", "bug"],
  },
  {
    id: "data",
    label: "Data & Analytics",
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
    keywords: ["test", "qa", "testing", "quality"],
  },
  {
    id: "marketing",
    label: "Marketing",
    keywords: ["market", "seo", "social", "campaign", "ads", "growth"],
  },
  {
    id: "mobile",
    label: "Mobile",
    keywords: ["mobile", "app", "ios", "android"],
  },
  { id: "other", label: "Other", keywords: [] },
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
  const icons = {
    blockchain: Coins,
    dev: Code2,
    design: Paintbrush,
    writing: FileText,
    bugfix: Bug,
    data: BarChart2,
    security: Shield,
    devops: Rocket,
    testing: FlaskConical,
    marketing: Megaphone,
    mobile: Smartphone,
    other: Briefcase,
  };
  return icons[catId] ?? Briefcase;
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

export default function BrowsePage({
  tasks,
  wallet,
  connectWallet,
  setSelectedTask,
  setPostModal,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [minBounty, setMinBounty] = useState("");
  const [maxBounty, setMaxBounty] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const toggleCategory = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const clearFilters = () => {
    setMinBounty("");
    setMaxBounty("");
    setSelectedCategories([]);
    setSearchQuery("");
  };

  const hasActiveFilters =
    minBounty || maxBounty || selectedCategories.length > 0;

  const displayTasks = tasks.filter((t) => {
    if (t.status !== 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      )
        return false;
    }
    const bountyEth = Number(ethers.formatEther(t.bounty || 0n));
    if (minBounty && bountyEth < Number(minBounty)) return false;
    if (maxBounty && bountyEth > Number(maxBounty)) return false;
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(getCategory(t.title, t.description)))
        return false;
    }
    return true;
  });

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

  return (
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
            onClick={() => (wallet ? setPostModal(true) : connectWallet())}
          >
            + Post a Task
          </button>
        </div>
      </div>

      <div className="browse-layout">
        <aside className="sidebar">
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
          {hasActiveFilters && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              ✕ Clear all filters
            </button>
          )}
        </aside>

        <div className="browse-content">
          {displayTasks.length === 0 ? (
            <div className="empty">
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
            <div className="task-grid">{displayTasks.map(renderCard)}</div>
          )}
        </div>
      </div>
    </>
  );
}
