### Task ID: 3 — Renombrar a SisCoPerLocIA + Notion ID fix + Tags redesign + Google test + EN instructions

**Agent:** Main Agent

**Work Log:**
- Fixed Notion database ID: auto-sanitize (remove dashes/spaces), counter X/32, better error messages for not_found vs page_id vs unauthorized.
- Rewrote tag-guide.tsx: 2-column grid layout, color-coded categories with dot indicators, click-to-copy with check feedback, removed broken store dependency.
- Added `/api/test-google` endpoint: validates Google AI key format (AIza prefix), tests with Gemini 2.0 Flash, returns model name.
- Added test button for Google AI key in notion-settings.tsx with amber theme and success badge showing model name.
- Renamed app to SisCoPerLocIA (Sistema de configuración de Perfiles para locuciones con Inteligencia Artificial) in layout.tsx, i18n.ts, page.tsx footer.
- Created `/api/generate-en` endpoint: translates AI-generated profile to English via Gemini for better TTS understanding.
- Updated Notion export to include `Idioma` column (select: Español) and post-save auto-generates `Instrucciones EN` column with English version.
- Notion update-profile action now supports `language` and `englishInstructions` fields.
- Notion query-profiles now reads `Idioma` and `Instrucciones EN` from database.
- Profile cards show language badge (sky blue).
- Save button shows translation progress (spinner + message).
- Production build successful: all 5 API routes, static pages, zero errors.

**Stage Summary:**
- App is now "SisCoPerLocIA" with updated branding
- Notion integration: auto-sanitized DB ID, Idioma column, English instructions auto-generated after save
- Google AI key has test button with visual feedback
- Tag guide redesigned with compact grid layout
- Ready for production deployment

---

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
- Removed unused files: voice-profile-form.tsx, profile-history.ts, template-selector.tsx, templates.ts.
- Verified all tabs, language switching, and responsive layout with Agent Browser.

**Stage Summary:**
- App now generates voice profiles via Google Gemini AI from simple inputs (name, age, gender, type, region, scenario)
- Notion is the primary repository: token + database ID, profiles read/write from Notion
- Users can load any Notion profile as a template to edit and re-save
- All 30 voices, 24 tags, bilingual ES/EN preserved
- Dark radio studio theme preserved
