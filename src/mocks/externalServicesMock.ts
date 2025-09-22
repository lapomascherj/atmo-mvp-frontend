import {ExternalService} from "@/models/ExternalService.ts";

const externalServicesMock: ExternalService[] = [
    {
        id: 'openai',
        name: 'OpenAI',
        icon: "Database",
        description: 'Connect your OpenAI account to enhance ATMO with powerful AI capabilities.',
        connected: false
    },
    {
        id: 'gmail',
        name: 'Gmail',
        icon: "Mail",
        description: 'Connect your Gmail account to receive and analyze emails directly within ATMO.',
        connected: true
    },
    {
        id: 'meet',
        name: 'Meet',
        icon: "Video",
        description: 'Connect Google Meet to schedule and join meetings without leaving ATMO.',
        connected: false
    },
    {
        id: 'calendar',
        name: 'Calendar',
        icon: "Calendar",
        description: 'Connect your calendar to manage appointments and schedule events.',
        connected: true
    },
    {
        id: 'slack',
        name: 'Slack',
        icon: "Slack",
        description: 'Connect Slack to manage all your workspace communications within ATMO.',
        connected: false
    },
    {
        id: 'notion',
        name: 'Notion',
        icon: "FileText",
        description: 'Connect Notion to access your documents and knowledge base seamlessly.',
        connected: false
    }
]

export default externalServicesMock;
