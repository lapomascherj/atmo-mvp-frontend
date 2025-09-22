import { useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

interface UseVoiceRecognitionProps {
  onResult: (transcript: string) => void;
}

interface UseVoiceRecognitionReturn {
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  isListening: boolean;
  error: string | null;
  isSupported: boolean;
}

const useVoiceRecognition = ({ onResult }: UseVoiceRecognitionProps): UseVoiceRecognitionReturn => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  const startListening = () => {
    if (!browserSupportsSpeechRecognition) {
      return;
    }
    resetTranscript();
    SpeechRecognition.startListening({ 
      continuous: true,
      language: 'en-US'
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

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
