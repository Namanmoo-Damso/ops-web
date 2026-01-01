import { useState, useMemo } from "react";
import { IconMic } from "../Icons";
import { getInitials } from "./VideoTiles";
import styles from "../../app/page.module.css";

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
};

type ParticipantSidebarProps = {
  participants: MockParticipant[];
  selectedParticipantId: string | null;
  onSelectParticipant: (id: string) => void;
  onClose: () => void;
  onMuteAll: () => void;
  onInvite: (id: string) => void;
  inviteBusy: boolean;
  inviteStatus: string | null;
  connected: boolean;
  canControl: boolean;
};

export const ParticipantSidebar = ({
  participants,
  selectedParticipantId,
  onSelectParticipant,
  onClose,
  onMuteAll,
  onInvite,
  inviteBusy,
  inviteStatus,
  connected,
  canControl,
}: ParticipantSidebarProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return participants;
    const query = searchQuery.toLowerCase();
    return participants.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query)
    );
  }, [participants, searchQuery]);

  const selectedParticipant = selectedParticipantId
    ? participants.find((p) => p.id === selectedParticipantId)
    : null;
  const isSelectedOnline = selectedParticipant?.online === true;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <span>Participants ({participants.length})</span>
        <span className={styles.topIcon} onClick={onClose}>X</span>
      </div>
      <div className={styles.sidebarSearch}>
        <input
          className={styles.searchInput}
          placeholder="Find participant"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className={styles.participantList}>
        {filteredParticipants.map((participant) => (
          <div
            key={participant.id}
            className={`${styles.participantRow} ${
              participant.speaking ? styles.active : ""
            } ${participant.online === false ? styles.offline : ""} ${
              !participant.you ? styles.participantClickable : ""
            } ${participant.id === selectedParticipantId ? styles.participantSelected : ""}`}
            onClick={() => {
              if (participant.you) return;
              onSelectParticipant(participant.id);
            }}
          >
            <div className={styles.participantAvatar}>
              {participant.you ? "YOU" : getInitials(participant.name)}
            </div>
            <div className={styles.participantMeta}>
              <span className={styles.participantName}>
                {participant.name}
              </span>
              <span className={styles.participantStatus}>
                {participant.status || ""}
              </span>
            </div>
            <div className={styles.participantIcon}>
              <IconMic muted={participant.muted} />
            </div>
          </div>
        ))}
      </div>
      <div className={styles.sidebarFooter}>
        <button
          className={styles.footerButton}
          onClick={onMuteAll}
          disabled={!canControl}
          type="button"
        >
          Mute All
        </button>
        <button
          className={`${styles.footerButton} ${styles.primary}`}
          onClick={() => {
            if (isSelectedOnline) return;
            onInvite(selectedParticipantId ?? "");
          }}
          disabled={!connected || inviteBusy || !selectedParticipantId || isSelectedOnline}
        >
          {isSelectedOnline ? "Already in room" : "Invite"}
        </button>
      </div>
      {inviteStatus ? (
        <div className={styles.sidebarStatus}>{inviteStatus}</div>
      ) : null}
    </aside>
  );
};
