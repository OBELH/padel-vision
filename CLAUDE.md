# Padel Vision — Contexte Projet

## Vision
Application SaaS B2B2C d'analyse de matchs de padel via les caméras installées dans les clubs. L'objectif est de générer des highlights viraux (smashes, aces, lobs) que les joueurs partagent sur les réseaux sociaux.

## Architecture

```
Padel/
├── apps/
│   ├── api/          → FastAPI (Python 3.12) — port 8000
│   ├── web/          → Next.js 14 App Router — port 3000
│   └── mobile/       → Expo React Native (tabs)
├── packages/
│   └── shared/       → Types TypeScript partagés
├── docker-compose.yml → PostgreSQL 16 + Redis 7 (pas utilisé, on est sur SQLite)
└── .claude/
    └── launch.json   → Config dev servers pour Claude Preview
```

## Stack technique

| Couche | Techno | Notes |
|--------|--------|-------|
| Frontend | Next.js 14, Tailwind, shadcn/ui | App Router, server/client components |
| Backend | FastAPI, SQLAlchemy, Pydantic v2 | UUID PKs, dependency injection |
| DB (dev) | SQLite | `check_same_thread=False` |
| DB (prod) | PostgreSQL 16 | Via docker-compose |
| Mobile | Expo React Native | Tabs: Home, Matches, Profile |
| Vidéo | FFmpeg (subprocess) | Extraction clips + thumbnails |
| Fichiers | Local filesystem (`apps/api/uploads/`) | Servi via StaticFiles |
| FFmpeg path | Auto-détecté via `_ffmpeg_bin()` | Cherche PATH puis WinGet |

## Modèles de données (apps/api/models/)

- **Club** — id, name, address, city, country, logo_url
- **Player** — id, name, nickname, email, level (beginner/intermediate/advanced/pro), avatar_url, club_id
- **Match** — id, club_id, date, duration_minutes, score, status, video_path
- **MatchPlayer** — id, match_id, player_id, team (A/B), position (1/2)
- **Highlight** — id, match_id, player_id, type (smash/ace/lob/point_gagnant), timestamp_seconds, description, video_url, thumbnail_url
- **User** — id, email, hashed_password, full_name, role (player/club_admin/admin), is_active, player_id?, club_id?

## API Endpoints (apps/api/routers/)

### Clubs (`/api/clubs/`)
- `GET /` — liste clubs
- `POST /` — créer club
- `GET /{id}` — détail club
- `GET /{id}/stats` — stats (nb matchs, nb joueurs)

### Players (`/api/players/`)
- `GET /` — liste joueurs (filtre `?club_id=`)
- `POST /` — créer joueur
- `GET /{id}` — détail joueur
- `GET /{id}/stats` — stats (win_rate, matchs, highlights par type, matchs récents)

### Matches (`/api/matches/`)
- `GET /` — liste matchs (filtre `?club_id=`)
- `POST /` — créer match
- `GET /{id}` — détail match avec match_players
- `POST /{id}/upload-video` — upload vidéo MP4 (multipart)
- `POST /{id}/generate-clips` — FFmpeg génère clips + thumbnails
- `GET /{id}/video-status` — nb clips générés

### Auth (`/api/auth/`)
- `POST /register` — inscription (email, password, full_name) → token + user
- `POST /login` — connexion (email, password) → token + user
- `GET /me` — utilisateur courant (requiert Bearer token)

### Highlights (`/api/matches/{match_id}/highlights/`)
- `GET /` — liste highlights du match
- `POST /` — créer highlight
- `DELETE /api/highlights/{id}` — supprimer highlight
- `GET /api/highlights/{id}/share` — données partage (URLs résolues, contexte match, joueurs)

