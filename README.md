# 🔍 AskAnywhere.AI – Contextual AI Assistant for the Web

AskAnywhere.AI is a Chrome extension that allows users to **query AI models anywhere on the web** by simply **highlighting text and right-clicking**. This lightweight plugin integrates seamlessly with **Gemini Nano (on-device)** and **cloud-based LLM APIs** to provide smart, contextual answers in real-time.

---

## 🚀 Key Features

- **Contextual Highlight-to-Ask**  
  Right-click on any selected text and ask a question, without leaving the page.

- **Model Flexibility**  
  - **Gemini Nano (on-device)** for instant response and privacy.
  - **Custom AI API Integration** for external providers like OpenAI, Anthropic, Cohere, etc.

- **Intelligent Role-Based Profiling**
  - System default profile to provide general-purpose assistance.
  - Website-specific custom profiles (e.g., `Coder` profile on GitHub, `Product Analyst` on Google Sheets).
  - Profiles can be user-defined or AI-assisted.

- **Adaptive Contextual Injection**  
  Enriches prompts with relevant metadata and user-defined rules based on the current domain.

- **Zero-friction UX**  
  Minimalist, intuitive, and non-intrusive. Designed for productivity-first users.

---

## 💡 Use Case Examples

| Website         | Profile Applied   | Behavior                                                                 |
|------------------|--------------------|--------------------------------------------------------------------------|
| `github.com`    | `Coder`            | Suggest code improvements, analyze snippets, or explain complex logic.  |
| `notion.so`     | `Writer`           | Refine writing, summarize content, or brainstorm ideas.                 |
| `stackoverflow.com` | `Debug Assistant` | Explain errors, propose fixes, or rewrite in other languages.         |

---

## 🧠 Architecture Overview

```plaintext
[ User Interaction ]
        ↓
[ Context Extractor ]
        ↓
[ Profile Resolver (Domain Specific) ]
        ↓
[ Prompt Generator ]
        ↓
[ AI Router ]
   ↙       ↘
Gemini Nano   External API
```

- **Context Extractor:** Gathers selected text, surrounding DOM content, metadata.
- **Profile Resolver:** Matches the site to a pre-defined or user-defined role.
- **Prompt Generator:** Builds a smart query combining content, role, and intent.
- **AI Router:** Dispatches the prompt to either local (Gemini Nano) or external LLMs.

---

## ⚙️ Tech Stack

- **Manifest V3 Chrome Extension**
- **JavaScript / TypeScript**
- **Gemini Nano via Chrome's local runtime**
- **API Proxy Layer** (for OpenAI, Claude, etc.)
- **Local Storage for Profiles**
- **UI: Lightweight, contextual popup**

---

## 📁 Project Structure (Planned)

```
askanywhere-ai/
├── manifest.json
├── background.js
├── content/
│   └── contentScript.js
├── popup/
│   ├── popup.html
│   └── popup.js
├── profiles/
│   ├── default.json
│   └── github-coder.json
├── utils/
│   └── contextBuilder.js
├── services/
│   ├── aiRouter.js
│   └── geminiHandler.js
├── README.md
```


---

## 🔧 Planned Features

- ✅ Domain-aware Role Profiles  
- ✅ Dual AI Engine Support (Local & API)  
- ⏳ Profile Suggestion via AI  
- ⏳ Prompt Templating System  
- ⏳ Secure Token Handling  
- ⏳ Keyboard Shortcut Support  
- ⏳ Offline Mode with Gemini Nano  

---

## 📌 Roadmap

- **v0.1:** MVP with highlight-to-ask, default profile, Gemini Nano support.  
- **v0.2:** Profile manager UI, custom profiles per domain.  
- **v0.3:** Multi-model integration (API key input).  
- **v1.0:** Stable release with AI-assisted profile generation and prompt debugging.  

---

## 🧑‍💻 For Contributors

This project is in early-stage ideation. Contributions are welcome, especially in the following areas:

- Gemini Nano integration strategy  
- Chrome extension UX  
- Prompt engineering  
- AI API router design  

---

## 📜 License

[MIT License](LICENSE)

---

## 💬 Inspiration

Built with the philosophy that **AI should be ambient, contextual, and customizable**, AskAnywhere.AI empowers users to tap into intelligence exactly where they need it — no tab switching, no friction.