export enum WellnessStatus {
    Low = "low",
    Moderate = "medium",
    Good = "high",
    Unknown = "unknown"
}

export namespace WellnessStatus {
    export function getColor(status: string) {
        switch (status) {
            case WellnessStatus.Low: return 'text-red-500';
            case WellnessStatus.Moderate: return 'text-yellow-500';
            case WellnessStatus.Good: return 'text-green-500';
            default:
                return "text-stone-700"
        }
    }
}
