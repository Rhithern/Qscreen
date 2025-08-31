export const logger = {
  info: (message: string | object, ...args: any[]) => {
    if (typeof message === 'object') {
      console.log(`[${new Date().toISOString()}] INFO:`, message, ...args);
    } else {
      console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
    }
  },
  warn: (message: string | object, ...args: any[]) => {
    if (typeof message === 'object') {
      console.warn(`[${new Date().toISOString()}] WARN:`, message, ...args);
    } else {
      console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
    }
  },
  error: (message: string | object, ...args: any[]) => {
    if (typeof message === 'object') {
      console.error(`[${new Date().toISOString()}] ERROR:`, message, ...args);
    } else {
      console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
    }
  },
  debug: (message: string | object, ...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      if (typeof message === 'object') {
        console.debug(`[${new Date().toISOString()}] DEBUG:`, message, ...args);
      } else {
        console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
      }
    }
  }
};

