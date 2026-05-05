export default function ProfilePage({ wallet, connectWallet, setView }) {
  if (!wallet) {
    return (
      <div className="empty">
        <div className="empty-icon">🔒</div>
        <p className="empty-title">Connect your wallet</p>
        <p className="empty-sub">Connect to see your profile.</p>
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
          <h1 className="my-tasks-title">Profile</h1>
          <p className="my-tasks-sub">Your TaskBounty profile</p>
        </div>
      </div>
      <div className="empty">
        <div className="empty-icon">👤</div>
        <p className="empty-title">Coming soon</p>
        <p className="empty-sub">Profile pages are on the way.</p>
      </div>
    </>
  );
}
