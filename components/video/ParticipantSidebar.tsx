import { useState, useMemo } from 'react';
import { getInitials } from './VideoTiles';
import { IconButton } from '../ui';
import styles from '../../app/monitoring/page.module.css';

export type MockParticipant = {
  id: string;
  name: string;
  status: string;
  speaking?: boolean;
  muted?: boolean;
  cameraOff?: boolean;
  you?: boolean;
  online?: boolean;
  lastSeen?: string;
  beneficiaryId?: string; // Link to beneficiary for DetailModal
};

type ParticipantSidebarProps = {
  participants: MockParticipant[];
  selectedParticipantId: string | null;
  onSelectParticipant: (id: string) => void;
  onClose: () => void;
  onMuteAll: () => void;
};

export const ParticipantSidebar = ({
  participants,
  selectedParticipantId,
  onSelectParticipant,
  onClose,
  onMuteAll,
}: ParticipantSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParticipants = useMemo(() => {
    // Filter out local participant (yourself) - can't call yourself
    const nonLocalParticipants = participants.filter(p => !p.you);

    if (!searchQuery.trim()) return nonLocalParticipants;
    const query = searchQuery.toLowerCase();
    return nonLocalParticipants.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query),
    );
  }, [participants, searchQuery]);

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span>대상자 목록 ({filteredParticipants.length})</span>
        <IconButton
          variant="close"
          onClick={onClose}
          aria-label="닫기"
          className={styles.topIcon}
        />
      </div>
      <div className={styles.sidebarSearch}>
        <input
          className={styles.searchInput}
          placeholder="대상자 검색"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className={styles.participantList}>
        {filteredParticipants.map(participant => (
          <div
            key={participant.id}
            className={`${styles.participantRow} ${
              participant.speaking ? styles.active : ''
            } ${participant.online === false ? styles.offline : ''} ${
              !participant.you ? styles.participantClickable : ''
            } ${
              participant.id === selectedParticipantId
                ? styles.participantSelected
                : ''
            }`}
            onClick={() => {
              if (participant.you) return;
              onSelectParticipant(participant.id);
            }}
          >
            <div className={styles.participantAvatar}>
              {participant.you ? '나' : getInitials(participant.name)}
            </div>
            <div className={styles.participantMeta}>
              <span className={styles.participantName}>{participant.name}</span>
              <span className={styles.participantStatus}>
                {participant.status || ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
