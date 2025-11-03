export interface LoggoConfig {
  client?: string;
  json?: boolean;
  debug?: boolean;
  console?: boolean;

  directory?: LoggoDirectory;
  filecount?: LoggoFilecount;

  notify?: boolean;
  smtp?: LoggoSMTPConfig;
  throttle?: number;
}

export interface LoggoDirectory {
  txt?: string;
  json?: string;
}

export interface LoggoFilecount {
  txt?: number;
  json?: number;
}

export interface LoggoSMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  to: string | string[];
  secure: boolean;
}

export type LogLevel = "INFO" | "WARN" | "ERROR" | "FATAL" | "DEBUG";

export interface LogEntry {
  level: LogLevel;
  timestamp: string;
  code: string;
  caller: string;
  message: string;
}
