# Teople Project - Deployment Fix Documentation

## Project Overview
- Frontend: React + Vite (GitHub: jaidsutar786/Teople)
- Backend: Django REST Framework (GitHub: jaidsutar786/teople-backend)
- Database: PostgreSQL
- Hosting: Render.com (Free Plan)

---

## Issues Fixed & Changes Made

### 1. Frontend - API URL Fix
**Problem:** `axios` calls hardcoded `http://127.0.0.1:8000` — production mein kaam nahi karta.

**Files Changed:**
- `src/api.js` — `baseURL` ko `import.meta.env.VITE_API_URL` se lene ke liye update kiya
- `.env` file create ki

**Changes in api.js:**
```js
// Before
const api = axios.create({ baseURL: "http://127.0.0.1:8000/api" });

// After
const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const api = axios.create({ baseURL: `${API_BASE}/api` });
```

**`.env` file:**
```
VITE_API_URL=https://teople-backend-1.onrender.com
```

**Render Frontend Environment Variable:**
- Key: `VITE_API_URL`
- Value: `https://teople-backend-1.onrender.com`

---

### 2. Backend - CORS Fix
**Problem:** Frontend `https://teople.onrender.com` backend se blocked thi CORS policy ki wajah se.

**File Changed:** `manage/login_backend/settings.py`

```python
# Before
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
]

# After
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://teople.onrender.com",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "https://teople.onrender.com",
]
```

---

### 3. Backend - TEMPLATES Config Missing
**Problem:** Django admin ke liye `TEMPLATES` setting missing thi — `admin.E403` error aa raha tha.

**File Changed:** `manage/login_backend/settings.py`

```python
# Added
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]
```

---

### 4. Backend - Migration Fix (MySQL → PostgreSQL)
**Problem:** `0103_recreate_companyleave_saturdayoverride.py` migration mein MySQL syntax (backticks, AUTO_INCREMENT) use ho raha tha — PostgreSQL pe fail ho raha tha.

**File Changed:** `accounts/migrations/0103_recreate_companyleave_saturdayoverride.py`

```python
# Before (MySQL syntax - WRONG)
migrations.RunSQL(
    sql="""
        CREATE TABLE IF NOT EXISTS `company_leaves` (
            `id` bigint NOT NULL AUTO_INCREMENT PRIMARY KEY,
            ...
        );
    """
)

# After (PostgreSQL compatible)
migrations.CreateModel(
    name='CompanyLeave',
    fields=[...],
    options={'db_table': 'company_leaves'},
)
```

---

### 5. Backend - Corrupt Python Files Fix
**Problem:** `accounts/management/commands/__init__.py` mein null bytes the — Python import fail ho raha tha.

**Fix:** File ko empty content se recreate kiya.

---

### 6. Backend - create_admin Command
**Problem:** Admin user create karne ke liye Shell access nahi tha (Free plan).

**File Created:** `accounts/management/commands/create_admin.py`

```python
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        User = get_user_model()
        email = "admin@teople.com"
        password = "Admin@1234"
        username = "admin"
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(username=username, email=email, password=password)
            self.stdout.write(f"Superuser created: {email}")
        else:
            self.stdout.write("Superuser already exists")
```

---

### 7. Render Build Command
**Render → teople-backend-1 → Settings → Build Command:**

```
pip install -r requirements.txt && python manage.py makemigrations && python manage.py migrate && python manage.py create_admin
```

---

## Final Credentials

### Admin Login
- URL: https://teople.onrender.com
- Email: `admin@teople.com`
- Password: `Admin@1234`

### URLs
- Frontend: https://teople.onrender.com
- Backend API: https://teople-backend-1.onrender.com

---

## Important Notes

1. **Render Free Plan** — Service 15 minutes inactivity ke baad sleep ho jaati hai. Pehli request slow hogi.
2. **Database** — PostgreSQL use ho raha hai. MySQL syntax migrations mein use mat karo.
3. **Environment Variables** — `.env` file GitHub pe push hoti hai lekin Render pe manually bhi set karni padti hai.
4. **CORS** — Naya frontend domain add karne pe `settings.py` mein `CORS_ALLOWED_ORIGINS` update karna padega.
5. **Build Command** — Deploy ke baad Build Command wapas simple kar sakte ho:
   ```
   pip install -r requirements.txt && python manage.py migrate
   ```

---

## Git Repositories
- Frontend: https://github.com/jaidsutar786/Teople
- Backend: https://github.com/jaidsutar786/teople-backend
