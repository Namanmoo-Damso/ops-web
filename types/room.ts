export type RoomEvent = {
  type: 'room-created' | 'room-updated' | 'participant-joined' | 'participant-left';
  roomName: string;
  identity?: string;
  name?: string;
  timestamp: string;
};

export type UserEvent = {
  type: 'user-logout' | 'user-deleted';
  identity: string;
  userId: string;
  timestamp: string;
};

export type AppEvent = UserEvent | RoomEvent;

export type RoomParticipant = {
  identity: string;
  name: string;
  metadata: string | null;
  joinedAt: string | null;
};

export type Room = {
  name: string;
  metadata: string | null;
  createdAt: string | null;
  numParticipants: number;
  numPublishers: number | null;
  participants: RoomParticipant[];
};

export type RoomsSummary = {
  livekitUrl: string;
  totalRooms: number;
  totalParticipants: number;
  rooms: Room[];
};
