import nodemailer from "nodemailer";
import { LoggoSMTPConfig } from "../interfaces/interfaces";

import FormatService from "./formatService";

class EmailService {
  private format: FormatService = new FormatService();
  private transporter: nodemailer.Transporter | null = null;

  private _ready: boolean = false;
  private lastEmailSent: number = 0;

  constructor(
    private smtpConfig: LoggoSMTPConfig | undefined,
    private throttle: number,
    private debug: boolean
  ) {
    this.initialize();
  }

  /**
   * Initializes SMTP transport.
   * @private
   */

  private initialize(): void {
    if (!this.smtpConfig) {
      if (this.debug) {
        console.log(
          `[Loggo] [${this.format.date()}] [INFO] : SMTP not configured - email notifications disabled`
        );
      }
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: this.smtpConfig.host,
        port: this.smtpConfig.port,
        secure: this.smtpConfig.secure ?? this.smtpConfig.port === 465,
        pool: true,
        auth: {
          user: this.smtpConfig.username,
          pass: this.smtpConfig.password,
        },
        debug: this.debug,
        logger: this.debug,
      });

      this._ready = true;

      if (this.debug) {
        console.log(
          `[Loggo] [${this.format.date()}] [INFO] : SMTP initialized succesfully`
        );
      }
    } catch (error) {
      console.error(
        `[Loggo] [${this.format.date()}] [ERROR] : error initializing loggo smtp > ${(error as Error).message}`
      );

      this.transporter = null;
    }
  }

  async sendErrorNotification(
    client: string,
    code: string,
    module: string,
    error: string
  ): Promise<void> {
    if (!this.transporter || !this.smtpConfig) {
      console.error(
        `[Loggo] [${this.format.date()}] [ERROR] : failed to send error message > email service not initialized`
      );
      return;
    }

    const now = Date.now();

    if (now - this.lastEmailSent < this.throttle) {
      if (this.debug) {
        console.log(
          `[Loggo] [${this.format.date()}] [INFO] : email throttled > ${now - this.lastEmailSent} ms remaining`
        );
      }

      return;
    }

    this.lastEmailSent = now;

    const recipients = Array.isArray(this.smtpConfig.to)
      ? this.smtpConfig.to.join(", ")
      : this.smtpConfig.to;

    const emailContent = {
      from: `"${client}" <${this.smtpConfig.from}>`,
      to: recipients,
      subject: `[${client}] Error Alert - ${code}`,
      html: `
        <h2>Error Report</h2>
        <p><strong>Client:</strong> ${client}</p>
        <p><strong>Error Code:</strong> ${code}</p>
        <p><strong>Module:</strong> ${module}</p>
        <p><strong>Error Message:</strong> ${error}</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString("pt-BR")}</p>
        <hr>
      `,
    };

    try {
      await this.transporter.sendMail(emailContent);
      if (this.debug) {
        console.log(
          `[Loggo] [${this.format.date()}] [INFO] : error email sent successfully to ${recipients}`
        );
      }
    } catch (error) {
      console.error(
        `[Loggo] [${this.format.date()}] [ERROR] : failed to send error message > ${(error as Error).message}`
      );
    }
  }

  reconfigure(smtpConfig: LoggoSMTPConfig | undefined): void {
    this.smtpConfig = smtpConfig;
    this.transporter = null;
    this.initialize();
  }

  get ready(): boolean {
    return this._ready;
  }
}

export default EmailService;
