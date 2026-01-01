import { VideoTrack, TrackRefContext } from "@livekit/components-react";
import { IconUser, IconMic, IconCam } from "../Icons";
import styles from "../../app/page.module.css";

export const getInitials = (name: string) => {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export const TileSignal = () => (
  <div className={styles.signalBars}>
    <span className={styles.signalBar} />
    <span className={styles.signalBar} />
    <span className={styles.signalBar} />
  </div>
);

export const EmptyTile = () => (
  <div className={`${styles.tile} ${styles.tileEmpty}`}>
    <div className={styles.emptyContent}>
      <IconUser />
      <span>Empty</span>
    </div>
  </div>
);

export const TileActionButton = ({
  onClick,
  disabled,
  off,
  title,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  off: boolean;
  title: string;
  children: React.ReactNode;
}) => (
  <button
    className={`${styles.tileAction} ${off ? styles.tileActionOff : ""}`}
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    disabled={disabled}
    title={title}
    type="button"
  >
    {children}
  </button>
);

export const LiveTile = ({
  trackRef,
  displayName,
  focused,
  onFocus,
  onToggleAudio,
  onToggleVideo,
  audioOff,
  videoOff,
  canControl,
}: {
  trackRef: any;
  displayName: string;
  focused: boolean;
  onFocus: () => void;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  audioOff: boolean;
  videoOff: boolean;
  canControl: boolean;
}) => {
  const participant = trackRef.participant;
  const isLocal = participant?.isLocal;
  const showOverlay = videoOff;

  return (
    <div
      className={`${styles.tile} ${focused ? styles.tileFocused : ""}`}
      onClick={onFocus}
    >
      <TrackRefContext.Provider value={trackRef}>
        <VideoTrack className={styles.video} />
      </TrackRefContext.Provider>
      {showOverlay ? (
        <div className={styles.videoOffOverlay}>
          <div className={styles.videoOffAvatar}>
            {getInitials(displayName)}
          </div>
        </div>
      ) : null}
      <div className={styles.tileFooter}>
        <span className={styles.tileName}>{displayName}</span>
        <div className={styles.tileIcons}>
          <TileActionButton
            onClick={onToggleAudio}
            disabled={!canControl}
            off={audioOff}
            title={audioOff ? "Unmute Audio" : "Mute Audio"}
          >
            <IconMic muted={audioOff} />
          </TileActionButton>
          <TileActionButton
            onClick={onToggleVideo}
            disabled={!canControl || isLocal}
            off={videoOff}
            title={videoOff ? "Enable Video" : "Disable Video"}
          >
            <IconCam off={videoOff} />
          </TileActionButton>
          <TileSignal />
        </div>
      </div>
    </div>
  );
};
