import * as fs from "fs";
import * as path from "path";
import * as fsp from "fs/promises";

import FormatService from "./formatService";
import Config, { defaultConfig } from "../config/config";

class FileService {
  private _filename: string = "";
  private _currentDay: number = 0;
  private _initicialized: boolean = false;

  private format: FormatService;

  constructor(private options: Config) {
    this.format = new FormatService(this.options.client);
  }

  initialize(): void {
    if (this._initicialized) {
      return;
    }

    try {
      this._currentDay = new Date().getDate();

      fs.mkdirSync(this.options.directory, { recursive: true });
      this._filename = path.resolve(
        this.options.directory,
        this.format.filename()
      );

      fs.appendFileSync(this._filename, this.format.separator());
      this._initicialized = true;
    } catch (error) {
      console.error(
        `[Loggo] [${this.format.date()}] [ERROR] : error initializing loggo > ${(error as Error).message}`
      );
    }
  }

  write(line: string): void {
    if (!this.initialized) {
      console.warn(`[${this.options.client}] File manager not initialized`);
      return;
    }

    try {
      fs.appendFileSync(this._filename, line);
    } catch (error) {
      console.error(
        `[Loggo] [${this.format.date()}] [ERROR] : failed to write to log file > ${(error as Error).message}`
      );
    }
  }

  verify(): void {
    const today = new Date().getDate();

    if (today === this._currentDay) {
      return;
    }

    try {
      fs.mkdirSync(this.options.directory, { recursive: true });
      this._filename = path.resolve(
        this.options.directory,
        this.format.filename()
      );

      fs.appendFileSync(this._filename, this.format.separator());
      this._initicialized = true;

      this.rotate().catch((error) =>
        console.error(
          `[Loggo] [${this.format.date()}] [ERROR] : error rotating loggo > ${(error as Error).message}`
        )
      );
    } catch (error) {
      console.error(
        `[Loggo] [${this.format.date()}] [ERROR] : error verifying loggo rotation > ${(error as Error).message}`
      );
    }
  }

  private async rotate(): Promise<void> {
    try {
      const files = await fsp.readdir(this.options.directory);

      const logFilesPromises = files
        .filter((file) => file.endsWith(".txt"))
        .map(async (file) => {
          const filePath = path.join(this.options.directory, file);
          const stats = await fsp.stat(filePath);
          return {
            name: file,
            path: filePath,
            mtime: stats.mtime.getTime(),
          };
        });

      const logFiles = (await Promise.all(logFilesPromises)).sort(
        (a, b) => b.mtime - a.mtime
      );

      if (logFiles.length > this.options.filecount) {
        const filesToDelete = logFiles.slice(this.options.filecount);

        await Promise.allSettled(
          filesToDelete.map(async (file) => {
            try {
              await fsp.unlink(file.path);
            } catch (error) {
              console.error(
                `[Loggo] [${this.format.date()}] [ERROR] : error deleting loggo file > ${(error as Error).message}`
              );
            }
          })
        );
      }
    } catch (error) {
      console.error(
        `[Loggo] [${this.format.date()}] [ERROR] : loggo cleanup failed > ${(error as Error).message}`
      );
    }
  }

  get initialized(): boolean {
    return this._initicialized;
  }
}

export default FileService;
