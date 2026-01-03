import { useState } from 'react';
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
} from '../Icons';
import styles from '../../app/page.module.css';

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
}: ControlBarProps) => {
  const [isHidden, setIsHidden] = useState(false);

  if (isHidden) {
    return (
      <button
        onClick={() => setIsHidden(false)}
        className={styles.controlBarToggle}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'white',
          border: '1px solid #E9F0DF',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          cursor: 'pointer',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 5v14M5 12l7-7 7 7" />
        </svg>
      </button>
    );
  }

  return (
    <div className={styles.controlBar}>
      <div className={styles.controlGroup}>
        <button
          className={`${styles.controlButton} ${
            isMicrophoneEnabled ? styles.active : ''
          }`}
          onClick={onToggleMicrophone}
          disabled={!canControl}
        >
          <IconMic muted={!isMicrophoneEnabled} />
        </button>
        <button
          className={`${styles.controlButton} ${
            isCameraEnabled ? styles.active : ''
          }`}
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
          className={`${styles.controlButtonWide} ${
            allAudioOff ? styles.controlButtonWideActive : ''
          }`}
          onClick={onToggleAllAudio}
          disabled={!canControl}
          type="button"
        >
          <IconMic muted={allAudioOff} />
          <span>All Audio</span>
        </button>
        <button
          className={`${styles.controlButtonWide} ${
            allVideoOff ? styles.controlButtonWideActive : ''
          }`}
          onClick={onToggleAllVideo}
          disabled={!canControl}
          type="button"
        >
          <IconCam off={allVideoOff} />
          <span>All Video</span>
        </button>
      </div>
      <div className={styles.controlGroup}>
        <button
          className={`${styles.controlButton} ${
            showParticipantList ? styles.active : ''
          }`}
          onClick={onToggleParticipantList}
        >
          <IconPeople />
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
          <span>
            {gridSize}×{gridSize}
          </span>
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
      <button
        className={styles.controlButton}
        onClick={() => setIsHidden(true)}
        title="Hide controls"
        style={{ marginLeft: '8px' }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 19V5M5 12l7 7 7-7" />
        </svg>
      </button>
    </div>
  );
};
