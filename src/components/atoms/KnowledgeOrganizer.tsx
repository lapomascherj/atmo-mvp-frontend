import React, {useState} from 'react';
import {FileText, MessageSquare, Mic} from 'lucide-react';

interface KnowledgeItem {
    id: string;
    name: string;
    type: 'file' | 'voice' | 'chat';
    project: string;
    date: string;
    size?: string;
    duration?: string;
    tags?: string[];
}

interface Project {
    id: string;
    name: string;
    color: string;
    items: KnowledgeItem[];
}

const SAMPLE_PROJECTS: Project[] = [
    {
        id: 'atmo',
        name: 'ATMO',
        color: 'bg-blue-500',
        items: [
            {
                id: '1',
                name: 'Project Research Summary',
                type: 'file',
                project: 'ATMO',
                date: '2024-01-15',
                size: '2.4 MB',
                tags: ['research', 'competitive-analysis']
            },
            {
                id: '2',
                name: 'Morning Planning Session',
                type: 'voice',
                project: 'ATMO',
                date: '2024-01-15',
                duration: '12:34',
                tags: ['planning', 'roadmap']
            },
            {
                id: '3',
                name: 'Feature Discussion',
                type: 'chat',
                project: 'ATMO',
                date: '2024-01-14',
                tags: ['features', 'ui-ux']
            }
        ]
    },
    {
        id: 'uni',
        name: 'University',
        color: 'bg-purple-500',
        items: [
            {
                id: '4',
                name: 'Economics 101 Notes',
                type: 'file',
                project: 'University',
                date: '2024-01-14',
                size: '1.2 MB',
                tags: ['economics', 'lecture-notes']
            },
            {
                id: '5',
                name: 'Study Session Recording',
                type: 'voice',
                project: 'University',
                date: '2024-01-13',
                duration: '45:12',
                tags: ['study', 'review']
            }
        ]
    },
    {
        id: 'personal',
        name: 'Personal',
        color: 'bg-green-500',
        items: [
            {
                id: '6',
                name: 'Daily Reflection',
                type: 'voice',
                project: 'Personal',
                date: '2024-01-15',
                duration: '8:45',
                tags: ['reflection', 'wellness']
            },
            {
                id: '7',
                name: 'Goal Setting Chat',
                type: 'chat',
                project: 'Personal',
                date: '2024-01-12',
                tags: ['goals', 'planning']
            }
        ]
    }
];

const KnowledgeOrganizer: React.FC = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['atmo']));
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'file' | 'voice' | 'chat'>('all');

    const toggleProject = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'voice':
                return <Mic className="w-4 h-4"/>;
            case 'chat':
                return <MessageSquare className="w-4 h-4"/>;
            default:
                return <FileText className="w-4 h-4"/>;
        }
    };

    const getItemTypeColor = (type: string) => {
        switch (type) {
            case 'voice':
                return 'text-blue-400';
            case 'chat':
                return 'text-green-400';
            default:
                return 'text-gray-400';
        }
    };

    const filteredProjects = SAMPLE_PROJECTS.map(project => ({
        ...project,
        items: project.items.filter(item => {
            const matchesSearch = searchQuery === '' ||
                item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesFilter = selectedFilter === 'all' || item.type === selectedFilter;
            return matchesSearch && matchesFilter;
        })
    })).filter(project => project.items.length > 0);

    // Component is now hidden - return null to not render anything
    // TODO: Re-enable this component when ready
    return null;
};

export default KnowledgeOrganizer;
