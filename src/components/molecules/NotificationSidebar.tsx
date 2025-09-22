import React, { useState } from 'react';
import { Bell, Mail, FileText, Calendar, AlertCircle, Info, ExternalLink } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/atoms/Sheet.tsx";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/atoms/Drawer.tsx";

interface NotificationItemProps {
  icon: React.ElementType;
  title: string;
  time: string;
  source: string;
  sourceColor?: string;
  isActionable?: boolean;
  details?: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  icon: Icon,
  title,
  time,
  source,
  sourceColor = "text-atmo-orange",
  isActionable = false,
  details = "No additional details available."
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-lg mb-3">
      <div className="flex items-start gap-3 p-3 rounded-lg bg-black/60 backdrop-blur-lg border border-white/10 hover:bg-black/70 transition-colors shadow-md">
        <div className="p-2 rounded-lg bg-black/40 animate-subtle-glow">
          <Icon className="w-5 h-5 text-atmo-orange" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white line-clamp-2">{title}</p>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-400">{time}</span>
            <span className={`text-xs ${sourceColor}`}>{source}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 mt-1 shrink-0">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1.5 rounded-full bg-atmo-orange/20 hover:bg-atmo-orange/30 text-atmo-orange transition-colors"
            title="View details"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {isActionable && (
            <button
              className="p-1.5 rounded-full bg-atmo-orange/20 hover:bg-atmo-orange/30 text-atmo-orange transition-colors"
              title="Execute action"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Details panel that slides in - Fixed positioning */}
      {showDetails && (
        <div
          className="absolute inset-0 z-10 animate-in slide-in-from-right duration-200 rounded-lg overflow-hidden"
        >
          <div className="h-full w-full bg-black/80 backdrop-blur-md border border-white/10 p-3 text-xs text-white/90">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-atmo-orange">Details</h4>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(100%-24px)]">
              <p>{details}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationSection: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => {
  return (
    <div className="mb-6">
      <h3 className="text-xs font-medium text-gray-500 mb-3">{title}</h3>
      {children}
    </div>
  );
};

const NotificationSidebar: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-white/10 transition-colors group">
          <Bell className="h-5 w-5 text-atmo-orange group-hover:animate-subtle-glow" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-atmo-orange rounded-full animate-pulse-soft"></span>
        </button>
      </SheetTrigger>
      <SheetContent className="w-80 sm:w-96 border-l border-white/10 glass-card bg-black/40 backdrop-blur-xl">
        <div className="h-full flex flex-col">
          <div className="flex justify-between items-center py-4">
            <h2 className="text-lg font-semibold text-atmo-orange">
              Notifications
              <span className="text-xs py-0.5 px-2 bg-atmo-orange text-black rounded-full ml-2">3</span>
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <NotificationSection title="TODAY">
              <NotificationItem
                icon={Mail}
                title="New email from Design Team"
                time="5 minutes ago"
                source="Gmail"
                isActionable={true}
                details="The design team has sent you the latest mockups for the product landing page. They're requesting your feedback before tomorrow's meeting. Please review and provide feedback on color scheme, layout structure, and typography choices."
              />
              <NotificationItem
                icon={FileText}
                title="Document shared with you"
                time="1 hour ago"
                source="Notion"
                isActionable={true}
                details="Marketing strategy document has been shared with you. The team needs your input on the Q2 campaign goals and the proposed budget allocation for digital advertising and content creation."
              />
            </NotificationSection>

            <NotificationSection title="EARLIER">
              <NotificationItem
                icon={Calendar}
                title="Meeting with Product Team"
                time="Yesterday, 2:00 PM"
                source="Calendar"
                sourceColor="text-blue-400"
                isActionable={true}
                details="Product planning session for the next release cycle. Please prepare your team's feature prioritization list and estimated development timeline for each feature."
              />
            </NotificationSection>

            <NotificationSection title="AI INSIGHTS">
              <NotificationItem
                icon={AlertCircle}
                title="Your productivity peaks between 9-11 AM. Would you like to schedule focused work during this time?"
                time=""
                source=""
                details="Based on your work patterns over the last two weeks, we've noticed that your most productive hours are between 9-11 AM. Consider blocking this time for deep work and scheduling important tasks during this period to maximize your efficiency and output quality."
              />
            </NotificationSection>

            <NotificationSection title="SYSTEM">
              <NotificationItem
                icon={AlertCircle}
                title="System maintenance scheduled for tonight at 2 AM UTC"
                time=""
                source=""
                details="Our team will be performing routine maintenance tonight. The system may be unavailable for approximately 30 minutes. We recommend saving your work before this time to avoid any potential data loss. Normal operation will resume after the maintenance window."
              />
            </NotificationSection>
          </div>

          <div className="py-3 border-t border-white/10 flex justify-between items-center">
            <span className="text-xs text-gray-400">All notifications synced</span>
            <span className="text-xs text-gray-400">3 min ago</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationSidebar;