## Pages Frontend (apps/web/src/app/)

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, features, CTA |
| `/login` | Page connexion (JWT auth) |
| `/register` | Page inscription |
| `/dashboard/club` | Dashboard club — stats, matchs, joueurs |
| `/player/[id]` | Profil joueur — Match Card FIFA, stats, matchs récents |
| `/match/[id]` | Détail match — scoreboard, upload vidéo, lecteur, timeline highlights avec clips, OG meta tags |
| `/share/highlight/[id]` | Page partage highlight — lecteur plein écran, OG meta (image+video), bouton partage |
| `/player/[id]` | Profil joueur — Match Card FIFA, stats, matchs récents, bouton partage |
| `/dashboard/analytics` | Dashboard analytics — KPIs, bar charts 14j, top highlights/matchs |

## Seed Data (apps/api/seed.py)
- 2 clubs (Paris Padel Arena, Barcelona Padel Hub)
- 8 joueurs avec nicknames
- 5 matchs avec scores
- 20 match_players (4 par match)
- 10 highlights avec timestamps

## Dev Setup

### Prérequis
- Node.js (nvm4w)
- Python 3.12 (`C:\Users\obelhassine\AppData\Local\Programs\Python\Python312\python.exe`)
- FFmpeg installé et dans le PATH

### Lancer les serveurs
Les serveurs sont configurés dans `.claude/launch.json` pour Claude Preview.
```bash
# API
cd apps/api && pip install -r requirements.txt && python -m uvicorn main:app --reload --port 8000

# Web
cd apps/web && npm install && npx next dev

# Mobile
cd apps/mobile && npm install && npx expo start
```

### Seeder la base
```bash
cd apps/api && python seed.py
```

## Problèmes connus & solutions

| Problème | Solution |
|----------|----------|
| npm ENOENT dans launch.json | Utiliser `node` + `node_modules/next/dist/bin/next` |
| FastAPI 307 redirect casse CORS | `redirect_slashes=False` dans FastAPI + `apiFetch()` simplifié |
| SQLite `check_same_thread` | `connect_args={"check_same_thread": False}` |
| uvicorn reload crash Windows | Redémarrer le serveur |
| Preview screenshot timeout | Utiliser `preview_snapshot` à la place |

## Conventions de code

- **Backend** : routers → schemas → models → services (séparation claire)
- **Frontend** : composants dans `src/components/`, pages dans `src/app/`
- **API fetch** : via `apiFetch()` dans `src/lib/api.ts` (gère trailing slash)
- **Upload** : via `apiUpload()` dans `src/lib/api.ts` (multipart/form-data)
- **UUIDs** partout pour les PKs
- **Pydantic v2** : `ConfigDict(from_attributes=True)`

## Partage viral

### Architecture
- **`src/lib/share.ts`** — Utilitaire : Web Share API avec fallback clipboard
- **`/share/highlight/[id]`** — Page serveur + client player (generateMetadata pour OG tags)
- **`/match/[id]`** — Server wrapper (generateMetadata) + client component (match-client.tsx)
- **`GET /api/highlights/{id}/share`** — Endpoint API retournant données highlight avec URLs HTTP résolues

### OG Meta Tags
- Highlights : og:title, og:description, og:image (thumbnail), og:video (clip), twitter:card=player
- Matchs : og:title (Team A vs Team B), og:description (score + date), twitter:card=summary
- `path_to_url()` convertit les chemins Windows en URLs HTTP

### Share Buttons
- Bouton "Partager" sur chaque page (match, joueur)
- Icône share sur chaque highlight card
- Toast notification animée ("Lien copié !") après partage

## Authentification

### Backend
- **User model** (`models/user.py`) — email, hashed_password, full_name, role, player_id?, club_id?
- **Auth service** (`services/auth.py`) — bcrypt hashing, JWT (PyJWT), 7 jours expiration
- **Auth routes** (`routers/auth.py`) — register, login, me
- **Dependencies** (`deps.py`) — `get_current_user` (401 si pas de token), `get_optional_user` (None si pas de token)

