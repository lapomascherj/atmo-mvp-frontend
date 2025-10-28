import { create } from "zustand/index";
import { Task } from "@/models/Task.ts";
import { Goal } from "@/models/Goal.ts";
import { digitalBrainAPI } from "@/api/mockDigitalBrainApi";

interface PromptInput {
  message: string;
  sender: "user" | "ai";
  highlightColor?: "green" | "yellow" | "purple"; // For Today's Actions prompts
}

interface PromptState {
  history: PromptInput[];
  input: PromptInput;
  context: string[];
  currentTask?: Task;
  currentGoal?: Goal;
  isConversationStarted: boolean;
  isResponding: boolean;
  isVoiceMessage: boolean;
  addToHistory: () => void;
  addContext: (data: never, type: string) => void;
  addMessageToPrompt: (message: string, sender?: "user" | "ai") => void;
  clearInput: () => void;
  clearPrompt: () => void;
  passTaskToPrompt: (task: Task) => void;
  setTaskContext: (task: Task | undefined) => void;
  clearTaskContext: () => void;
  passGoalToPrompt: (goal: Goal) => void;
  setGoalContext: (goal: Goal | undefined) => void;
  clearGoalContext: () => void;
  toggleConversationStarted: () => void;
  setConversationStarted: (value: boolean) => void;
  toggleRespondingState: () => void;
  toggleVoiceMessage: () => void;
  setRespondingState: (value: boolean) => void;
  processTaskWithAI: (task: Task) => Promise<void>;
  addAIResponse: (response: string) => void;
  addAvatarMessage: (message: string) => void;
  addHighlightedAIQuestion: (question: string, color: "green" | "yellow" | "purple") => void;
  resetConversationState: () => void;
  setHistory: (entries: PromptInput[]) => void;
}

// Load persisted state from localStorage
const loadPersistedState = () => {
  try {
    const persisted = localStorage.getItem('atmo_prompt_store');
    if (persisted) {
      const parsed = JSON.parse(persisted);
      return {
        history: parsed.history || new Array<PromptInput>(),
        input: parsed.input || { message: "", sender: "user" },
        isConversationStarted: parsed.isConversationStarted || false,
        isResponding: parsed.isResponding || false,
        isVoiceMessage: parsed.isVoiceMessage || false,
        currentTask: parsed.currentTask || undefined,
        currentGoal: parsed.currentGoal || undefined,
        context: parsed.context || [],
      };
    }
  } catch (error) {
    console.warn('Failed to load persisted prompt store state:', error);
  }
  return {
    history: new Array<PromptInput>(),
    input: { message: "", sender: "user" },
    isConversationStarted: false,
    isResponding: false,
    isVoiceMessage: false,
    currentTask: undefined,
    currentGoal: undefined,
    context: [],
  };
};

