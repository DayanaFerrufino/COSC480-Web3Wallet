export default function MessagesPage({ wallet, connectWallet, setView }) {
  if (!wallet) {
    return (
      <div className="empty">
        <div className="empty-icon">🔒</div>
        <p className="empty-title">Connect your wallet</p>
        <p className="empty-sub">Connect to see your messages.</p>
        <button className="btn btn-primary" onClick={connectWallet}>
          Connect Wallet
        </button>
      </div>
    );
  }

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
          <h1 className="my-tasks-title">Messages</h1>
          <p className="my-tasks-sub">
            Your conversations with posters and workers
          </p>
        </div>
      </div>
      <div className="empty">
        <div className="empty-icon">💬</div>
        <p className="empty-title">Coming soon</p>
        <p className="empty-sub">
          Messaging between posters and workers is on the way.
        </p>
      </div>
    </>
  );
}
