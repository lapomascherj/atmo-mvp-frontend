import {Priority, Project} from "@/models";
import {Status} from "@/models/Status.ts";
import {KnowledgeType} from "@/models/KnowledgeType.ts";

const projectsMock: Project[] = [
    {
        id: 'atmo',
        name: 'ATMO',
        description: 'AI-powered productivity companion that helps users plan with intention and focus through intelligent task management and wellness integration.',
        phase: 'Development & Testing',
        progress: 68,
        priority: 'high',
        startDate: 1719705600,
        targetDate: 1705276800,
        timeInvested: 7440,
        lastUpdate: 1762387200,
        color: 'bg-blue-500',
        status: 'Content Creation & Growth',
        active: true,
        tags: ['AI', 'Productivity', 'SaaS', 'React'],
        notes: 'Focus on user experience and AI accuracy. Need to improve task prioritization algorithm and add more wellness features.',
        goals: [
            {
                id: 'g1',
                name: 'Complete user authentication system',
                description: 'Implement secure login, signup, password recovery, and user profile management',
                status: Status.Completed,
                priority: Priority.High,
                targetDate: '2024-01-30',
                completedDate: '2024-01-28'
            },
            {
                id: 'g2',
                name: 'Develop AI task prioritization',
                description: 'Create intelligent algorithms that analyze user behavior and suggest optimal task ordering',
                status: Status.InProgress,
                priority: Priority.High,
                targetDate: '2024-03-15'
            },
            {
                id: 'g3',
                name: 'Build analytics dashboard',
                description: 'Design comprehensive productivity metrics and insights visualization',
                status: Status.InProgress,
                priority: Priority.Medium,
                targetDate: '2024-04-01'
            },
            {
                id: 'g4',
                name: 'Implement team collaboration',
                description: 'Add features for team projectID management and shared workspaces',
                status: Status.Planned,
                priority: Priority.Medium,
                targetDate: '2024-05-15'
            }
        ],
        items: [
            {
                id: '1',
                name: 'Project Research Summary',
                type: KnowledgeType.File,
                projectID: 'ATMO',
                date: '2024-01-15',
                size: '2.4 MB',
                tags: ['research', 'competitive-analysis'],
                source: 'Google Drive',
                starred: true
            },
            {
                id: '2',
                name: 'Morning Planning Session',
                type: KnowledgeType.Voice,
                projectID: 'ATMO',
                date: '2024-01-15',
                duration: '12:34',
                tags: ['planning', 'roadmap'],
                source: 'Avatar Assistant'
            },
            {
                id: '3',
                name: 'Feature Discussion',
                type: KnowledgeType.Chat,
                projectID: 'ATMO',
                date: '2024-01-14',
                tags: ['features', 'ui-ux'],
                source: 'Avatar Assistant'
            },
            {
                id: '4',
                name: 'Market Analysis Report',
                type: KnowledgeType.Integration,
                projectID: 'ATMO',
                date: '2024-01-13',
                size: '1.8 MB',
                tags: ['market', 'analysis'],
                source: 'Notion'
            }
        ],
    },
    {
        id: 'instagram',
        name: 'INSTAGRAM',
        description: 'Build personal brand and grow social media presence to establish thought leadership in productivity and AI space.',
        phase: 'Content Creation & Growth',
        progress: 42,
        priority: 'medium',
        startDate: 1704067200,
        targetDate: 1735603200,
        tags: ['Social Media', 'Personal Brand', 'Content'],
        notes: 'Focus on educational content about productivity and AI. Engagement rate is improving but need more consistent posting.',
        status: 'Development & Testing',
        timeInvested: 162000,
        lastUpdate: 1762387200,
        items: [],
        active: true,
        goals: [
            {
                id: 'g8',
                name: 'Reach 10K followers',
                description: 'Grow Instagram following to 10,000 engaged followers',
                status: Status.InProgress,
                priority: Priority.Medium,
                targetDate: '2024-08-01'
            },
            {
                id: 'g9',
                name: 'Achieve 5% engagement rate',
                description: 'Maintain consistent engagement rate above 5%',
                status: Status.InProgress,
                priority: Priority.Medium,
                targetDate: '2024-06-01'
            },
            {
                id: 'g10',
                name: 'Launch productivity course',
                description: 'Create and launch online course about AI-powered productivity',
                status: Status.Planned,
                priority: Priority.Low,
                targetDate: '2024-10-01'
            }
        ]
    },
    {
        id: 'university',
        name: 'University',
        description: 'Computer Science degree completion with focus on AI/ML specialization and maintaining high academic performance.',
        phase: 'Final Semester',
        progress: 85,
        priority: 'high',
        startDate: 1630454400,
        targetDate: 1715731200,
        timeInvested: 144000,
        lastUpdate: 1762387200,
        tags: ['Education', 'Computer Science', 'AI/ML'],
        notes: 'Thesis defense scheduled for April. Need to focus on final projects and maintain GPA above 3.8.',
        color: 'bg-purple-500',
        status: 'Final Semester',
        active: true,
        goals: [
            {
                id: 'g5',
                name: 'Complete thesis projectID',
                description: 'Research and develop AI-powered code optimization system',
                status: Status.InProgress,
                priority: Priority.High,
                targetDate: '2024-04-01'
            },
            {
                id: 'g6',
                name: 'Maintain GPA above 3.8',
                description: 'Achieve excellent grades in all remaining courses',
                status: Status.InProgress,
                priority: Priority.High,
                targetDate: '2024-05-15'
            },
            {
                id: 'g7',
                name: 'Secure internship/job offer',
                description: 'Land a position at a top tech company for post-graduation',
                status: Status.Completed,
                priority: Priority.High,
                targetDate: '2024-03-01',
                completedDate: '2024-02-15'
            }
        ],
        items: [
            {
                id: '5',
                name: 'Economics 101 Notes',
                type: KnowledgeType.File,
                projectID: 'University',
                date: '2024-01-14',
                size: '1.2 MB',
                tags: ['economics', 'lecture-notes'],
                source: 'OneDrive'
            },
            {
                id: '6',
                name: 'Study Session Recording',
                type: KnowledgeType.Voice,
                projectID: 'University',
                date: '2024-01-13',
                duration: '45:12',
                tags: ['study', 'review'],
                source: 'Avatar Assistant'
            },
            {
                id: '7',
                name: 'Assignment Summary',
                type: KnowledgeType.Summary,
                projectID: 'University',
                date: '2024-01-12',
                tags: ['assignment', 'summary'],
                source: 'Avatar Assistant',
                starred: true
            }
        ],
        tasks: []
    },
    {
        id: 'personal',
        name: 'Personal',
        color: 'bg-green-500',
        description: 'Build personal brand and grow social media presence to establish thought leadership in productivity and AI space.',
        priority: 'medium',
        items: [
            {
                id: '8',
                name: 'Daily Reflection',
                type: KnowledgeType.Voice,
                projectID: 'Personal',
                date: '2024-01-15',
                duration: '8:45',
                tags: ['reflection', 'wellness'],
                source: 'Avatar Assistant'
            },
            {
                id: '9',
                name: 'Goal Setting Chat',
                type: KnowledgeType.Chat,
                projectID: 'Personal',
                date: '2024-01-12',
                tags: ['goals', 'planning'],
                source: 'Avatar Assistant'
            }
        ],
        tasks: []
    }
];

export default projectsMock;
