````markdown
# 📄 Telegram Hebrew-Summariser User-Bot

A tiny Node 22 script that:

1. Logs in as **your personal Telegram account** (GramJS / MTProto).  
2. Listens to every message in the groups & channels you already follow.  
3. **Mirrors** the original post (photo/video/text) to a target channel.  
4. Generates a short **Hebrew summary** with OpenAI and appends a permalink to the source message.  

---

## ⚡ Quick Start

```bash
git clone <repo-url> tg-summariser-bot
cd tg-summariser-bot
npm install                # installs telegram, openai, fs-extra, input, dotenv
cp .env.example .env       # fill in the blanks (see next section)
node index.js              # first run asks for phone & code, then prints STRING_SESSION
````

---

## 🌱 `.env` Reference

| **Variable**       | **How / Where to obtain it**                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `API_ID`           | Log in to [https://my.telegram.org](https://my.telegram.org) → **API Development Tools** → create an app → copy **App api\_id** (numeric).                                                 |
| `API_HASH`         | Same screen, field **App api\_hash** (32-char hex).                                                                                                                                        |
| `STRING_SESSION`   | Leave blank on first run. Script prints `STRING_SESSION=…` after you enter the login code. Paste that string here for future runs.                                                         |
| `DEST_CHAT_ID`     | Channel / group that will receive summaries.<br>• **Numeric** (`-100…`): add **@getidsbot** to the chat and forward any message.<br>• **Public handle** (`@myChannel`): use the @username. |
| `OPENAI_API_KEY`   | Create in [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys), copy the `sk-…` value.                                                                             |
| `MODEL` (optional) | Chat model for summarising (default `gpt-4o-mini`).                                                                                                                                        |
| `SUMMARY_MAX_TOK`  | Max tokens for the Hebrew summary (default `256`).                                                                                                                                         |

---

## 🚑 Troubleshooting

| Symptom                             | Remedy                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `NaN cannot be converted to BigInt` | `DEST_CHAT_ID` missing or invalid. Keep exactly one valid entry in `.env`.           |
| `SESSION_PASSWORD_NEEDED` at login  | You enabled Telegram 2-step verification. Script prompts for your password—enter it. |
| Media not saved                     | Ensure the `media/` directory is writable, or edit the save path in `index.js`.      |

Happy summarising! 🎉

```
```
