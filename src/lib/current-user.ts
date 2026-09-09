import type { SessionUser } from "@/components/layout/user-menu";

/**
 * Placeholder identity for the application shell.
 *
 * The authentication phase replaces this single export with the Auth.js
 * session lookup; keeping it in one module means nothing else in the shell has
 * to change when that happens.
 */
export function getCurrentUser(): SessionUser {
  return {
    name: "Shahzaib Panhwer",
    email: "shahzaib@devflow.app",
  };
}
