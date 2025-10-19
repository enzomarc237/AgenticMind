# AgenticMind Authentication Setup Guide

This guide will help you set up user authentication for AgenticMind using Supabase.

## What Has Been Implemented

AgenticMind now includes a complete authentication system with the following features:

### Core Features
- ✅ Email/password authentication (sign up, sign in, password reset)
- ✅ User profiles and session management
- ✅ Conversation history persistence across devices
- ✅ Search and filter conversations
- ✅ Favorite and archive conversations
- ✅ Guest mode (try before signup)
- ✅ Automatic conversation saving
- ✅ Collapsible sidebar with conversation list
- ✅ Row-level security (users can only access their own data)

### Architecture
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Frontend**: React with TypeScript
- **State Management**: React Context API
- **Database Tables**: 7 tables (user_profiles, user_settings, conversations, messages, folders, tags, conversation_tags)

## Setup Instructions

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Fill in the details:
   - **Project Name**: `agenticmind` (or your choice)
   - **Database Password**: Choose a strong password and save it securely
   - **Region**: Select the region closest to your users
4. Wait 2-3 minutes for the project to be provisioned

### Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**: `https://[your-project-ref].supabase.co`
   - **anon public key**: A long JWT token

### Step 3: Set Up Environment Variables

1. In the `AgenticMind` directory, create a `.env.local` file:

```bash
# Gemini AI API Key (existing)
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration (new)
VITE_SUPABASE_URL=https://[your-project-ref].supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace the placeholders with your actual values from Step 2

### Step 4: Set Up the Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Execute the SQL files in this order:

#### 4.1: Create Tables
Copy and paste the contents of `supabase/schema.sql` into the SQL Editor and run it.

#### 4.2: Enable Row Level Security
Copy and paste the contents of `supabase/rls.sql` into the SQL Editor and run it.

#### 4.3: Create Functions and Triggers
Copy and paste the contents of `supabase/functions.sql` into the SQL Editor and run it.

**Verify**: Go to **Table Editor** in Supabase. You should see 7 new tables:
- user_profiles
- user_settings
- folders
- tags
- conversations
- messages
- conversation_tags

### Step 5: Configure Authentication

1. In Supabase, go to **Authentication** → **Settings**
2. Configure email authentication:
   - **Enable Email Provider**: Should be enabled by default
   - **Confirm Email**: Enable "Require email confirmation"
   - **Secure Email Change**: Enable for security

3. Set redirect URLs:
   - Go to **Authentication** → **URL Configuration**
   - Add these redirect URLs:
     - Development: `http://localhost:5173`
     - Production: Your deployed domain (e.g., `https://agenticmind.app`)

4. Configure email delivery:
   - **Development**: Use Supabase's default SMTP (limited rate)
   - **Production**: Set up custom SMTP (recommended)
     - Go to **Settings** → **Auth** → **SMTP Settings**
     - Add your SMTP provider details (SendGrid, AWS SES, Mailgun, etc.)

### Step 6: Install Dependencies and Run

