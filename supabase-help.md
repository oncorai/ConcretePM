# Supabase Connection String Location

## Visual Guide:

1. After logging into Supabase (https://app.supabase.com), you should see your project

2. Click on your project to enter it

3. Look for these in order:

### Option A - Direct Path:
```
Settings (gear icon) → Database → Connection string → URI tab
```

### Option B - From Project Home:
```
Home → Connect button → Choose "App Frameworks" → Prisma
```

## The connection string format:

Your connection string should look like one of these:

### Standard format:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Transaction mode (recommended for Prisma):
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true
```

## If you can't find your password:

The password is the one you created when you first set up the project. If you forgot it:
1. Go to Settings → Database
2. Under "Database password" section, click "Reset database password"
3. Create a new password
4. Use this new password in your connection string

## Example:
If your:
- Project reference is: `abcdefghijklmnop`
- Password is: `MySecurePass123!`
- Region is: `us-west-1`

Your connection string would be:
```
postgresql://postgres.abcdefghijklmnop:MySecurePass123!@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```