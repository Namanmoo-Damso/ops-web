'use client';

import { useLocalParticipant } from '@livekit/components-react';
import { ControlBar } from './ControlBar';

export interface ControlBarWrapperProps {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showParticipantList: boolean;
  onToggleParticipantList: () => void;
  isTakeoverActive: boolean;
}

/**
 * Wrapper component to access LiveKit hooks within a room context.
 * Mic is controlled exclusively via the takeover button in the
 * ParticipantDetailSidebar, so the mic toggle in the main control bar
 * is effectively disabled and only reflects current takeover state.
 */
export const ControlBarWrapper = ({
  gridSize,
  onGridSizeChange,
  showParticipantList,
  onToggleParticipantList,
  isTakeoverActive,
}: ControlBarWrapperProps) => {
  const { isCameraEnabled, localParticipant } = useLocalParticipant();

  const toggleCamera = async () => {
    if (!localParticipant) return;
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ControlBar
      // Mic state comes from takeover, and the toggle is disabled
      isMicrophoneEnabled={isTakeoverActive}
      isCameraEnabled={isCameraEnabled}
      onToggleMicrophone={() => {}}
      onToggleCamera={toggleCamera}
      allAudioOff={false}
      allVideoOff={false}
      onToggleAllAudio={() => {}}
      onToggleAllVideo={() => {}}
      showParticipantList={showParticipantList}
      onToggleParticipantList={onToggleParticipantList}
      gridSize={gridSize}
      onGridSizeChange={onGridSizeChange}
      onLeaveRoom={() => {}}
      connected={true}
      canControl={true}
    />
  );
};
