import { create } from "zustand";

interface DailySnapshot {
  date: string;
  questionsAnswered: boolean[];
  mood: number | null; // 1-5 scale
  highlight: string | null;
  interactions: {
    questionId: string;
    timestamp: Date;
    chatEngaged: boolean;
  }[];
}

interface DailySnapshotState {
  currentSnapshot: DailySnapshot;
  isInitialized: boolean;

  // Actions
  initializeToday: () => void;
  markQuestionAnswered: (questionIndex: number) => void;
  setMood: (mood: number) => void;
  setHighlight: (highlight: string) => void;
  recordQuestionInteraction: (questionId: string, chatEngaged: boolean) => void;
  generateSmartHighlight: () => string;
  getTodaysSnapshot: () => DailySnapshot;

  // Getters
  getQuestionsAnswered: () => boolean[];
  getCurrentMood: () => { mood: number | null };
  getHighlight: () => string;
  getCompletionPercentage: () => number;
}

// Mood options - Professional scale design
export const MOOD_OPTIONS = [
  { value: 1, label: "Very Low", color: "from-red-500 to-red-400", textColor: "text-red-400" },
  { value: 2, label: "Low", color: "from-orange-500 to-orange-400", textColor: "text-orange-400" },
  { value: 3, label: "Neutral", color: "from-yellow-500 to-yellow-400", textColor: "text-yellow-400" },
  { value: 4, label: "Good", color: "from-green-500 to-green-400", textColor: "text-green-400" },
  { value: 5, label: "Excellent", color: "from-blue-500 to-blue-400", textColor: "text-blue-400" }
];

// Helper functions
const getTodayKey = () => new Date().toDateString();

const getEmptySnapshot = (): DailySnapshot => ({
  date: getTodayKey(),
  questionsAnswered: [false, false, false],
  mood: null,
  highlight: null,
  interactions: []
});

