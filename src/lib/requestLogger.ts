export interface RequestLogEntry {
  id: string;
  timestamp: number;
  model: string;
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  requestBody: any;
  responseStatus?: number;
  responseBody?: string;
  streamingChunks?: string[];
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  metrics?: {
    ttft?: number;
    totalTime?: number;
    tps?: number;
    tokens?: number;
  };
  error?: string;
  retries?: number;
}

type Subscriber = (logs: RequestLogEntry[]) => void;

class RequestLoggerClass {
  private logs: RequestLogEntry[] = [];
  private subscribers: Set<Subscriber> = new Set();

  getLogs() {
    return [...this.logs];
  }

  logRequest(entry: RequestLogEntry) {
    this.logs = [entry, ...this.logs].slice(0, 100);
    this.notify();
  }

  updateResponse(id: string, updates: Partial<RequestLogEntry>) {
    this.logs = this.logs.map((log) => {
      if (log.id === id) {
        const mergedChunks = updates.streamingChunks
          ? [...(log.streamingChunks || []), ...updates.streamingChunks]
          : log.streamingChunks;
        
        return {
          ...log,
          ...updates,
          streamingChunks: mergedChunks,
        };
      }
      return log;
    });
    this.notify();
  }

  subscribe(sub: Subscriber) {
    this.subscribers.add(sub);
    sub(this.getLogs());
    return () => {
      this.subscribers.delete(sub);
    };
  }

  clear() {
    this.logs = [];
    this.notify();
  }

  private notify() {
    this.subscribers.forEach((sub) => sub(this.getLogs()));
  }
}

export const RequestLogger = new RequestLoggerClass();
