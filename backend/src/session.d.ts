// Augment express-session to include our adminLoggedIn flag.
import "express-session";

declare module "express-session" {
  interface SessionData {
    adminLoggedIn?: boolean;
  }
}