const loadSnapshotFromStorage = (date: string): DailySnapshot => {
  try {
    const stored = localStorage.getItem(`dailySnapshot_${date}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Ensure interactions have proper Date objects
      if (parsed.interactions) {
        parsed.interactions = parsed.interactions.map((interaction: any) => ({
          ...interaction,
          timestamp: new Date(interaction.timestamp)
        }));
      }
      return parsed;
    }
  } catch (error) {
    console.error('Failed to load daily snapshot from storage:', error);
  }
  return getEmptySnapshot();
};

const saveSnapshotToStorage = (snapshot: DailySnapshot) => {
  try {
    localStorage.setItem(`dailySnapshot_${snapshot.date}`, JSON.stringify(snapshot));
  } catch (error) {
    console.error('Failed to save daily snapshot to storage:', error);
  }
};

const generateSmartHighlightFromData = (): string => {
  const today = getTodayKey();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  // Try to get data from various sources
  const journalEntries = [];
  const completedTasks = [];

  // Scan localStorage for yesterday's data
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;

    // Check for journal entries
    if (key.startsWith('journal_') && key.includes(yesterday)) {
      const entry = localStorage.getItem(key);
      if (entry && entry.trim()) {
        journalEntries.push(entry);
      }
    }

    // Check for completed tasks or other activities
    if (key.includes('completed') || key.includes('task')) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          completedTasks.push(data);
        }
      } catch (e) {
        // Skip invalid entries
      }
    }
  }

  // Generate highlight based on available data
  if (journalEntries.length > 0) {
    const wordCount = journalEntries.join(' ').split(' ').length;
    return `Yesterday you reflected deeply with ${wordCount} words in your journal. Let's build on those insights today.`;
  }

  if (completedTasks.length > 0) {
    return `You accomplished ${completedTasks.length} task${completedTasks.length > 1 ? 's' : ''} yesterday. What will you tackle today?`;
  }

  // Check for previous meditation or center activities
  const centerActivities = localStorage.getItem('lastMantraDate');
  if (centerActivities && centerActivities === yesterday) {
    return `You centered yourself yesterday with mindful practices. How can you maintain that peace today?`;
  }

  // Fallback highlights based on day of week
  const dayOfWeek = new Date().getDay();
  const dayHighlights = [
    "Sunday vibes: What intentions will guide your week ahead?", // Sunday
    "Monday momentum: Fresh start, fresh possibilities.", // Monday
    "Tuesday focus: Midweek clarity is building.", // Tuesday
    "Wednesday wisdom: You're halfway through - keep going.", // Wednesday
    "Thursday thoughts: The weekend is in sight, stay strong.", // Thursday
    "Friday energy: What will you accomplish before the weekend?", // Friday
    "Saturday serenity: Time to reflect and recharge." // Saturday
  ];

  return dayHighlights[dayOfWeek];
};

export const useDailySnapshotStore = create<DailySnapshotState>((set, get) => ({
  currentSnapshot: getEmptySnapshot(),
  isInitialized: false,

  initializeToday: () => {
    const today = getTodayKey();
    const snapshot = loadSnapshotFromStorage(today);

    // Ensure the snapshot is for today
    if (snapshot.date !== today) {
      snapshot.date = today;
      snapshot.questionsAnswered = [false, false, false];
      // Keep mood and highlight as they might be manually set
    }

    set({ currentSnapshot: snapshot, isInitialized: true });
    saveSnapshotToStorage(snapshot);
  },

  markQuestionAnswered: (questionIndex: number) => {
    const { currentSnapshot } = get();
    if (questionIndex < 0 || questionIndex >= 3) return;

    const updatedSnapshot = {
      ...currentSnapshot,
      questionsAnswered: currentSnapshot.questionsAnswered.map((answered, index) =>
        index === questionIndex ? true : answered
      )
    };

    set({ currentSnapshot: updatedSnapshot });
    saveSnapshotToStorage(updatedSnapshot);
  },

  setMood: (mood: number) => {
    const { currentSnapshot } = get();
    const updatedSnapshot = {
      ...currentSnapshot,
      mood
    };

    set({ currentSnapshot: updatedSnapshot });
    saveSnapshotToStorage(updatedSnapshot);
  },

  setHighlight: (highlight: string) => {
    const { currentSnapshot } = get();
    const updatedSnapshot = {
      ...currentSnapshot,
      highlight
    };

    set({ currentSnapshot: updatedSnapshot });
    saveSnapshotToStorage(updatedSnapshot);
  },

  recordQuestionInteraction: (questionId: string, chatEngaged: boolean) => {
    const { currentSnapshot } = get();
    const interaction = {
      questionId,
      timestamp: new Date(),
      chatEngaged
    };

    const updatedSnapshot = {
      ...currentSnapshot,
      interactions: [...currentSnapshot.interactions, interaction]
    };

    set({ currentSnapshot: updatedSnapshot });
    saveSnapshotToStorage(updatedSnapshot);
  },

  generateSmartHighlight: () => {
    const highlight = generateSmartHighlightFromData();
    get().setHighlight(highlight);
    return highlight;
  },

  getTodaysSnapshot: () => {
    return get().currentSnapshot;
  },

  getQuestionsAnswered: () => {
    return get().currentSnapshot.questionsAnswered;
  },

  getCurrentMood: () => {
    const { mood } = get().currentSnapshot;
    return { mood };
  },

  getHighlight: () => {
    const { currentSnapshot } = get();
    return currentSnapshot.highlight || generateSmartHighlightFromData();
  },

  getCompletionPercentage: () => {
    const { currentSnapshot } = get();
    const answered = currentSnapshot.questionsAnswered.filter(Boolean).length;
    const hasMood = currentSnapshot.mood !== null;
    const total = 4; // 3 questions + mood
    const completed = answered + (hasMood ? 1 : 0);
    return Math.round((completed / total) * 100);
  }
}));