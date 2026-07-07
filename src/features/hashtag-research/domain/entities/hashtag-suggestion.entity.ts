export type HashtagSuggestion = {
  hashtag: string;
  type: string;
  reasoning: string;
};

export type HashtagNote = {
  id: string;
  hashtag: string;
  note: string | null;
  isProven?: boolean;
};