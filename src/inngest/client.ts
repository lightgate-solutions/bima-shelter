import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "bima" });

export const checkActiveAllowances = inngest.createFunction(
  { id: "check-active-allowances" },
  { cron: "0 1 * * *" },
  async ({ step }) => {
    await step.run("checking", async () => {
      console.log("hey");
    });
  },
);
