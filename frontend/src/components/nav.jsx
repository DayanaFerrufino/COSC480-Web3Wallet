import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  MessageSquare,
  User,
  LogOut,
} from "lucide-react";
import { signOut } from "../lib/auth";

export default function Nav({
  wallet,
  setWallet,
  txStatus,
  txHash,
  setView,
  connectWallet,
  connecting,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const short = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
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
              href={txHash ? "https://sepolia.etherscan.io/tx/" + txHash : "#"}
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
              href={txHash ? "https://sepolia.etherscan.io/tx/" + txHash : "#"}
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
                  <button
                    className="nav-dropdown-item"
                    onClick={() => {
                      setView("messages");
                      setDropdownOpen(false);
                    }}
                  >
                    <MessageSquare size={15} strokeWidth={1.75} />
                    Messages
                  </button>
                  <button className="nav-dropdown-item" disabled>
                    <User size={15} strokeWidth={1.75} />
                    Profile<span className="soon-badge">Soon</span>
                  </button>
                  <button
                    className="nav-dropdown-item"
                    onClick={async () => {
                      await signOut();
                      setWallet(null);
                      localStorage.removeItem("tb_token");
                      setDropdownOpen(false);
                    }}
                  >
                    <LogOut size={15} strokeWidth={1.75} />
                    Sign Out
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
  );
}
