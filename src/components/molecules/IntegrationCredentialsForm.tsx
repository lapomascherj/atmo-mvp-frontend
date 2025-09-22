import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button.tsx';
import { Input } from '@/components/atoms/Input.tsx';
import { Label } from '@/components/atoms/Label.tsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/atoms/Card.tsx';
import { Alert, AlertDescription } from '@/components/atoms/Alert.tsx';
import { Eye, EyeOff, Save, ExternalLink, AlertCircle, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'email';
  placeholder?: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
}

export interface IntegrationConfig {
  name: string;
  description: string;
  fields: CredentialField[];
  setupUrl?: string;
  setupLabel?: string;
  iconComponent?: React.ReactNode;
}

interface IntegrationCredentialsFormProps {
  integration: IntegrationConfig;
  onSave?: (credentials: Record<string, string>) => void;
  onCancel?: () => void;
  existingCredentials?: Record<string, string> | null;
}

/**
 * Generic form component for managing integration credentials
 * Supports any integration type with configurable fields
 */
const IntegrationCredentialsForm: React.FC<IntegrationCredentialsFormProps> = ({
  integration,
  onSave,
  onCancel,
  existingCredentials
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());

  const [credentials, setCredentials] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    integration.fields.forEach(field => {
      initial[field.key] = existingCredentials?.[field.key] || field.defaultValue || '';
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateCredentials = (): boolean => {
    const newErrors: Record<string, string> = {};

    integration.fields.forEach(field => {
      const value = credentials[field.key]?.trim();

      if (field.required && !value) {
        newErrors[field.key] = `${field.label} is required`;
        return;
      }

      if (value && field.type === 'url') {
        try {
          new URL(value);
        } catch {
          newErrors[field.key] = 'Please enter a valid URL';
        }
      }

      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.key] = 'Please enter a valid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateCredentials()) return;

    setIsLoading(true);
    try {
      // Credentials storage is now handled by the parent component through onSave callback
      onSave?.(credentials);
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save credentials. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setCredentials(prev => ({ ...prev, [fieldKey]: value }));
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({ ...prev, [fieldKey]: '' }));
    }
  };

  const togglePasswordVisibility = (fieldKey: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldKey)) {
        newSet.delete(fieldKey);
      } else {
        newSet.add(fieldKey);
      }
      return newSet;
    });
  };

  const hasChanges = existingCredentials ?
    JSON.stringify(credentials) !== JSON.stringify(existingCredentials) :
    Object.values(credentials).some(value => value.trim());

  const renderField = (field: CredentialField) => {
    const isPassword = field.type === 'password';
    const isVisible = visiblePasswords.has(field.key);
    const inputType = isPassword ? (isVisible ? 'text' : 'password') : field.type;

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key} className="text-white/80">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </Label>

        <div className="relative">
          <Input
            id={field.key}
            type={inputType}
            value={credentials[field.key]}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`bg-slate-800/30 border-slate-700/30 text-white ${
              isPassword ? 'pr-10' : ''
            } ${errors[field.key] ? 'border-red-500/50' : ''}`}
          />

          {isPassword && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => togglePasswordVisibility(field.key)}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-slate-400 hover:text-white"
            >
              {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
            </Button>
          )}
        </div>

        {errors[field.key] && (
          <p className="text-red-400 text-xs">{errors[field.key]}</p>
        )}

        {field.description && (
          <p className="text-xs text-slate-500">{field.description}</p>
        )}
      </div>
    );
  };

  return (
    <Card className="bg-slate-800/20 border-slate-700/30">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {integration.iconComponent}
          {integration.name} Configuration
        </CardTitle>
        <CardDescription className="text-slate-400">
          {integration.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {integration.setupUrl && (
          <Alert className="border-blue-500/20 bg-blue-500/10">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              {integration.setupLabel || `You'll need to set up ${integration.name} first.`}
              <Button
                variant="link"
                className="p-0 h-auto text-blue-400 hover:text-blue-300 ml-1"
                onClick={() => window.open(integration.setupUrl, '_blank')}
              >
                <ExternalLink size={12} className="mr-1" />
                Setup here
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {integration.fields.map(renderField)}
        </div>

        {existingCredentials && (
          <Alert className="border-green-500/20 bg-green-500/10">
            <Check className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-300 text-sm">
              Credentials are configured and ready to use.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading || !hasChanges}
            className="bg-[#FF7000] hover:bg-[#FF7000]/90 flex-1"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save size={16} />
                Save Credentials
              </div>
            )}
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="bg-slate-800/30 border-slate-700/30 text-white hover:bg-slate-800/40"
            >
              <X size={16} className="mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegrationCredentialsForm;