### Frontend
- **AuthProvider** (`lib/auth.tsx`) — Context React, localStorage token, login/register/logout
- **Providers** (`components/providers.tsx`) — Wrapper client pour le layout
- **Navbar** — Affiche nom utilisateur + Déconnexion si connecté, Login si non connecté
- **Pages** — `/login` et `/register` avec redirection post-auth vers dashboard

## Notifications

### Backend
- **Notification model** (`models/notification.py`) — id, user_id, type, title, message, link, is_read, created_at
- **Notification service** (`services/notifications.py`) — `create_notification()`, `notify_highlights_ready()`, `notify_welcome()`
- **Notification routes** (`routers/notifications.py`) — GET list, GET count, PATCH read, PATCH read-all

### Frontend
- **NotificationBell** (`components/notification-bell.tsx`) — Cloche avec badge unread, dropdown avec liste, mark-as-read, navigation
- Intégré dans la navbar (desktop + mobile)
- Polling toutes les 30s pour le compteur unread

### Triggers
- **Welcome** — notification envoyée à l'inscription
- **Highlights prêts** — notification à tous les users du club + joueurs du match après analyse IA

### Endpoints
- `GET /api/notifications/` — liste (limit, unread_only)
- `GET /api/notifications/count` — {unread, total}
- `PATCH /api/notifications/{id}/read` — marquer lu
- `PATCH /api/notifications/read-all` — tout marquer lu

## Analytics

### Backend
- **PageView model** (`models/analytics.py`) — entity_type, entity_id, referrer, user_agent
- **ShareEvent model** (`models/analytics.py`) — entity_type, entity_id, method, platform
- **Analytics routes** (`routers/analytics.py`) — track-view, track-share, entity stats, dashboard

### Frontend
- **Tracking lib** (`lib/analytics.ts`) — `trackView()`, `trackShare()` (fire-and-forget)
- **Dashboard page** (`/dashboard/analytics`) — KPI cards, bar charts (14 jours), top highlights, top matchs
- Tracking wired into: match page (view+share), player page (view+share), highlight share page (view+share)

### Endpoints
- `POST /api/analytics/track-view` — {entity_type, entity_id, referrer?}
- `POST /api/analytics/track-share` — {entity_type, entity_id, method, platform?}
- `GET /api/analytics/entity/{type}/{id}` — stats pour une entité
- `GET /api/analytics/dashboard` — dashboard complet (views, shares, daily, top content)

## Dépendances externes

- **FFmpeg** : Installé via `winget install Gyan.FFmpeg`. Auto-détecté par `services/video.py` (`_ffmpeg_bin()`)
- **yt-dlp** : `pip install yt-dlp` pour télécharger des vidéos de test depuis YouTube
- **python-multipart** : Requis pour les uploads multipart dans FastAPI

## Roadmap MVP

- [x] Scaffold monorepo
- [x] Backend CRUD complet
- [x] Dashboard club
- [x] Profil joueur (Match Card FIFA)
- [x] Détail match + scoreboard
- [x] Pipeline vidéo (upload + FFmpeg clips) ✅ TESTÉ END-TO-END
- [x] Analyse IA (Audio peaks + Claude Vision) ✅ CODE COMPLET, en attente crédits API
- [x] Auth (JWT + login/register/me + AuthProvider + navbar) ✅ COMPLET
- [x] Partage viral (deep links, OG meta, share buttons, page highlight) ✅ COMPLET
- [x] Responsive mobile-first ✅ COMPLET (navbar hamburger, sidebar collapsible, tables→cards, breakpoints sm/md/lg)
- [x] Notifications (bell icon, welcome, highlights prêts, mark-as-read) ✅ COMPLET
- [x] Analytics (track views/shares, dashboard KPIs, bar charts, top content) ✅ COMPLET
- [ ] Déploiement (Vercel + Railway)

## Repo GitHub
- **URL** : https://github.com/OBELH/padel-vision
- **Branche** : main
