# Stellarc Admin Panel - Setup Guide

## ✅ What's Been Configured

### 1. Database (RBAC System)
- ✅ `user_roles` table created with RLS policies
- ✅ Role enum: `admin`, `moderator`, `user`
- ✅ Security definer function to prevent infinite recursion
- ✅ Auto-assign 'user' role to new signups via trigger

### 2. Authentication
- ✅ Login functionality with admin role verification
- ✅ Signup functionality with email/password validation
- ✅ Auto-confirm email enabled (no email verification needed for testing)
- ✅ Session persistence and redirect handling

### 3. AI Agent Edge Function
- ✅ Authentication and authorization checks
- ✅ Role-based access (admin and user roles)
- ✅ OpenAI GPT-4o integration
- ✅ Logging to `automation_logs` table
- ✅ CORS enabled for web app calls

### 4. Security
- ✅ Row Level Security (RLS) enabled on all tables
- ✅ No linter warnings or security issues
- ✅ Proper role checking via security definer functions
- ✅ Protected routes and session validation

## 🚀 Getting Started

### Step 1: Create Your First Admin Account

1. Go to `/admin` route
2. Click the **"Sign Up"** tab
3. Enter your email and password (min 6 characters)
4. Click "Create Account"

### Step 2: Grant Admin Role

After signup, you need to grant yourself admin privileges:

#### Option A: Via Backend (Recommended)
1. Go to your backend dashboard
2. Navigate to **Database → user_roles table**
3. Click "Insert row"
4. Fill in:
   - `user_id`: Your user UUID (from auth.users table)
   - `role`: Select `admin`
5. Save

#### Option B: Via SQL (Advanced)
Run this query in the SQL editor:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com';
```

### Step 3: Login to Admin Panel

1. Go back to `/admin`
2. Click the **"Login"** tab
3. Enter your credentials
4. Access granted to `/admin/panel`

## 📋 Admin Panel Features

### AI Agent Tab
- Send prompts to the AI agent
- View AI responses in real-time
- Track task execution and logs

### Files Tab
- Upload files to secure storage
- View uploaded file metadata
- Delete files as needed

### APIs Tab
- Placeholder for future API integrations

### Content Tab
- Placeholder for content management

### Settings Tab
- Placeholder for system configuration

### Logs Section (Bottom)
- View recent automation logs
- Monitor task execution times
- Check for errors and status

## 🔐 Security Notes

1. **Never store roles on the user profile** - Roles are in a separate `user_roles` table
2. **RLS is enabled** - All tables have proper Row Level Security policies
3. **Admin checks are server-side** - Role verification happens via secure functions
4. **Sessions are persistent** - Auth state is maintained via Supabase client

## 🛠️ Troubleshooting

### "Access denied: Admin privileges required"
- Ensure you've inserted an admin role for your user in the `user_roles` table
- Check that the user_id matches your authenticated user ID

### "Authentication required"
- Make sure you're logged in
- Session may have expired - try logging in again

### Edge function errors
- Verify `OPENAI_API_KEY` is set in secrets
- Check edge function logs for detailed errors
- Ensure user has 'admin' or 'user' role in `user_roles` table

## 📊 Database Schema

### user_roles table
- `id` (uuid, primary key)
- `user_id` (uuid, references auth.users)
- `role` (app_role enum: admin/moderator/user)
- `created_at` (timestamp)

### automation_logs table
- `id` (uuid, primary key)
- `user_id` (uuid)
- `task_type` (text)
- `status` (text)
- `input_data` (jsonb)
- `output_data` (jsonb)
- `error_message` (text)
- `execution_time_ms` (integer)
- `model_used` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

### file_metadata table
- `id` (uuid, primary key)
- `user_id` (uuid)
- `file_name` (text)
- `file_path` (text)
- `file_size` (bigint)
- `mime_type` (text)
- `bucket_id` (text, default: 'agent-files')
- `created_at` (timestamp)

## ✨ Next Steps

1. Create your admin account via signup
2. Grant yourself admin role via backend
3. Login and access the admin panel
4. Start using the AI agent and file management features
5. Monitor logs and automations

## 🔗 Important Routes

- `/` - Homepage
- `/admin` - Login/Signup page
- `/admin/panel` - Admin dashboard (requires admin role)
- All other routes redirect to `/admin` if not authenticated

---

**Status**: ✅ All systems operational and secure!
