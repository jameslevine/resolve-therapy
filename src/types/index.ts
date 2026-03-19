export interface TherapistProfile {
  id: string;
  name: string;
  title: string;
  specialty: string;
  bio: string;
  background: string;
  approach: string;
  imageUrl: string;
  voiceId: string;
  voiceName: string;
  voiceTags: string[];
  personalityPrompt: string;
}

export interface TranscriptEntry {
  id: string;
  content: string;
  timestamp: Date;
  isTherapist: boolean;
}

export interface ParticipantInfo {
  names: string[];
  relationship: string;
  context: string;
}
