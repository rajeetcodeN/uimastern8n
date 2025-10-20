# NOSTA AI - Configuration & Troubleshooting Guide

## 🔧 Configuration Management

This guide explains how to easily change webhook URLs, database settings, and other configurations in the NOSTA AI application.

---

## 📋 Quick Configuration Overview

### Current Default Settings
- **n8n Webhook**: `https://ssvautomate.app.n8n.cloud/webhook/03c4b591-d635-40ec-82b6-ffa42edda35f`
- **Supabase URL**: `https://ttlghsiujpokoohkhgli.supabase.co`
- **Database Table**: `n8n_metadata`
- **Environment File**: `.env` (create from `env.example`)

---

## 🔗 Changing n8n Webhook URL

### Method 1: Settings Modal (Easiest - No Code Changes)

**Step-by-Step:**
1. Open the RAG Assistant application
2. Look for the **Settings** button in the left sidebar
3. Click on **Settings**
4. In the modal that opens, find the **n8n Webhook URL** field
5. Replace the current URL with your new webhook URL
6. Click **Save Settings**
7. Changes take effect immediately - no restart needed

**Example:**
```
Current: https://ssvautomate.app.n8n.cloud/webhook/03c4b591-d635-40ec-82b6-ffa42edda35f
New:     https://your-new-n8n-instance.com/webhook/your-new-endpoint
```

### Method 2: Environment Variables (Recommended for Production)

**Step-by-Step:**
1. Open your project folder in a text editor
2. Find the `.env` file (if it doesn't exist, copy `env.example` to `.env`)
3. Add or update this line:
   ```env
   VITE_N8N_WEBHOOK_URL=https://your-new-n8n-instance.com/webhook/your-new-endpoint
   ```
4. Save the file
5. Restart the development server:
   ```bash
   npm run dev
   ```

### Method 3: Direct Code Change (Quick Fix)

**Step-by-Step:**
1. Open `src/components/SettingsModal.tsx` in your code editor
2. Find line 22 (around the `useState` hook)
3. Replace the default URL in the `useState` call:
   ```typescript
   const [tempUrl, setTempUrl] = useState(webhookUrl || "https://your-new-webhook-url");
   ```
4. Save the file
5. The change will apply automatically (Hot Module Replacement)

---

## 🗄️ Changing Supabase Database Settings

### Changing Supabase Project URL and API Key

**Step-by-Step:**
1. Open your `.env` file
2. Update these lines with your new Supabase project details:
   ```env
   VITE_SUPABASE_URL=https://your-new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_new_anon_key_here
   ```
3. Save the file
4. Restart the development server:
   ```bash
   npm run dev
   ```

### Changing Database Table Name

**Step-by-Step:**
1. Open `src/lib/supabase.ts` in your code editor
2. Find all instances of `'n8n_metadata'` (there are 3 locations: lines 28, 64, and 90)
3. Replace each instance with your new table name:
   ```typescript
   // Line 28
   .from('your_new_table_name')
   
   // Line 64  
   .from('your_new_table_name')
   
   // Line 90
   .from('your_new_table_name')
   ```
4. Save the file
5. Restart the development server

**Alternative Method (Using Environment Variables):**
1. Add this line to your `.env` file:
   ```env
   VITE_SUPABASE_TABLE_NAME=your_new_table_name
   ```
2. Update `src/lib/supabase.ts` to use the environment variable:
   ```typescript
   const tableName = import.meta.env.VITE_SUPABASE_TABLE_NAME || 'n8n_metadata';
   
   // Then use tableName instead of hardcoded 'n8n_metadata'
   const { data, error } = await supabase
     .from(tableName)
     .select('*')
   ```

---

## 📁 Configuration Files Reference

### Key Files to Know:
```
📁 Your Project
├── 📄 .env                    # Environment variables (create from env.example)
├── 📄 env.example            # Template for environment variables
├── 📄 src/lib/supabase.ts    # Database configuration
├── 📄 src/lib/webhook.ts     # Webhook configuration
└── 📄 src/components/SettingsModal.tsx  # UI settings
```

### Environment Variables (.env file):
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_TABLE_NAME=your_table_name

# n8n Webhook Configuration
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/rag-chat
```

---

## 🚀 Deployment Configuration

### For Production Deployment:

**Step-by-Step:**
1. **Set Environment Variables** in your hosting platform:
   - Vercel: Go to Project Settings → Environment Variables
   - Netlify: Go to Site Settings → Environment Variables
   - Railway: Go to Project Settings → Variables

2. **Add these variables:**
   ```
   VITE_SUPABASE_URL=your_production_supabase_url
   VITE_SUPABASE_ANON_KEY=your_production_anon_key
   VITE_N8N_WEBHOOK_URL=your_production_webhook_url
   ```

3. **Redeploy** your application

---

## 🔍 Troubleshooting Common Issues

### Issue 1: Webhook Not Working
**Symptoms:** Messages not being sent to n8n
**Solutions:**
1. Check webhook URL in Settings modal
2. Verify n8n workflow is active
3. Check browser console for errors
4. Test webhook URL directly in browser

### Issue 2: Database Connection Failed
**Symptoms:** Documents not loading, "No documents found"
**Solutions:**
1. Verify Supabase URL and API key in `.env`
2. Check if table name is correct
3. Ensure Supabase project is active
4. Check browser console for connection errors

### Issue 3: Environment Variables Not Working
**Symptoms:** Changes in `.env` not taking effect
**Solutions:**
1. Restart development server: `npm run dev`
2. Check variable names start with `VITE_`
3. Ensure `.env` file is in project root
4. Clear browser cache

### Issue 4: Settings Modal Not Saving
**Symptoms:** Settings changes not persisting
**Solutions:**
1. Check browser console for errors
2. Verify webhook URL format is correct
3. Try refreshing the page
4. Check if localStorage is enabled

---

## 📝 Quick Change Checklist

### For Webhook URL Changes:
- [ ] Use Settings Modal (easiest for testing)
- [ ] Or update `.env` file with `VITE_N8N_WEBHOOK_URL`
- [ ] Restart server if using `.env`
- [ ] Test by sending a message

### For Database Changes:
- [ ] Update `.env` with new `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Change table name in `src/lib/supabase.ts` (3 locations)
- [ ] Restart server
- [ ] Test by loading documents

### For Production Deployment:
- [ ] Set environment variables in hosting platform
- [ ] Remove any hardcoded URLs from code
- [ ] Test all functionality after deployment
- [ ] Monitor console for errors

---

## 🎯 Best Practices

1. **Development**: Use Settings Modal for quick testing
2. **Production**: Always use environment variables
3. **Security**: Never commit `.env` file to version control
4. **Testing**: Test changes in development before deploying
5. **Backup**: Keep a backup of working configurations
6. **Documentation**: Update this guide when making changes

---

## 📞 Support

If you encounter issues not covered in this guide:
1. Check browser console for error messages
2. Verify all URLs and keys are correct
3. Test with a simple webhook/database connection
4. Check n8n workflow logs
5. Check Supabase dashboard for connection status

---

*Last Updated: January 2025*
*Version: 1.0*
