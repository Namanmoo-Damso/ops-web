import {
  IconMic,
  IconCam,
  IconShare,
  IconChat,
  IconPeople,
  IconApps,
  IconGrid,
  IconMinus,
  IconPlus,
  IconEnd,
} from "../Icons";
import styles from "../../app/page.module.css";

type ControlBarProps = {
  isMicrophoneEnabled: boolean;
  isCameraEnabled: boolean;
  onToggleMicrophone: () => void;
  onToggleCamera: () => void;
  allAudioOff: boolean;
  allVideoOff: boolean;
  onToggleAllAudio: () => void;
  onToggleAllVideo: () => void;
  showParticipantList: boolean;
  onToggleParticipantList: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  onLeaveRoom: () => void;
  connected: boolean;
  canControl: boolean;
};

export const ControlBar = ({
  isMicrophoneEnabled,
  isCameraEnabled,
  onToggleMicrophone,
  onToggleCamera,
  allAudioOff,
  allVideoOff,
  onToggleAllAudio,
  onToggleAllVideo,
  showParticipantList,
  onToggleParticipantList,
  gridSize,
  onGridSizeChange,
  onLeaveRoom,
  connected,
  canControl,
}: ControlBarProps) => (
  <div className={styles.controlBar}>
    <div className={styles.controlGroup}>
      <button
        className={`${styles.controlButton} ${isMicrophoneEnabled ? styles.active : ""}`}
        onClick={onToggleMicrophone}
        disabled={!canControl}
      >
        <IconMic muted={!isMicrophoneEnabled} />
      </button>
      <button
        className={`${styles.controlButton} ${isCameraEnabled ? styles.active : ""}`}
        onClick={onToggleCamera}
        disabled={!canControl}
      >
        <IconCam off={!isCameraEnabled} />
      </button>
      <button className={styles.controlButton}>
        <IconShare />
      </button>
    </div>
    <div className={styles.controlGroupWide}>
      <button
        className={`${styles.controlButtonWide} ${allAudioOff ? styles.controlButtonWideActive : ""}`}
        onClick={onToggleAllAudio}
        disabled={!canControl}
        type="button"
      >
        <IconMic muted={allAudioOff} />
        <span>All Audio</span>
      </button>
      <button
        className={`${styles.controlButtonWide} ${allVideoOff ? styles.controlButtonWideActive : ""}`}
        onClick={onToggleAllVideo}
        disabled={!canControl}
        type="button"
      >
        <IconCam off={allVideoOff} />
        <span>All Video</span>
      </button>
    </div>
    <div className={styles.controlGroup}>
      <button className={styles.controlButton}>
        <IconChat />
      </button>
      <button
        className={`${styles.controlButton} ${showParticipantList ? styles.active : ""}`}
        onClick={onToggleParticipantList}
      >
        <IconPeople />
      </button>
      <button className={styles.controlButton}>
        <IconApps />
      </button>
    </div>
    <div className={styles.gridSpinner}>
      <button
        className={styles.gridSpinnerBtn}
        onClick={() => onGridSizeChange(Math.max(3, gridSize - 1))}
        disabled={gridSize <= 3}
        type="button"
      >
        <IconMinus />
      </button>
      <div className={styles.gridSpinnerValue}>
        <IconGrid />
        <span>{gridSize}×{gridSize}</span>
      </div>
      <button
        className={styles.gridSpinnerBtn}
        onClick={() => onGridSizeChange(Math.min(7, gridSize + 1))}
        disabled={gridSize >= 7}
        type="button"
      >
        <IconPlus />
      </button>
    </div>
    <button
      className={`${styles.controlButton} ${styles.danger}`}
      onClick={onLeaveRoom}
      disabled={!connected}
    >
      <IconEnd />
    </button>
  </div>
);
