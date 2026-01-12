'use client';

import { useState } from 'react';
import { IconPeople, IconGrid, IconMinus, IconPlus } from '../Icons';
import { Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import styles from '../../app/page.module.css';

type ControlBarProps = {
  showParticipantList: boolean;
  onToggleParticipantList: () => void;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  connected: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

export const ControlBar = ({
  showParticipantList,
  onToggleParticipantList,
  gridSize,
  onGridSizeChange,
  connected,
  isFullscreen = false,
  onToggleFullscreen,
}: ControlBarProps) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Actually mute/unmute audio when implemented
  };

  return (
    <div className={styles.controlBar}>
      {/* Volume Toggle */}
      <div className={styles.controlGroup}>
        <button
          className={`${styles.controlButton} ${isMuted ? styles.active : ''}`}
          onClick={toggleMute}
          title={isMuted ? '음소거 해제' : '음소거'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      </div>

      {/* Participants Toggle */}
      <div className={styles.controlGroup}>
        <button
          className={`${styles.controlButton} ${showParticipantList ? styles.active : ''}`}
          onClick={onToggleParticipantList}
          title="참가자 목록"
        >
          <IconPeople />
        </button>
      </div>

      {/* Grid Size Spinner */}
      <div className={styles.gridSpinner}>
        <button
          className={styles.gridSpinnerBtn}
          onClick={() => onGridSizeChange(Math.max(2, gridSize - 1))}
          disabled={gridSize <= 2}
          type="button"
          title="그리드 축소"
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
          title="그리드 확대"
        >
          <IconPlus />
        </button>
      </div>

      {/* Fullscreen Toggle */}
      {onToggleFullscreen && (
        <div className={styles.controlGroup}>
          <button
            className={`${styles.controlButton} ${isFullscreen ? styles.active : ''}`}
            onClick={onToggleFullscreen}
            title={isFullscreen ? '전체화면 종료' : '전체화면'}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      )}
    </div>
  );
};
