interface LogLevel {
  ERROR: 'error';
  WARN: 'warn';
  INFO: 'info';
  DEBUG: 'debug';
}

const LOG_LEVELS: LogLevel = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
};

class Logger {
  private formatMessage(level: string, message: any): string {
    const timestamp = new Date().toISOString();
    const logMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
    return `[${timestamp}] [${level.toUpperCase()}] ${logMessage}`;
  }

  info(message: any): void {
    console.log(this.formatMessage(LOG_LEVELS.INFO, message));
  }

  warn(message: any): void {
    console.warn(this.formatMessage(LOG_LEVELS.WARN, message));
  }

  error(message: any, error?: Error): void {
    const errorMessage = error ? `${message} - ${error.message}\n${error.stack}` : message;
    console.error(this.formatMessage(LOG_LEVELS.ERROR, errorMessage));
  }

  debug(message: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message));
    }
  }
}

export const logger = new Logger();
