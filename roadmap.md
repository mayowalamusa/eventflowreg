# EventFlow roadmap

## Done
- Auth (signup, login, forgot/reset, verification, roles)
- Database schema + RLS, storage buckets
- Host dashboard (stats, recent events, recent activity, upcoming widget)
- Organizer profiles + public pages
- Event CRUD, publish, SEO slugs
- Registration form builder
- Public pages (home, discover, event, register, success)
- Registration flow + confirmation email
- Google Sheets: connect account, create spreadsheet, headers, manual sync, sync history
- Admin: dashboard, users, events, analytics, suspend users, archive events
- Dashboard registrations table: search, filters, pagination, realtime

## In progress (this turn)
- [ ] Google Sheets: choose existing spreadsheet by URL/ID
- [ ] Google Sheets: instant auto-sync on new registration + automatic retry of failures
- [ ] Google Sheets: hard duplicate-row prevention (atomic claim before append)
- [ ] Discovery: tag filter, Featured / Trending / Upcoming sections
- [ ] Admin: feature events, hide events

## Final polish (done)
- Shared Skeleton / EmptyState / ErrorState components
- Loading skeletons on discovery, dashboard, events and registrations
- Skip link, focus-visible rings, aria labels, decorative icons hidden
- Fade-in animations + prefers-reduced-motion support
- Lazy image loading, mock data removed (src/data deleted, helpers in src/lib/format.ts)