1. Install the new Supabase dependency (already done):
```bash
cd AgenticMind
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

## Testing the Authentication System

### Test User Registration
1. Click "Sign In" button in the header
2. Click "Sign up" to create an account
3. Enter your email and a strong password
4. Check your email for the confirmation link
5. Click the confirmation link
6. Sign in with your credentials

### Test Conversation Management
1. After signing in, create a new conversation using the "New Conversation" button
2. Send a message using one of the agentic patterns
3. The conversation and messages are automatically saved
4. Refresh the page - your conversation persists
5. Create multiple conversations and switch between them
6. Try searching, favoriting, and archiving conversations

### Test Guest Mode
1. Sign out or open in incognito mode
2. You can still use all AI features
3. Conversations are not saved (lost on refresh)
4. A banner prompts you to sign in to save data

## Database Schema Overview

### Core Tables

**user_profiles**
- Extended user information beyond Supabase's auth.users
- Links to all user data

**user_settings**
- Stores theme preferences, AI parameters, pattern-specific settings
- One record per user with defaults

**conversations**
- Conversation metadata (title, pattern, timestamps)
- Links to messages, folders, and tags
- Supports favorite and archive features

**messages**
- Individual messages within conversations
- Stores role (user/assistant), content, and metadata

**folders** (optional feature)
- Organize conversations into folders
- Support custom colors and ordering

**tags** (optional feature)
- Tag conversations for categorization
- Many-to-many relationship via conversation_tags

### Security

All tables have Row Level Security (RLS) enabled:
- Users can only access their own data
- Enforced at the database level
- Prevents data leaks even with application bugs

## Environment-Specific Configuration

### Development
- Uses `.env.local` for environment variables
- Supabase URL points to your dev project
- Uses Supabase default SMTP for emails

### Production

1. Set environment variables in your hosting platform:
   - Vercel: Project Settings → Environment Variables
   - Netlify: Site Settings → Environment Variables
   - Self-hosted: Use system environment variables

2. Update Supabase redirect URLs to include production domain

3. Configure custom SMTP for reliable email delivery:
   - Recommended: SendGrid, AWS SES, or Mailgun
   - Add credentials in Supabase dashboard

4. Verify RLS policies are working:
   - Test that users can't access other users' data
   - Test unauthenticated access is blocked

## Troubleshooting

### "Missing Supabase environment variables" error
- Ensure `.env.local` exists in the AgenticMind directory
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
- Restart the dev server after changing .env.local

### Sign up doesn't work
- Check Supabase SQL Editor for errors in schema.sql execution
- Verify the `auto_create_user_profile()` trigger exists
- Check browser console for error messages

### Emails not received
- **Development**: Check spam folder, Supabase default SMTP is slow
- **Production**: Configure custom SMTP in Supabase dashboard
- Verify redirect URLs are correctly set in Supabase

### Conversations not saving
- Check browser console for errors
- Verify all RLS policies are created (run rls.sql)
- Check that user is authenticated (Header shows user email)

### Database errors
- Verify all three SQL files were executed successfully
- Check **Supabase → Table Editor** to confirm tables exist
- Review **Supabase → Logs** for detailed error messages

## File Structure

```
AgenticMind/
├── .env.local                    # Environment variables (create this)
├── .env.example                  # Environment variable template
├── lib/
│   └── supabaseClient.ts         # Supabase client initialization
├── contexts/
│   ├── AuthContext.tsx           # Authentication state management
│   └── ConversationContext.tsx   # Conversation state management
├── components/
│   ├── AuthModal.tsx             # Sign in/sign up modal
│   ├── PasswordResetModal.tsx    # Password reset modal
│   ├── ConversationSidebar.tsx   # Conversation list sidebar
│   ├── ConversationListItem.tsx  # Individual conversation display
│   ├── ContextMenu.tsx           # Right-click context menu
│   ├── GuestBanner.tsx           # Guest mode notification
│   └── Header.tsx                # Updated with auth UI
├── services/
│   ├── conversationService.ts    # Conversation database operations
│   ├── folderService.ts          # Folder database operations
│   ├── tagService.ts             # Tag database operations
│   └── settingsService.ts        # Settings database operations
├── utils/
│   └── validation.ts             # Form validation utilities
├── hooks/
│   └── useAuth.ts                # Authentication hook
└── supabase/
    ├── schema.sql                # Database table definitions
    ├── rls.sql                   # Row Level Security policies
    └── functions.sql             # Database functions and triggers
```

## Next Steps (Optional Enhancements)

The core authentication system is complete. You can optionally add:

1. **Folder Management UI**: Create modals to manage folders
2. **Tag Management UI**: Create modals to manage tags
3. **Drag-and-Drop**: Move conversations between folders
4. **Settings Persistence**: Save user settings to database
5. **Social Auth**: Add Google/GitHub OAuth providers
6. **Profile Pictures**: Upload and display user avatars

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review implementation in planning.md and research.md
- Check browser console and Supabase logs for errors

## Summary

You now have a fully functional authentication system with:
- User accounts and session management
- Conversation persistence across devices
- Secure data access with RLS
- Guest mode for trial users
- Complete conversation management UI

The system is production-ready and can be deployed immediately after following these setup steps.
