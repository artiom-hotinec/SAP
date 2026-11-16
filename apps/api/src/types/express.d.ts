import { SessionInfo } from '../auth/types/session-info'; // use your actual type

declare global {
  namespace Express {
    interface Request {
      session?: SessionInfo;
    }
  }
}

export {};
