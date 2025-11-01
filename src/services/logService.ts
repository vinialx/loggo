import * as os from "os";
import * as path from "path";

import { LogEntry, LoggoSMTPConfig, LogLevel } from "../interfaces/interfaces";

import EmailService from "../internal/emailService";
import FileService from "../internal/fileService";
import FormatService from "../internal/formatService";
import Config, { defaultConfig } from "../config/config";

export class Loggo {
  private fileService: FileService;
  private emailService: EmailService;
  private formatService: FormatService;

  private _client: string;

  private _directory: string;

  private _console: boolean;
  private _filecount: number;

  private _debug: boolean;
  private _notify: boolean;
  private _throttle: number;
  private _smtp: LoggoSMTPConfig | undefined;

  constructor(options: Config = defaultConfig) {
    this._client = options.client || "Loggo";
    this._directory =
      options.directory || path.resolve(os.homedir(), this._client, "logs");

    this._smtp = options.smtp;
    this._debug = options.debug;
    this._notify = options.notify;
    this._console = options.console;
    this._throttle = options.throttle;
    this._filecount = options.filecount;

    this.fileService = new FileService(options);
    this.formatService = new FormatService(this._client);
    this.emailService = new EmailService(
      options.smtp,
      options.throttle,
      options.debug
    );

    this.fileService.initialize();
  }

  update(options: Partial<Config>): void {
    if (options.client) {
      this._client = options.client;
    }
    if (options.directory) {
      this._directory = options.directory;
    }

    if (options.debug) {
      this._debug = options.debug;
    }

    if (options.console) {
      this._console = options.console;
    }

    if (options.filecount) {
      this._filecount = options.filecount;
    }

    if (options.notify) {
      this._notify = options.notify;
    }

    if (options.throttle) {
      this._throttle = options.throttle;
    }

    if (options.smtp) {
      this._smtp = options.smtp;
    }
  }

  private log(level: LogLevel, code: string, message: string): void {
    if (!this.fileService.initialized) {
      console.error(
        `[Loggo] [${this.formatService.date()}] [ERROR] : loggo not initialized > skipping log`
      );
      return;
    }

    this.fileService.verify();

    const entry: LogEntry = {
      level,
      code,
      caller: this.formatService.caller(2),
      message,
      timestamp: this.formatService.date(),
    };

    const line = this.formatService.line(entry);
    this.fileService.write(line);

    if (this._console) {
      console.log(line.trim());
    }
  }

  info(code: string, text: string): void {
    this.log("INFO", code, text);
  }

  warn(code: string, text: string): void {
    this.log("WARN", code, text);
  }

  debug(code: string, text: string): void {
    this.log("DEBUG", code, text);
  }

  error(code: string, text: string): void {
    this.log("ERROR", code, text);
  }

  fatal(code: string, text: string): void {
    this.log("FATAL", code, text);

    if (!this.emailService.ready) {
      if (this._debug) {
        console.log(
          `[Loggo] [${this.formatService.date()}] [INFO] : smtp not ready`
        );
      }
      return;
    }

    this.emailService
      .sendErrorNotification(this._client, code, text)
      .catch((error) =>
        console.error(
          `[Loggo] [${this.formatService.date()}] [ERROR] : failed to send error message > ${(error as Error).message}`
        )
      );
  }
}
