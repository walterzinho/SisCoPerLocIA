### Task ID: 2 — Refactorización: IA Generation + Notion como repositorio

**Agent:** Main Agent

**Work Log:**
- Created `/api/generate` route: sends structured prompt to Gemini 2.0 Flash with system instructions, voice list, tag catalog, and pace options. Returns parsed JSON profile.
- Rewrote `/api/notion` route: 5 actions (test token, test database, query profiles, export profile, update profile). Reads profiles FROM Notion with rich_text/title/select/number property extraction.
- Rewrote `i18n.ts` with new translation keys for AI form (name, age, gender, profileType, region, scenario, additional), Notion settings (token + databaseId), and profiles tab.
- Rewrote `store.ts` with simplified state: aiInput (7 fields), aiGenerated result, showEditor toggle, Notion profiles from API, editingPageId for updates.
- Created `ai-profile-creator.tsx`: two-phase UI — (1) simple input form with AI generation button, (2) full editable profile editor with suggested tags, voice rationale, save to Notion.
- Created `notion-profiles.tsx`: loads profiles from Notion database, displays as cards with Load as Template / Edit / Open in Notion actions.
- Updated `notion-settings.tsx`: Token + Database ID with separate Test Token and Test Database buttons.
- Updated `page.tsx`: 4 tabs (Crear con IA, Perfiles Notion, Guía de Etiquetas, Configuración).
- Removed unused files: voice-profile-form.tsx, profile-history.tsx, template-selector.tsx, templates.ts.
- Verified all tabs, language switching, and responsive layout with Agent Browser.

**Stage Summary:**
- App now generates voice profiles via Google Gemini AI from simple inputs (name, age, gender, type, region, scenario)
- Notion is the primary repository: token + database ID, profiles read/write from Notion
- Users can load any Notion profile as a template to edit and re-save
- All 30 voices, 24 tags, bilingual ES/EN preserved
- Dark radio studio theme preserved
