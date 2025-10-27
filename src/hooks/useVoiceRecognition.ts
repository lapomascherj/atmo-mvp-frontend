import { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface UseVoiceRecognitionProps {
  onResult: (transcript: string) => void;
  onInterimResult?: (transcript: string) => void;
}

interface UseVoiceRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
}

const useVoiceRecognition = ({ onResult, onInterimResult }: UseVoiceRecognitionProps): UseVoiceRecognitionReturn => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  const startListening = async () => {
    if (!browserSupportsSpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }
    
    try {
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream, we just needed permission
      
      resetTranscript();
      SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US',
        interimResults: true,
        maxAlternatives: 1
      });
    } catch (error) {
      console.error('Microphone permission denied:', error);
      // Still try to start listening in case permission was already granted
      resetTranscript();
      SpeechRecognition.startListening({ 
        continuous: true,
        language: 'en-US',
        interimResults: true,
        maxAlternatives: 1
      });
    }
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  // Handle interim results while listening
  useEffect(() => {
    if (listening && transcript.trim() && onInterimResult) {
      onInterimResult(transcript.trim());
    }
  }, [listening, transcript, onInterimResult]);

  // Call onResult when we have a transcript and we're no longer listening
  useEffect(() => {
    if (!listening && transcript.trim()) {
      onResult(transcript.trim());
      resetTranscript();
    }
  }, [listening, transcript, resetTranscript]); // Removed onResult from dependencies to prevent infinite loop

  // Determine error state
  const getError = (): string | null => {
    if (!browserSupportsSpeechRecognition) {
      return 'Speech recognition is not supported in this browser.';
    }
    if (isMicrophoneAvailable === false) {
      return 'Microphone access denied. Please allow microphone access and try again.';
    }
    return null;
  };

  // Check microphone permission status
  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      return result.state === 'granted';
    } catch (error) {
      console.warn('Permission API not supported, assuming microphone access needed');
      return false;
    }
  };

  return {
    startListening,
    stopListening,
    transcript: listening ? transcript : '', // Only show transcript while actively listening
    isListening: listening,
    error: getError(),
    isSupported: browserSupportsSpeechRecognition && isMicrophoneAvailable !== false
  };
};

export default useVoiceRecognition;
