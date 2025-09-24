
export enum Page {
  Timer = 'Timer',
  Polling = 'Polling',
  QnA = 'Q&A',
  WordCloud = 'Word Cloud',
  Quiz = 'Quiz',
}

export enum Language {
  EN = 'en',
  ZH = 'zh',
}

export enum UserRole {
  Host = 'host',
  Participant = 'participant',
}

export interface AgendaItem {
  id: number;
  title: string;
  duration: number; // in seconds
}

export enum PollType {
  MultipleChoice = 'Multiple Choice',
  OpenText = 'Open Text',
}

export interface PollOption {
  text: string;
  votes: number;
}

export interface Poll {
  question: string;
  type: PollType;
  options: PollOption[];
  openTextAnswers: string[];
}

export interface QnAQuestion {
  id: number;
  text: string;
  author: string;
  upvotes: number;
  answered?: boolean;
}

export interface WordCloudEntry {
  text: string;
  count: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  timeLimit: number; // in seconds
}

export interface Player {
  id:string;
  name: string;
  score: number;
}

export interface QuizState {
  gameState: 'lobby' | 'question' | 'result' | 'leaderboard';
  players: Player[];
  currentQuestionIndex: number;
  lastAnswerCorrect?: boolean | null;
}

export interface Session {
  roomCode: string;
  
  // Timer state
  agenda: AgendaItem[];
  currentItemIndex: number;
  isTimerActive: boolean;

  // Polling state
  activePoll: Poll | null;
  pollView: 'vote' | 'results'; 

  // Q&A state
  qnaQuestions: QnAQuestion[];
  
  // Word Cloud state
  wordCloudWords: string[];

  // Quiz state
  quizState: QuizState;
}
