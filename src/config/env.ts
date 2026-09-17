import "server-only";

import {
  selectServerEnvironment,
  serverEnvironmentSchema,
} from "@/config/env-schema";

export function getServerEnvironment(source: NodeJS.ProcessEnv = process.env) {
  return serverEnvironmentSchema.parse(selectServerEnvironment(source));
}
