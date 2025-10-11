interface TelemetryEnvelope {
  event: string;
  timestamp: string;
  route?: string;
  payload?: Record<string, unknown>;
}

const getEndpoint = () => import.meta.env.VITE_TELEMETRY_ENDPOINT as string | undefined;

const safeSerialize = (payload: Record<string, unknown>): string => {
  try {
    return JSON.stringify(payload);
  } catch (error) {
    return JSON.stringify({ error: 'Failed to serialise telemetry payload' });
  }
};

const dispatchBeacon = (envelope: TelemetryEnvelope) => {
  const endpoint = getEndpoint();
  if (!endpoint) return;

  const body = safeSerialize(envelope);

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    const blob = new Blob([body], { type: 'application/json' });
    navigator.sendBeacon(endpoint, blob);
    return;
  }

  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch((error) => {
    console.warn('Telemetry dispatch failed', error);
  });
};

export const logTelemetry = (event: string, payload: Record<string, unknown> = {}) => {
  const envelope: TelemetryEnvelope = {
    event,
    timestamp: new Date().toISOString(),
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    payload,
  };

  // Always mirror to console for local visibility
  console.info('[telemetry]', envelope);
  dispatchBeacon(envelope);
};

export const logTelemetryError = (event: string, error: unknown, context: Record<string, unknown> = {}) => {
  const payload: Record<string, unknown> = {
    ...context,
  };

  if (error instanceof Error) {
    payload.message = error.message;
    payload.stack = error.stack;
  } else if (typeof error === 'string') {
    payload.message = error;
  } else {
    payload.message = 'Unknown error';
    payload.details = error as Record<string, unknown>;
  }

  logTelemetry(event, payload);
};
