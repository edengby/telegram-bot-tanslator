import "dotenv/config";
import input from "input";
import OpenAI from "openai";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";   // explicit file for Node 22
import { NewMessage }   from "telegram/events/index.js";

const apiId        = Number(process.env.API_ID);
const apiHash      = process.env.API_HASH;
const destChatId   = Number(process.env.DEST_CHAT_ID);
const model        = process.env.MODEL || "gpt-4.1-mini";
const maxTokens    = Number(process.env.SUMMARY_MAX_TOK || 256);
const openai       = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const stringSession = new StringSession(process.env.STRING_SESSION || "");

async function makePermalink(client, message) {
    const chat = await message.getChat();

    // 1) Public chats with @username
    if (chat.username) {
        return `https://t.me/${chat.username}/${message.id}`;
    }

    // 2) Private super-groups / channels  (chatId starts with -100…)
    // Strip the -100 prefix Telegram adds to internal IDs
    const absId = String(chat.id).replace(/^-100/, "");
    return `https://t.me/c/${absId}/${message.id}`;
}

// ----- helper ---------------------------------------------------------------
const SYS_PROMPT =
    "אתה בוט אשר מתרגם הודעות מפרסית לעברית בערוץ טלגרם ייעודי." +
    "אתה מקבל הודעות טקסט ומתרגם אותם לעברית, בשפה יומיומית"+
    "שמור על אמינות גבוהה, אל תשתמש במידע שאין לך. תרגם את שמות המקומות והאנשים בצורה מיטבית"+
    "ההודעות האלה הן הודעות בקבוצה של חדשות בטלגרם, אין צורך לכתוב מה הטקסט מתאר " +
    " או מה הנושא שלו, פשוט סכם את התוכן." +
    "זכור להשתמש בשפה העברית בלבד, " +
    "אל תוסיף מידע שלא מופיע בטקסט.";

async function summarise(text) {
    const res = await openai.chat.completions.create({
        model,
        messages: [
            { role: "system", content: SYS_PROMPT },
            { role: "user",   content: text.slice(0, 10_000) }   // safety clip
        ],
        max_tokens: maxTokens,
        temperature: 0.1,
    });
    return res.choices[0].message.content.trim();
}

// ----- main -----------------------------------------------------------------
async function main() {
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 5,
    });

    await client.start({
        phoneNumber: () => input.text("📱 Phone number: "),
        phoneCode:   () => input.text("💬 Code (SMS / Telegram): "),
        password:    () => input.text("🔑 2-step password (if any): "),
        onError:     (err) => console.error(err),
    });

    console.log("✅ Logged in as", (await client.getMe()).username || "user");

    // Print session string once for easier future runs
    if (!process.env.STRING_SESSION) {
        console.log("\n🔒 Add this to .env -->");
        console.log("STRING_SESSION=" + client.session.save());
    }

    // ---- universal message hook ---------------------------------------------
    client.addEventHandler(async (update) => {
        const msg = update.message;
        if (!msg?.message) return;                        // skip non-text
        if (msg.chatId === destChatId) return;            // avoid echo loop

        try {
            const summary  = await summarise(msg.message);
            const link     = await makePermalink(client, msg);
            const payload  = `${summary}\n\n🔗 מקור: ${link}`;
            await client.sendMessage(destChatId, { message: payload });
            console.log("✏️  Summarised & posted one message");
        } catch (err) {
            console.error("❌  Summarising failed:", err.status ?? "", err.message);
        }
    }, new NewMessage({}));

    console.log("🟢 Listening & summarising …");
    await client.connect();          // keep socket alive
    await new Promise(() => {});     // never resolve – keeps event-loop running
}

main();
