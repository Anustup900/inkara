export interface HistoryItem {
  id: string;
  personImage: string;
  tattooImage: string;
  resultImage: string;
  timestamp: number;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface UploadedImage {
  file: File | null;
  preview: string | null;
  base64: string | null;
}