// Save state to localStorage
const savePersistedState = (state: Partial<PromptState>) => {
  try {
    localStorage.setItem('atmo_prompt_store', JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to save prompt store state:', error);
  }
};

export const promptStore = create<PromptState>((set, get) => ({
  ...loadPersistedState(),

  passTaskToPrompt: (task: Task) =>
    set((state) => ({
      context: [...state.context, `Task: ${task.name}`],
      currentTask: task,
      input: {
        ...state.input,
        message: task.description || "",
      },
    })),

  setTaskContext: (task: Task | undefined) =>
    set(() => ({
      currentTask: task,
    })),

  clearTaskContext: () =>
    set(() => ({
      currentTask: undefined,
    })),

  passGoalToPrompt: (goal: Goal) =>
    set((state) => ({
      context: [
        ...state.context,
        `Goal: ${goal.name} (${goal.priority} priority, due ${goal.targetDate})`,
      ],
      currentGoal: goal,
      input: {
        ...state.input,
        message: goal.description || "",
      },
    })),

  setGoalContext: (goal: Goal | undefined) =>
    set(() => ({
      currentGoal: goal,
    })),

  clearGoalContext: () =>
    set(() => ({
      currentGoal: undefined,
    })),
  addToHistory: () =>
    set((state) => ({
      history: [...state.history, { ...state.input }], // Preserve the current sender
      input: {
        message: "",
        sender: "user", // Reset to user for next input
      },
    })),
  addContext: (data: never, type: string) =>
    set((state) => ({
      context: [
        ...state.context,
        JSON.stringify({
          type: type,
          data: data,
        }),
      ],
    })),
  addMessageToPrompt: (message: string, sender: "user" | "ai" = "user") =>
    set((state) => ({
      input: {
        message,
        sender,
      },
    })),
  clearPrompt: () =>
    set((_state) => ({
      history: new Array<PromptInput>(),
      input: {
        message: "",
        sender: "user",
      },
      currentTask: undefined,
      currentGoal: undefined,
      context: [],
    })),
  setHistory: (entries: PromptInput[]) =>
    set(() => ({
      history: entries,
    })),
  clearInput: () =>
    set((_state) => ({
      input: {
        message: "",
        sender: "user",
      },
    })),
  toggleConversationStarted: () =>
    set((state) => ({
      isConversationStarted: !state.isConversationStarted,
    })),
  setConversationStarted: (value: boolean) =>
    set(() => ({
      isConversationStarted: value,
    })),
  toggleRespondingState: () =>
    set((state) => ({
      isResponding: !state.isResponding,
    })),
  setRespondingState: (value: boolean) =>
    set(() => ({
      isResponding: value,
    })),
  toggleVoiceMessage: () =>
    set((state) => ({
      isVoiceMessage: !state.isVoiceMessage,
    })),

  processTaskWithAI: async (task: Task) => {
    const {
      addMessageToPrompt,
      addToHistory,
      toggleConversationStarted,
      toggleRespondingState,
      isConversationStarted,
    } = promptStore.getState();

    // Pass task to prompt system
    promptStore.getState().passTaskToPrompt(task);

    // Prepare the message for AI processing
    const taskMessage = `Help me with this task: "${task.name}"`;
    addMessageToPrompt(taskMessage);

    // Start conversation if not started
    if (!isConversationStarted) {
      toggleConversationStarted();
    }

    // Add message to history and start AI response
    addToHistory();
    toggleRespondingState();

    // Call DigitalBrain API for AI processing
    try {
      const helpResponse = await digitalBrainAPI.getHelp({
        message: taskMessage,
        context: promptStore.getState().context,
        taskId: task?.id,
      });

      // Check if response is valid and not empty
      const responseText = helpResponse?.data?.response?.trim();
      if (!responseText) {
        throw new Error("Empty or invalid response from DigitalBrain service");
      }

      promptStore.getState().addAIResponse(responseText);
    } catch (error) {
      console.error("Failed to get AI help:", error);

      // Enhanced fallback response for task-specific context
      const fallbackResponse = `I'm having trouble connecting to the AI service right now, but I can still help you with "${
        task.name
      }". 

Here's a structured approach to get you started:

🎯 **Task Breakdown:**
• Review what exactly needs to be done
• Identify any prerequisites or dependencies
• Estimate the time needed (currently set to ${task.estimated_time || "30min"})

📋 **Action Steps:**
• Set up your workspace and gather necessary resources
• Break the task into smaller, manageable chunks
• Start with the most critical or challenging part
• Set mini-deadlines to stay on track

💡 **Pro Tips:**
• Remove distractions during your focused work time
• Take short breaks if the task is lengthy
• Document your progress for future reference

Would you like me to help you think through any specific aspect of this task? I'm here to support you even while the AI service reconnects!`;

      promptStore.getState().addAIResponse(fallbackResponse);
    }
  },

  addAIResponse: (response: string) => {
    // Ensure we never add empty responses
    const responseText = response?.trim();
    if (!responseText) {
      console.warn("Attempted to add empty AI response, using fallback");
      response =
        "I'm here to help, but I didn't receive a proper response from the AI service. Could you please try asking your question again?";
    }

    set((state) => ({
      input: {
        message: response,
        sender: "ai" as const,
      },
    }));

    // Add to history and stop responding
    const { addToHistory, toggleRespondingState } = promptStore.getState();
    addToHistory();
    toggleRespondingState();
  },

  addHighlightedAIQuestion: (question: string, color: "green" | "yellow" | "purple") => {
    set((state) => ({
      history: [
        ...state.history,
        {
          message: question,
          sender: "ai" as const,
          highlightColor: color,
        },
      ],
    }));
  },

  addAvatarMessage: (message: string) => {
    // Add avatar-initiated message directly to history (not input)
    const avatarMessage = message?.trim();
    if (!avatarMessage) {
      console.warn("Attempted to add empty avatar message");
      return;
    }

    set((state) => ({
      history: [
        ...state.history,
        {
          message: avatarMessage,
          sender: "ai" as const,
        },
      ],
      // Keep input empty for user response
      input: {
        message: "",
        sender: "user",
      },
    }));
  },

  resetConversationState: () => {
    // Don't reset conversation state unless explicitly needed
    // This prevents accidental state loss
    console.log('⚠️ Conversation state reset requested - this should be used sparingly');
    const newState = {
      history: new Array<PromptInput>(),
      input: {
        message: "",
        sender: "user",
      },
      isConversationStarted: false,
      isResponding: false,
      isVoiceMessage: false,
      currentTask: undefined,
      currentGoal: undefined,
      context: [],
    };
    set(() => newState);
    // Save to localStorage
    savePersistedState(newState);
  },
}));
