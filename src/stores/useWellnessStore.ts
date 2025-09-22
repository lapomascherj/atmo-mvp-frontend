import {WellnessLevel, WellnessTask, Project} from "@/models";
import {create} from "zustand/index";
import {WellnessStatus} from "@/models/WellnessStatus.ts";
import {calculateWellness, WellnessMetrics} from "@/utils/wellnessCalculator.ts";

interface WellnessStoreState {
    score: number;
    level: WellnessLevel;
    tasks: WellnessTask[];
    metrics: WellnessMetrics | null;
    lastCalculated: string | null;
    addWellnessTask: (task: WellnessTask) => void;
    addWellnessTasks: (tasks: WellnessTask[]) => void;
    calculateWellnessFromProjects: (projects: Project[]) => void;
    setWellnessLevel: () => void;
    updateWellnessResults: () => void;
}

export const useWellnessStore = create<WellnessStoreState>((set, get) => ({
    score: 0,
    level: {
        color: WellnessStatus.getColor(WellnessStatus.Unknown),
        status: WellnessStatus.Unknown,
    },
    tasks: new Array<WellnessTask>,
    metrics: null,
    lastCalculated: null,

    addWellnessTask: (task: WellnessTask) => set((state) => {
        const newState = {
            ...state,
            tasks: [...state.tasks, task],
        };
        return newState;
    }),

    addWellnessTasks: (tasks: WellnessTask[]) => set((state) => ({
        ...state,
        tasks: [...state.tasks, ...tasks],
    })),

    calculateWellnessFromProjects: (projects: Project[]) => set((state) => {
        const metrics = calculateWellness(projects, [], state.tasks);

        let level: WellnessLevel;
        const score = metrics.score;

        // Map score to wellness status
        if (score >= 80) {
            level = {
                color: WellnessStatus.getColor(WellnessStatus.Good),
                status: WellnessStatus.Good,
            };
        } else if (score >= 60) {
            level = {
                color: WellnessStatus.getColor(WellnessStatus.Moderate),
                status: WellnessStatus.Moderate,
            };
        } else if (score >= 40) {
            level = {
                color: WellnessStatus.getColor(WellnessStatus.Low),
                status: WellnessStatus.Low,
            };
        } else {
            level = {
                color: WellnessStatus.getColor(WellnessStatus.Unknown),
                status: WellnessStatus.Unknown,
            };
        }

        return {
            ...state,
            score,
            level,
            metrics,
            lastCalculated: new Date().toISOString()
        };
    }),

    setWellnessLevel: () => set((state) => {
        // Legacy method - kept for compatibility
        return state;
    }),

    updateWellnessResults: () => set((state) => {
        // Legacy method - kept for compatibility
        return state;
    })
}))
