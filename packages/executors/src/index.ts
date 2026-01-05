/**
 * Action Executors
 *
 * Each executor takes a metadata object and performs the actual action.
 * Returns true on success, throws on failure for retry logic.
 */

import { Resend } from 'resend';

// Initialize Resend with API key from environment
const resend = new Resend(process.env.RESEND_API_KEY);

export interface ActionMetadata {
  [key: string]: unknown;
}

export type Executor = (metadata: ActionMetadata) => Promise<boolean>;

/**
 * Send Email - Uses Resend API
 */
async function sendEmail(metadata: ActionMetadata): Promise<boolean> {
  const { to, subject, body } = metadata as { to: string; subject: string; body: string };

  console.log(`📧 [Send Email]`);
  console.log(`   To: ${to}`);
  console.log(`   Subject: ${subject}`);

  if (!process.env.RESEND_API_KEY) {
    console.log(`   ⚠️ RESEND_API_KEY not set - email not sent (demo mode)`);
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>', // Use your verified domain in production
      to: [to],
      subject: subject || 'No Subject',
      html: `<p>${body || 'No content'}</p>`,
    });

    if (error) {
      console.error(`   ❌ Resend error:`, error);
      throw new Error(error.message);
    }

    console.log(`   ✅ Email sent! ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to send email:`, error);
    throw error;
  }
}

/**
 * HTTP Request - Makes actual HTTP calls
 */
async function httpRequest(metadata: ActionMetadata): Promise<boolean> {
  const { url, method = 'GET', body } = metadata as { url: string; method?: string; body?: string };

  console.log(`🌐 [HTTP Request]`);
  console.log(`   ${method} ${url}`);

  if (!url) {
    console.log(`   ⚠️ No URL provided - skipping`);
    return true;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method !== 'GET' && body ? body : undefined,
    });

    const responseText = await response.text();
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${responseText.substring(0, 100)}...`);
    return response.ok;
  } catch (error) {
    console.error(`   ❌ HTTP Request failed:`, error);
    throw error;
  }
}

/**
 * Send Discord Message - Posts to Discord webhook
 */
async function sendDiscordMessage(metadata: ActionMetadata): Promise<boolean> {
  const { webhookUrl, message } = metadata as { webhookUrl: string; message: string };

  console.log(`💬 [Discord Message]`);
  console.log(`   Message: ${message?.substring(0, 50)}...`);

  if (!webhookUrl) {
    console.log(`   ⚠️ No webhook URL provided - skipping`);
    return true;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });

    console.log(`   Status: ${response.status}`);
    return response.ok || response.status === 204;
  } catch (error) {
    console.error(`   ❌ Discord message failed:`, error);
    throw error;
  }
}

/**
 * Send Slack Message - Posts to Slack webhook
 */
async function sendSlackMessage(metadata: ActionMetadata): Promise<boolean> {
  const { channel, message, webhookUrl } = metadata as { channel: string; message: string; webhookUrl?: string };

  console.log(`💼 [Slack Message]`);
  console.log(`   Channel: ${channel || 'default'}`);
  console.log(`   Message: ${message?.substring(0, 50)}...`);

  if (!webhookUrl) {
    console.log(`   ⚠️ No webhook URL provided - skipping (demo mode)`);
    return true;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, channel }),
    });

    console.log(`   Status: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`   ❌ Slack message failed:`, error);
    throw error;
  }
}

/**
 * Send SMS - Demo mode (would use Twilio in prod)
 */
async function sendSms(metadata: ActionMetadata): Promise<boolean> {
  const { phoneNumber, message } = metadata as { phoneNumber: string; message: string };

  console.log(`📱 [Send SMS]`);
  console.log(`   To: ${phoneNumber}`);
  console.log(`   Message: ${message?.substring(0, 50)}...`);
  console.log(`   ⚠️ SMS not configured - demo mode`);

  return true;
}

/**
 * Create Spreadsheet Row - Demo mode
 */
async function createSpreadsheetRow(metadata: ActionMetadata): Promise<boolean> {
  const { spreadsheetId, sheetName, values } = metadata as {
    spreadsheetId: string;
    sheetName: string;
    values: string;
  };

  console.log(`📊 [Create Spreadsheet Row]`);
  console.log(`   Sheet: ${spreadsheetId}/${sheetName}`);
  console.log(`   Values: ${values}`);
  console.log(`   ⚠️ Spreadsheet API not configured - demo mode`);

  return true;
}

/**
 * Create Notion Page - Demo mode
 */
async function createNotionPage(metadata: ActionMetadata): Promise<boolean> {
  const { databaseId, title, content } = metadata as {
    databaseId: string;
    title: string;
    content: string;
  };

  console.log(`📝 [Create Notion Page]`);
  console.log(`   Database: ${databaseId}`);
  console.log(`   Title: ${title}`);
  console.log(`   ⚠️ Notion API not configured - demo mode`);

  return true;
}

/**
 * Create Trello Card - Demo mode
 */
async function createTrelloCard(metadata: ActionMetadata): Promise<boolean> {
  const { listId, title, description } = metadata as {
    listId: string;
    title: string;
    description: string;
  };

  console.log(`📋 [Create Trello Card]`);
  console.log(`   List: ${listId}`);
  console.log(`   Title: ${title}`);
  console.log(`   ⚠️ Trello API not configured - demo mode`);

  return true;
}

/**
 * Executor registry - maps action names to executor functions
 */
export const executors: Record<string, Executor> = {
  "Send Email": sendEmail,
  "HTTP Request": httpRequest,
  "Send Discord Message": sendDiscordMessage,
  "Send Slack Message": sendSlackMessage,
  "Send SMS": sendSms,
  "Create Spreadsheet Row": createSpreadsheetRow,
  "Create Notion Page": createNotionPage,
  "Create Trello Card": createTrelloCard,
};

/**
 * Execute an action by name
 */
export async function executeAction(actionName: string, metadata: ActionMetadata): Promise<boolean> {
  const executor = executors[actionName];

  if (!executor) {
    console.warn(`⚠️ No executor found for action: ${actionName}`);
    return true; // Skip unknown actions
  }

  return executor(metadata);
}
