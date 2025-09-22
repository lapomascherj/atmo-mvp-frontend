import { CalendarEvent } from "@/models/CalendarEvent.ts";

const eventsMock: CalendarEvent[] = [
  {
    id: "1",
    title: "ATMO Team Standup",
    description: "Daily team sync to discuss progress and blockers",
    startDate: new Date(2024, 11, 20, 9, 0), // December 20, 2024, 9:00 AM
    startTime: new Date(2024, 11, 20, 9, 0),
    endDate: new Date(2024, 11, 20, 9, 30),
    endTime: new Date(2024, 11, 20, 9, 30),
    location: "Conference Room A",
    attendees: ["team@atmo.com"],
    isAllDay: false,
    color: "#FF5F1F",
  },
  {
    id: "2",
    title: "Product Review Meeting",
    description: "Review latest features and plan next sprint",
    startDate: new Date(2024, 11, 20, 14, 0), // December 20, 2024, 2:00 PM
    startTime: new Date(2024, 11, 20, 14, 0),
    endDate: new Date(2024, 11, 20, 15, 30),
    endTime: new Date(2024, 11, 20, 15, 30),
    location: "Virtual - Zoom",
    attendees: ["product@atmo.com", "design@atmo.com"],
    isAllDay: false,
    color: "#4169E1",
  },
  {
    id: "3",
    title: "University Thesis Defense",
    description: "Final presentation of AI-powered code optimization research",
    startDate: new Date(2024, 11, 21, 10, 0), // December 21, 2024, 10:00 AM
    startTime: new Date(2024, 11, 21, 10, 0),
    endDate: new Date(2024, 11, 21, 12, 0),
    endTime: new Date(2024, 11, 21, 12, 0),
    location: "University Campus - Room 301",
    attendees: ["advisor@university.edu"],
    isAllDay: false,
    color: "#10B981",
  },
  {
    id: "4",
    title: "Content Creation Session",
    description: "Record Instagram content about productivity tips",
    startDate: new Date(2024, 11, 22, 16, 0), // December 22, 2024, 4:00 PM
    startTime: new Date(2024, 11, 22, 16, 0),
    endDate: new Date(2024, 11, 22, 17, 0),
    endTime: new Date(2024, 11, 22, 17, 0),
    location: "Home Studio",
    attendees: [],
    isAllDay: true,
    color: "#8B5CF6",
  },
  {
    id: "5",
    title: "Client Demo - ATMO Features",
    description: "Showcase new AI features to potential enterprise client",
    startDate: new Date(2024, 11, 23, 11, 0), // December 23, 2024, 11:00 AM
    startTime: new Date(2024, 11, 23, 11, 0),
    endDate: new Date(2024, 11, 23, 12, 0),
    endTime: new Date(2024, 11, 23, 12, 0),
    location: "Virtual - Google Meet",
    attendees: ["client@company.com"],
    isAllDay: false,
    color: "#FF5F1F",
  },
];

export default eventsMock;
