# Google Docs Integration: Architecture & UX Proposal

## Overview

This document proposes an architecture for integrating Google Docs with Tiles, enabling users to:
1. **Insert Google Docs as link cards** with rich metadata
2. **Use Google Docs content as context** for AI features (summaries, transformations, Q&A)
3. **Import Google Docs content** as native Tiles content (future consideration)

## Background & Existing Infrastructure

### Current OAuth Implementation
Tiles already has Google OAuth for authentication (`packages/web/src/auth/google.ts`) using:
- PKCE flow with state, verifier, and nonce validation
- Scopes: `openid`, `profile`, `email`
- JWT verification from Google's JWKS endpoint

### Current AI Context System
The AI system (`packages/api/src/ai/`) supports:
- Passing arbitrary text context via `context.text`
- Passing tile content via `context.tileIds` (converted to markdown)
- Streaming responses with tool calling

### Current Link System
Links (`packages/api/src/routes/links/`) support:
- Metadata extraction (title, description, image) from URLs
- Creating link tiles with preview cards

---

## Proposed Architecture

### 1. OAuth Scope Extension

**New Scopes Required:**
```
https://www.googleapis.com/auth/drive.file      // Non-sensitive, per-file access
https://www.googleapis.com/auth/documents.readonly  // Read document content
```

**Approach: Incremental Authorization**

Rather than requesting Drive/Docs scopes at sign-in, use incremental authorization:
1. User signs in with basic scopes (current behavior)
2. When user wants to connect Google Docs, trigger a secondary OAuth flow requesting additional scopes
3. Store the additional access token and refresh token separately

**Benefits:**
- Users aren't scared off by broad permissions at sign-in
- Follows Google's best practice of requesting minimal scopes
- `drive.file` scope is non-sensitive (simpler verification process)

### 2. Token Storage

**New Database Model:**

```prisma
model ExternalConnection {
  id           String   @id @default(uuid()) @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  userId       String   @map("user_id") @db.Uuid
  provider     String   // "google_drive"
  accessToken  String   @map("access_token")  // Encrypted
  refreshToken String?  @map("refresh_token") // Encrypted
  expiresAt    DateTime? @map("expires_at")
  scopes       String[] // Granted scopes

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@map("external_connections")
}
```

**Security Considerations:**
- Encrypt tokens at rest using a separate encryption key
- Use refresh tokens to minimize stored access token lifetime
- Implement token revocation endpoint for users to disconnect

### 3. Google Drive Picker Integration

**Frontend Component:**

