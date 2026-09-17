import { z } from "zod";

const projectInfoSchema = z.object({
  name: z.literal("TestPilot AI"),
  version: z.string().regex(/^0\.1\.0$/, "M0 must remain at version 0.1.0"),
});

export const PROJECT_INFO = projectInfoSchema.parse({
  name: "TestPilot AI",
  version: "0.1.0",
});
