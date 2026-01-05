import { prismaClient } from './src';

async function main() {
  const client = prismaClient;

  console.log("🌱 Seeding database...");

  // Seed triggers
  const triggers = [
    "Webhook",
    "Schedule (Cron)",
    "New Email Received",
    "New Form Submission",
    "New Row in Spreadsheet",
    "New File in Drive",
  ];

  for (const name of triggers) {
    await client.availableTriggers.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ Trigger: ${name}`);
  }

  // Seed actions
  const actions = [
    "Send Email",
    "Send Slack Message",
    "Create Spreadsheet Row",
    "Send Discord Message",
    "Create Notion Page",
    "Send SMS",
    "HTTP Request",
    "Create Trello Card",
  ];

  for (const name of actions) {
    await client.availableActions.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    console.log(`  ✓ Action: ${name}`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   ${triggers.length} triggers, ${actions.length} actions`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
