/**
 * Action Executors
 *
 * Each executor takes a metadata object and performs the actual action.
 * Returns true on success, throws on failure for retry logic.
 */

import { Resend } from 'resend';

// Lazy initialization helper (avoid env var access at build time)
let resendClient: Resend | null = null;
function getResend() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

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

  const resend = getResend();
  if (!resend) {
    console.log(`   ⚠️ RESEND_API_KEY not set - email not sent (demo mode)`);
    return true;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'FlowForge <onboarding@resend.dev>',
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
 * Create Spreadsheet Row - Uses Google Sheets API with OAuth
 */
async function createSpreadsheetRow(metadata: ActionMetadata): Promise<boolean> {
  const { spreadsheetId, sheetName, values, _googleAccessToken } = metadata as {
    spreadsheetId: string;
    sheetName: string;
    values: string;
    _googleAccessToken?: string;
  };

  console.log(`📊 [Create Spreadsheet Row]`);
  console.log(`   Sheet: ${spreadsheetId}/${sheetName || 'Sheet1'}`);
  console.log(`   Values: ${values}`);

  if (!_googleAccessToken) {
    console.log(`   ⚠️ No Google OAuth token - user needs to connect Google`);
    return true;
  }

  if (!spreadsheetId) {
    console.log(`   ⚠️ No spreadsheet ID provided - skipping`);
    return true;
  }

  try {
    // Parse values (comma-separated)
    const rowValues = values.split(',').map(v => v.trim());
    const range = `${sheetName || 'Sheet1'}!A:Z`;

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${_googleAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Sheets API error:`, result);
      throw new Error(result.error?.message || "Sheets API error");
    }

    console.log(`   ✅ Row added to ${result.updates?.updatedRange || range}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to add spreadsheet row:`, error);
    throw error;
  }
}

/**
 * Create Notion Page - Uses Notion API
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

  const notionKey = process.env.NOTION_API_KEY;
  if (!notionKey) {
    console.log(`   ⚠️ NOTION_API_KEY not set - skipping`);
    return true;
  }

  if (!databaseId) {
    console.log(`   ⚠️ No database ID provided - skipping`);
    return true;
  }

  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${notionKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          title: {
            title: [{ text: { content: title || "Untitled" } }],
          },
        },
        children: content ? [
          {
            object: "block",
            type: "paragraph",
            paragraph: {
              rich_text: [{ type: "text", text: { content } }],
            },
          },
        ] : [],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Notion API error:`, result);
      throw new Error(result.message || "Notion API error");
    }

    console.log(`   ✅ Page created: ${result.id}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to create Notion page:`, error);
    throw error;
  }
}

/**
 * Create Trello Card - Uses Trello API
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

  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_API_TOKEN;

  if (!apiKey || !apiToken) {
    console.log(`   ⚠️ TRELLO_API_KEY or TRELLO_API_TOKEN not set - skipping`);
    return true;
  }

  if (!listId) {
    console.log(`   ⚠️ No list ID provided - skipping`);
    return true;
  }

  try {
    const url = new URL("https://api.trello.com/1/cards");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("token", apiToken);
    url.searchParams.set("idList", listId);
    url.searchParams.set("name", title || "Untitled");
    if (description) {
      url.searchParams.set("desc", description);
    }

    const response = await fetch(url.toString(), { method: "POST" });
    const result = await response.json();

    if (!response.ok) {
      console.error(`   ❌ Trello API error:`, result);
      throw new Error(result.message || "Trello API error");
    }

    console.log(`   ✅ Card created: ${result.id}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Failed to create Trello card:`, error);
    throw error;
  }
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
