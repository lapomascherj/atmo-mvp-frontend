export enum Priority {
    Low = "low",
    Medium = "medium",
    High = "high",
}

export namespace Priority {
    export function getPriorityColor(priority: string)  {
        switch (priority) {
            case Priority.High: return 'bg-red-500/20 text-red-400 border-red-500/30';
            case Priority.Medium: return 'bg-[#FF5F1F]/20 text-[#FF5F1F] border-[#FF5F1F]/30';
            case Priority.Low: return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-[#FF5F1F]/20 text-[#FF5F1F] border-[#FF5F1F]/30';
        }
    };
}
