'use client';

import { ControlBar } from './ControlBar';

export interface ControlBarWrapperProps {
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showParticipantList: boolean;
  onToggleParticipantList: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

/**
 * Wrapper component for ControlBar within a LiveKit room context.
 * Simplified to only pass through grid, participant list, and fullscreen controls.
 */
export const ControlBarWrapper = ({
  gridSize,
  onGridSizeChange,
  showParticipantList,
  onToggleParticipantList,
  isFullscreen,
  onToggleFullscreen,
}: ControlBarWrapperProps) => {
  return (
    <ControlBar
      showParticipantList={showParticipantList}
      onToggleParticipantList={onToggleParticipantList}
      gridSize={gridSize}
      onGridSizeChange={onGridSizeChange}
      connected={true}
      isFullscreen={isFullscreen}
      onToggleFullscreen={onToggleFullscreen}
    />
  );
};
