import React from "react";
import {ServiceStatus} from "@/models/ServiceStatus.ts";
import {z} from "zod";

export interface ExternalService {
    id: string;
    name: string;
    icon: React.ReactNode;
    description?: string;
    benefit?: string;
    status?: ServiceStatus;
    isProcessing?: boolean;
    connected?: boolean;
}

export const ExternalServiceSchema = z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string(),
    description: z.string().optional(),
    benefit: z.string().optional(),
    status: z.enum([
        ServiceStatus.Connected,
        ServiceStatus.NotConnected,
        ServiceStatus.Pending
    ]).optional(),
    isProcessing: z.boolean().optional(),
    connected: z.boolean().optional(),
})
