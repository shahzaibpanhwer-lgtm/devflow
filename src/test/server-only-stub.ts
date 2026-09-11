/**
 * Test stand-in for the `server-only` package.
 *
 * The real module throws on import to stop server code being bundled into a
 * client component. That guard is exactly what we want in the application and
 * exactly what breaks a node test run, so tests alias it to this no-op. The
 * protection still applies to every real build.
 */
export {};
