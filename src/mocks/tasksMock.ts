import {Task} from "@/models/Task.ts";
import {Priority} from "@/models/Priority.ts";

const tasksMock: Task[] = [
    {
        id: '1',
        time: "07:30",
        name: "Morning Routine",
        description: "Start your day with intention",
        projectID: "atmo",
        color: "orange",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '2',
        time: "09:00",
        name: "Project Review",
        description: "Review ongoing projects and priorities",
        projectID: "personal",
        color: "blue",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '3',
        time: "11:30",
        name: "Team Meeting",
        description: "Weekly sync with the team",
        projectID: "atmo",
        color: "purple",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '4',
        time: "13:00",
        name: "Lunch Break",
        description: "Take time to recharge",
        projectID: "atmo",
        color: "green",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '5',
        time: "14:30",
        name: "Focus Block",
        description: "Deep work session",
        projectID: "atmo",
        color: "rose",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '6',
        time: "16:00",
        name: "Client Meeting",
        description: "Product demo and feedback",
        projectID: "atmo",
        color: "blue",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '7',
        time: "17:30",
        name: "Exercise",
        description: "30-minute workout session",
        projectID: "personal",
        color: "green",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '8',
        time: "19:00",
        name: "Review & Planning",
        description: "Wrap up and plan for tomorrow",
        projectID: "personal",
        color: "yellow",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    },
    {
        id: '9',
        time: "20:00",
        name: "Evening Wind Down",
        description: "Personal time and relaxation",
        projectID: "personal",
        color: "purple",
        completed: false,
        priority: Priority.Medium,
        isHuman: true
    }
];

export default tasksMock;
