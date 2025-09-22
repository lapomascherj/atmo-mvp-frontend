import { useEffect, useState } from "react";

interface UseLoadingTimeoutOptions {
  loading: boolean;
  timeout?: number;
  onTimeout?: () => void;
}

export const useLoadingTimeout = ({
  loading,
  timeout = 10000,
  onTimeout,
}: UseLoadingTimeoutOptions) => {
  const [timeoutOccurred, setTimeoutOccurred] = useState(false);

  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setTimeoutOccurred(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);

      return () => {
        clearTimeout(timeoutId);
        setTimeoutOccurred(false);
      };
    } else {
      setTimeoutOccurred(false);
    }
  }, [loading, timeout, onTimeout]);

  return { timeoutOccurred };
};
