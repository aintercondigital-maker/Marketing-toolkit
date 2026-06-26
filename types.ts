
export interface KBEntry {
  id: string;
  source: string;
  content: string;
}

export type AppTab = 'dashboard' | 'strategy-consultant' | 'spec-translator' | 'tco-calculator' | 'pitch-script' | 'solution-burger' | 'secure-mod' | 'smart-converter' | 'icon-factory' | 'roi-calculator' | 'vector-db';

export type Language = 
  | 'English' 
  | 'Traditional Chinese' 
  | 'Simplified Chinese' 
  | 'Turkish' 
  | 'Vietnamese' 
  | 'Indonesian' 
  | 'Thai' 
  | 'Spanish' 
  | 'Portuguese'
  | 'Japanese'
  | 'Korean'
  | 'Russian';

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export enum GenerationStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}

export interface ApiError {
  message: string;
  details: string;
}

export interface OCRBlock {
  text: string;
  box_2d: number[]; // [ymin, xmin, ymax, xmax]
  font_size?: number;
  is_bold?: boolean;
  align?: string;
  color?: string;
}

export interface Slot {
  id: string;
  originalBase64: string;
  resultBase64: string | null;
  status: 'ready' | 'processing' | 'done' | 'error';
}

export type LayoutRatio = '16:9' | '9:16' | '4:3';

export interface GeneratedSvg {
  id: string;
  content: string;
  prompt: string;
  timestamp: number;
}

// Global declarations for CDN libraries
declare global {
  interface Window {
    pdfjsLib: any;
    PptxGenJS: any;
    JSZip: any;
    aistudio: any;
  }
}
