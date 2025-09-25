# Wireframe Reference Doc

## ASCII / Markdown Mock-ups

```text
=== RAGI Protected App Layout (Desktop & Mobile) ===
+----------------------------------------------------------+
| Mobile Header (mobile only) [☰] RAGI    [👤 Profile]    |
|=========================================================|
| Sidebar (64px↔256px) |  Main Content (dynamic width)    |
|---------------------|-----------------------------------|
| 💬 Chat             |  [Page-specific content]          |
| 📄 Documents        |  - Desktop: Starts after sidebar  |
| 🕐 History          |  - Mobile: Full width overlay     |
| 👤 Profile          |                                   |
|                     |                                   |
| Usage Tracker       |                                   |
| ▓▓▓░░ 67/100       |                                   |
| ▓▓░░░ 2GB/5GB      |                                   |
| ▓▓▓▓░ 45/1000      |                                   |
+---------------------+-----------------------------------+

=== Landing Page `/` (Public Layout) ===
+-------------------------------------------------------------+
| Fixed Navbar: [RAGI Logo] [Features|Pricing|FAQ] [Login|Get Started] |
+=============================================================+
| Hero Section: (pt-16 for fixed navbar)                     |
| "Chat with Your Documents Using RAGI"                      |
| [Gemini AI Badge] [Upload and chat demo]                   |
|-------------------------------------------------------------|
| Features Section: 3-column grid                            |
| [Document Intelligence] [Smart Search] [Multimedia]        |
|-------------------------------------------------------------|
| Problem Section: "Hours wasted searching documents"        |
|-------------------------------------------------------------|
| RAG Demo Section: Interactive preview                      |
|-------------------------------------------------------------|
| Pricing Section: Free | Basic $29 | Pro $99               |
|-------------------------------------------------------------|
| FAQ Section: Collapsible questions                         |
|-------------------------------------------------------------|
| CTA Section: Final call to action                          |
|-------------------------------------------------------------|
| Footer: Links and legal                                    |
+-------------------------------------------------------------+

=== Chat Interface `/chat/[[...conversationId]]` ===
+----------------------------------------------------------+
| [Mobile Header: ☰ RAGI | 👤]  (mobile only)              |
|=========================================================|
| Sidebar 64/256px  |  Messages Area (dynamic padding)     |
|-------------------|---------------------------------------|
| 💬 Chat ●         | Welcome Card (if new conversation)   |
| 📄 Documents      | "Turn documents into intelligent..."  |
| 🕐 History        | [Example prompts clickable]          |
| 👤 Profile        |                                      |
|                   | OR                                   |
| Usage Tracker     |                                      |
| ▓▓▓░░ 67/100     | Chat Messages (scroll area)          |
| ▓▓░░░ 2GB/5GB    | User: "What are key findings?"       |
| ▓▓▓▓░ 45/1000    | AI: [Response with citations] 📄     |
|                   | [Thinking indicator if loading...]   |
+-------------------+---------------------------------------|
|                   | Fixed Input Area (bottom)            |
|                   | [📎] [Text input area...]    [Send]  |
|                   | Model: Gemini 2.5 Flash | Usage 5/∞ |
+----------------------------------------------------------+
* Input area dynamically adjusts sidebar left margin
* Mobile: left-0, Desktop collapsed: left-16, expanded: left-64

=== Documents Management `/documents` ===
+----------------------------------------------------------+
| [Mobile Header: ☰ RAGI | 👤]  (mobile only)              |
|=========================================================|
| Sidebar 64/256px  |  Document Dashboard                  |
|-------------------|---------------------------------------|
| 💬 Chat           | Container max-w-4xl mx-auto px-4 py-8|
| 📄 Documents ●    |                                      |
| 🕐 History        | "Document Management"                |
| 👤 Profile        | "Upload and manage your documents..." |
|                   |                                      |
| Usage Tracker     | [Usage Warning Banner if near limit] |
| ▓▓▓░░ 67/100     |                                      |
| ▓▓░░░ 2GB/5GB    | DocumentList Component               |
| ▓▓▓▓░ 45/1000    | • report.pdf [2.3MB] [✓ Complete]    |
|                   | • audio.mp3  [4.1MB] [⏳ Processing] |
|                   | • image.jpg  [1.8MB] [✓ Complete]    |
|                   |                                      |
|                   | [➕ Upload Documents Button]         |
|                   |                                      |
|                   | BulkUploadDialog (modal overlay)     |
+-------------------+---------------------------------------|

=== Conversation History `/history` ===
+----------------------------------------------------------+
| [Mobile Header: ☰ RAGI | 👤]  (mobile only)              |
|=========================================================|
| Sidebar 64/256px  |  History Browser                     |
|-------------------|---------------------------------------|
| 💬 Chat           | Container max-w-4xl mx-auto px-4 py-8|
| 📄 Documents      |                                      |
| 🕐 History ●      | "Chat History"                       |
| 👤 Profile        | "View and manage previous..."        |
|                   |                                      |
| Usage Tracker     | ConversationTable Component         |
| ▓▓▓░░ 67/100     | Today                                |
| ▓▓░░░ 2GB/5GB    | • "Quarterly analysis" [Gemini] →    |
| ▓▓▓▓░ 45/1000    | • "Meeting summary" [Gemini] →       |
|                   |                                      |
|                   | Yesterday                            |
|                   | • "Product roadmap" [Gemini] →       |
|                   |                                      |
|                   | OR (if empty)                        |
|                   | [Empty State with MessageSquare icon]|
|                   | "No conversations yet"               |
|                   | [Start Chatting Button]             |
+-------------------+---------------------------------------|

=== Profile & Billing `/profile` ===
+----------------------------------------------------------+
| [Mobile Header: ☰ RAGI | 👤]  (mobile only)              |
|=========================================================|
| Sidebar 64/256px  |  Profile Dashboard                   |
|-------------------|---------------------------------------|
| 💬 Chat           | Container max-w-4xl mx-auto px-4 py-8|
| 📄 Documents      |                                      |
| 🕐 History        | Account Information Card             |
| 👤 Profile ●      | Email: user@example.com             |
|                   | Name: [Editable inline] ✏️           |
| Usage Tracker     | Member since: Dec 2024               |
| ▓▓▓░░ 67/100     |                                      |
| ▓▓░░░ 2GB/5GB    | Usage Statistics Card               |
| ▓▓▓▓░ 45/1000    | Documents: ▓▓▓░░ 15/1000            |
|                   | Storage: ▓▓░░░ 2GB/5GB              |
|                   | Requests: ▓▓▓▓░ 450/1000            |
|                   |                                      |
|                   | Subscription Plans Grid              |
|                   | [Free] [Basic $29 ✓Current] [Pro $99]|
|                   | BillingManagementCard                |
|                   | [Manage Billing Portal] [Cancel]    |
+-------------------+---------------------------------------|

=== Authentication Pages (Centered Layout) ===
Login `/auth/login`                Sign Up `/auth/sign-up`
+-------------------------+        +-------------------------+
| [RAGI Logo centered]    |        | [RAGI Logo centered]    |
|                         |        |                         |
| Email: [____________]   |        | Email: [____________]   |
| Password: [_________]   |        | Password: [_________]   |
| [Remember me] ☐        |        | Confirm: [__________]   |
| [Login Button]         |        | [Sign Up Button]       |
| [Forgot Password?]     |        | Have account? [Login]   |
| Don't have account?     |        |                         |
| [Sign Up Link]         |        |                         |
+-------------------------+        +-------------------------+
```

## Navigation Flow Map

```
Landing → Sign Up → Chat (new conversation) → Documents Upload → Chat (with docs)
          ↘︎ Login → Chat (resume/new) → History → Chat (resume conversation)
                                    → Profile → Stripe Checkout → Chat
                                    → Documents → Bulk Upload → Chat

Chat → Documents (upload more files)
    → History (view past conversations) → Chat (resume specific conversation)
    → Profile (manage subscription) → Stripe Portal → Profile
                                   → Cancel Subscription → Profile

Documents → Chat (start conversation with uploaded docs)
         → History (view conversations about documents)
         → Profile (check storage usage)

History → Chat (resume any conversation)
       → Documents (upload more files)
       → Profile (upgrade for more history)

Auth Flow:
Sign Up → Email Verification → Login → Chat
Login → Password Reset → Update Password → Chat
      → Chat (direct access if authenticated)

Error Handling:
Any Protected Route → Auth Error → Login → Chat
Chat → Conversation Not Found → New Chat
Documents → Upload Error → Documents (retry)
```