Use the official `@googleworkspace/drive-picker-element` web component, which:
- Is framework-agnostic (works with Tiles' custom JSX runtime)
- Handles OAuth token management
- Provides native file selection UI
- Supports filtering by MIME type (Google Docs only)

**Implementation:**

```typescript
// packages/web/src/elements/google-drive-picker.ts
class GoogleDrivePicker extends HTMLElement {
  // Configuration
  private clientId = process.env.GOOGLE_CLIENT_ID;
  private appId = process.env.GOOGLE_APP_ID;

  // Events emitted:
  // - 'document-selected': { id, name, url, mimeType }
  // - 'picker-cancelled'
}
```

**Picker Configuration:**
```typescript
{
  viewId: 'DOCS',  // Show only Google Docs
  mimeTypes: 'application/vnd.google-apps.document',
  selectMode: 'SINGLE' | 'MULTIPLE',
  showUploadFolders: false,
}
```

### 4. Document Content Fetching

**API Route:**

```typescript
// packages/api/src/routes/googleDocs/googleDocs.ts
export const googleDocsRouter = router({
  // Fetch document content for AI context
  getDocumentContent: authenticatedProcedure
    .input(z.object({ documentId: z.string() }))
    .query(async ({ ctx, input }) => {
      const connection = await getGoogleConnection(ctx.userId);
      const content = await fetchGoogleDocContent(
        connection.accessToken,
        input.documentId
      );
      return { content, title: content.title };
    }),

  // Create a link tile from a Google Doc
  createDocumentLink: authenticatedPageProcedure
    .input(z.object({
      documentId: z.string(),
      pageId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Fetch metadata and create link tile
    }),
});
```

**Google Docs API Client:**

```typescript
// packages/api/src/services/googleDocs.ts
import { google } from 'googleapis';

export async function fetchGoogleDocContent(
  accessToken: string,
  documentId: string
): Promise<DocumentContent> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const docs = google.docs({ version: 'v1', auth });
  const response = await docs.documents.get({ documentId });

  return {
    title: response.data.title,
    content: extractTextContent(response.data.body),
    // Preserve structure for rich conversion
    structure: response.data.body,
  };
}

function extractTextContent(body: docs_v1.Schema$Body): string {
  // Convert Google Docs structure to markdown
  // Handle: paragraphs, headings, lists, tables, images
}
```

### 5. AI Context Integration

**Extend Context Schema:**

```typescript
// packages/api/src/routes/ai/schema.ts
export const writeSchema = z.object({
  pageId: z.string(),
  sectionId: z.string().optional(),
  prompt: z.string(),
  context: z.object({
    text: z.string().optional(),
    tileIds: z.array(z.string()).optional(),
    // New: Google Docs context
    googleDocs: z.array(z.object({
      documentId: z.string(),
      // Optional: specific sections/ranges
      range: z.object({
        startIndex: z.number(),
        endIndex: z.number(),
      }).optional(),
    })).optional(),
  }).optional(),
});
```

**Context Assembly:**

```typescript
// packages/api/src/ai/context/googleDocs.ts
export async function formatGoogleDocsContext(
  userId: string,
  docs: GoogleDocReference[]
): Promise<string> {
  const sections: string[] = [];

  for (const doc of docs) {
    const content = await fetchGoogleDocContent(userId, doc.documentId);
    sections.push(`## ${content.title}\n\n${content.content}`);
  }

  return `The following Google Docs are provided as context:\n\n${sections.join('\n\n---\n\n')}`;
}
```

---

## User Experience Design

### UX Flow 1: Connecting Google Drive

```
┌─────────────────────────────────────────────────────────────┐
│  Settings > Integrations                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Google Drive                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📄 Connect your Google Drive to insert docs        │   │
│  │     and use them as context for AI features.        │   │
│  │                                                      │   │
│  │  [Connect Google Drive]                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**After Connection:**
```
┌─────────────────────────────────────────────────────────────┐
│  Google Drive                                    Connected  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✓ Connected as user@gmail.com                      │   │
│  │                                                      │   │
│  │  [Disconnect]                                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### UX Flow 2: Inserting a Google Doc Link

**Entry Point: Insert Menu or Slash Command**

```
┌──────────────────────┐
│  + Insert            │
├──────────────────────┤
│  📝 Text             │
│  🖼️ Image            │
│  🔗 Link             │
│  📊 Table            │
│  ────────────────    │
│  📄 Google Doc    →  │  ← Opens Google Picker
└──────────────────────┘
```

**Google Picker Opens:**
- Native Google Drive picker UI
- Filtered to show only Google Docs
- User selects document(s)

**Result: Link Tile Created**
```
┌─────────────────────────────────────────────────────┐
│  📄 Project Proposal                                │
│  Last edited 2 days ago                             │
│  docs.google.com                                    │
└─────────────────────────────────────────────────────┘
```

The link tile includes:
- Document title (from Google Docs API)
- Last modified date
- Thumbnail/icon
- Click opens in Google Docs

### UX Flow 3: Using Google Doc as AI Context

**Scenario A: Quick Action on Link Tile**

When a Google Doc link tile is selected, show contextual actions:

```
┌─────────────────────────────────────────────────────┐
│  📄 Project Proposal                    [Selected]  │
├─────────────────────────────────────────────────────┤
│  🤖 Summarize  │  📋 Extract key points  │  ✨ More │
└─────────────────────────────────────────────────────┘
```

Clicking "Summarize" would:
1. Fetch the document content
2. Pass to AI with a summarization prompt
3. Insert the summary as a new text tile

**Scenario B: AI Prompt with Document Selection**

In the AI prompt dialog, allow selecting Google Docs as context:

```
┌─────────────────────────────────────────────────────────────┐
│  ✨ AI Assistant                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Context:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [+ Add from page]  [+ Add Google Doc]               │   │
│  │                                                      │   │
│  │ 📄 Project Proposal                          [×]    │   │
│  │ 📄 Meeting Notes - Jan 2025                  [×]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Prompt:                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Create a presentation summarizing the key           │   │
│  │ decisions from these documents...                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                                        [Cancel] [Generate]  │
└─────────────────────────────────────────────────────────────┘
```

**Scenario C: Slash Command**

Support slash commands in the editor:

```
/google-doc [opens picker]
/summarize-doc [opens picker, then summarizes]
```

### UX Flow 4: Connection Not Available

If user tries to use Google Docs without connecting:

```
┌─────────────────────────────────────────────────────────────┐
│  Connect Google Drive                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  To insert Google Docs, you'll need to connect your         │
│  Google Drive account.                                      │
│                                                             │
│  Tiles will be able to:                                     │
│  • Access documents you select                              │
│  • Read document content for AI features                    │
│                                                             │
│  Tiles will NOT:                                            │
│  • Access other files in your Drive                         │
│  • Modify any documents                                     │
│                                                             │
│                                [Cancel] [Connect with Google]│
└─────────────────────────────────────────────────────────────┘
```

---

## Technical Implementation Plan

### Phase 1: Foundation
1. **Database**: Add `ExternalConnection` model
2. **OAuth**: Implement incremental authorization flow
3. **Token management**: Secure storage, refresh handling
4. **Settings UI**: Connection management page

### Phase 2: Document Access
1. **Google Docs API client**: Fetch document content
2. **Content conversion**: Google Docs JSON → Markdown
3. **Google Drive Picker**: Integrate web component
4. **Link creation**: Create link tiles from selected docs

### Phase 3: AI Integration
1. **Context extension**: Support Google Docs in AI context
2. **Quick actions**: Summarize, extract, transform actions on doc links
3. **Prompt dialog**: Add document selection to AI prompt UI
4. **Slash commands**: `/google-doc`, `/summarize-doc`

### Phase 4: Polish & Extras
1. **Caching**: Cache document content with TTL
2. **Permissions handling**: Graceful handling of access revocation
3. **Rich previews**: Better link card previews with doc thumbnails
4. **Multi-select**: Support selecting multiple docs at once

---

## API Surface Summary

### New tRPC Routes

```typescript
// Connection management
integrations.connectGoogle()      // Initiate OAuth flow
integrations.disconnectGoogle()   // Revoke and delete tokens
integrations.getConnections()     // List connected services

