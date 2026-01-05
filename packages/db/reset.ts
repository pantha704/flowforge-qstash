import { prismaClient } from './src';

async function reset() {
  const client = prismaClient;

  console.log("🗑️  Nuking database...");

  // Delete in order of dependencies (child tables first)
  await client.zapRunOutbox.deleteMany({});
  console.log("  ✓ Deleted ZapRunOutbox");

  await client.zapRun.deleteMany({});
  console.log("  ✓ Deleted ZapRuns");

  await client.action.deleteMany({});
  console.log("  ✓ Deleted Actions");

  await client.trigger.deleteMany({});
  console.log("  ✓ Deleted Triggers");

  await client.zap.deleteMany({});
  console.log("  ✓ Deleted Zaps");

  await client.availableActions.deleteMany({});
  console.log("  ✓ Deleted AvailableActions");

  await client.availableTriggers.deleteMany({});
  console.log("  ✓ Deleted AvailableTriggers");

  // Keep users or delete them too
  // await client.user.deleteMany({});
  // console.log("  ✓ Deleted Users");

  console.log("\n🌱 Seeding fresh data...");

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
    await client.availableTriggers.create({ data: { name } });
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
    await client.availableActions.create({ data: { name } });
    console.log(`  ✓ Action: ${name}`);
  }

  console.log("\n✅ Reset complete!");
  console.log(`   ${triggers.length} triggers, ${actions.length} actions`);
}

reset()
  .catch((e) => {
    console.error("❌ Reset failed:", e);
    process.exit(1);
  })
  .finally(() => prismaClient.$disconnect());
