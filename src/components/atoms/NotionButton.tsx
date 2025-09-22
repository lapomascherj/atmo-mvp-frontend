import React from 'react';
import { Button } from '@/components/atoms/Button.tsx';
import { FileText, Loader2, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { NotionConnectionStatus } from '@/hooks/useMockNotion';

interface NotionButtonProps {
  status: NotionConnectionStatus;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

/**
 * Atomic Notion button component with single responsibility:
 * Displays appropriate icon and text based on connection status
 */
const NotionButton: React.FC<NotionButtonProps> = ({
  status,
  onClick,
  disabled = false,
  variant = 'outline',
  size = 'sm',
  className = '',
  children
}) => {
  const getIcon = () => {
    switch (status) {
      case 'connecting':
      case 'syncing':
        return <Loader2 size={16} className="animate-spin" />;
      case 'connected':
        return <Wifi size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'disconnected':
      default:
        return <WifiOff size={16} className="text-slate-400" />;
    }
  };

  const getDefaultText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...';
      case 'syncing':
        return 'Syncing...';
      case 'connected':
        return 'Notion';
      case 'error':
        return 'Retry';
      case 'disconnected':
      default:
        return 'Connect Notion';
    }
  };

  const getVariant = () => {
    switch (status) {
      case 'error':
        return 'destructive';
      case 'connected':
        return variant;
      case 'disconnected':
        return 'default';
      default:
        return variant;
    }
  };

  const isLoading = status === 'connecting' || status === 'syncing';
  const isDisabled = disabled || isLoading;

  return (
    <Button
      variant={getVariant() as any}
      size={size}
      onClick={onClick}
      disabled={isDisabled}
      className={`gap-2 ${className}`}
    >
      {getIcon()}
      <span>{children || getDefaultText()}</span>
    </Button>
  );
};

export default NotionButton;