// Google Docs operations
googleDocs.getDocument({ documentId })           // Fetch content
googleDocs.createLink({ documentId, pageId })    // Create link tile
googleDocs.searchDocuments({ query })            // Search user's docs (optional)
```

### New Frontend Components

```typescript
// Settings
<IntegrationsSettings />          // Manage connections
<GoogleDriveConnection />         // Connect/disconnect UI

// Document selection
<GoogleDrivePicker />             // Native picker wrapper
<DocumentSelector />              // Multi-doc selection for AI

// AI integration
<AIPromptDialog />                // Extended with doc selection
<DocumentQuickActions />          // Actions on doc link tiles
```

---

## Security Considerations

1. **Minimal Scopes**: Use `drive.file` (per-file access) rather than broad Drive access
2. **Token Encryption**: Encrypt access/refresh tokens at rest
3. **Token Refresh**: Implement automatic refresh before expiration
4. **Revocation**: Support user-initiated disconnection with proper cleanup
5. **Content Handling**: Sanitize document content before rendering or passing to AI
6. **Rate Limiting**: Implement rate limits on document fetching
7. **Audit Logging**: Log document access for compliance

---

## Open Questions

1. **Offline access**: Should we request offline access (refresh tokens) or require re-auth periodically?
   - Recommendation: Use refresh tokens for better UX

2. **Document caching**: How long should we cache document content?
   - Recommendation: 5-minute TTL with manual refresh option

3. **Workspace vs User connections**: Should connections be per-user or per-workspace?
   - Recommendation: Per-user (personal Drive access)

4. **Import vs Link**: Should we support full document import (converting to native tiles)?
   - Recommendation: Start with links only, consider import as future enhancement

5. **Real-time sync**: Should we detect document changes and update link metadata?
   - Recommendation: Out of scope for initial implementation

---

## References

- [Google Docs API Scopes](https://developers.google.com/workspace/docs/api/auth)
- [Google Drive Picker](https://developers.google.com/workspace/drive/picker/guides/overview)
- [Drive Picker Web Component](https://github.com/googleworkspace/drive-picker-element)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
