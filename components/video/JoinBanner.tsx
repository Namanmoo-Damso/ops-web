import styles from "../../app/page.module.css";

type JoinBannerProps = {
  onJoin: () => void;
  busy: boolean;
  error?: string | null;
};

export const JoinBanner = ({ onJoin, busy, error }: JoinBannerProps) => (
  <div className={styles.joinBanner}>
    <span>Ready to connect host session</span>
    <button className={styles.joinButton} onClick={onJoin} disabled={busy}>
      {busy ? "Joining..." : "Join"}
    </button>
    {error ? <span className={styles.joinError}>{error}</span> : null}
  </div>
);
