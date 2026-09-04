# EventFlow Admin Backend

A dedicated admin panel, separate from the host dashboard, with a super admin who controls everything (including what each manager can access) and manager admins limited to the areas the super admin grants them.

## Roles

- **Super admin** — full access: site settings and branding, admin team management, and every manager area. Only a super admin can grant/revoke admin access and change permissions.
- **Manager** — access only to the areas the super admin ticks for them: Events, Users, Registrations, Payments, Errors & activity, Analytics.
- **Host** — unchanged; hosts never see the admin panel.

Existing accounts holding the current `admin` role become super admins. Your account is promoted to super admin in the same change.

## Admin panel sections

Existing (Overview, Users, Events, Analytics) stay, and each becomes permission-gated. New sections:

1. **Site settings & branding** (super admin only)
   - Logo upload, favicon, site name, tagline, support/contact email, phone, social links, footer text, default social-share image, maintenance mode toggle.
   - These values drive the public navbar, footer, and page metadata instead of the hardcoded "EventFlow" text and icon.
2. **Errors & activity**
   - Runtime error log: message, stack, page URL, user, browser, timestamp; filter by date/severity, mark resolved.
   - Admin audit trail: who suspended a user, archived an event, changed settings, changed permissions.
3. **Payments**
   - Read-only for now: paid events, ticket types, amounts collected per event, per-registration payment rows, totals over time. No payment provider is connected yet, so this reports the amounts already recorded on registrations/tickets. A provider can be wired in later without changing the screens.
4. **Admin team**
   - List all admins with their tier and granted areas.
   - Grant admin access to an existing registered user by email, choose super admin or manager, tick the manager's allowed areas, revoke access. A super admin cannot revoke their own access if they are the last one.

Sidebar links and route access both respect permissions: a manager without Payments never sees the link and is redirected if they type the URL.

## Technical notes

- **Database**
  - Extend the `app_role` enum with `super_admin` and `manager`; migrate existing `admin` rows to `super_admin` and keep `admin` accepted for compatibility.
  - New `admin_permissions` table (user_id, area, granted_by) with an `admin_area` enum; super admins bypass it.
  - New security-definer helpers `is_super_admin(uid)` and `has_admin_area(uid, area)` used by RLS policies and route guards; existing RLS that checks `has_role(uid,'admin')` is updated to accept super admin plus the relevant area.
  - New `site_settings` singleton table (public read via a narrow `TO anon` select, write restricted to super admin), plus GRANTs on every new table.
  - New `app_error_logs` table: insert allowed for logging, read/update restricted to admins with the errors area.
- **Storage**: reuse an existing bucket for logo/favicon uploads, or add a `site-assets` bucket if a public-read bucket is needed for branding images.
- **Frontend**: new routes `admin.settings.tsx`, `admin.errors.tsx`, `admin.payments.tsx`, `admin.team.tsx`; `admin.tsx` guard extended to load permissions once and expose them through context; `AdminLayout` filters nav by permission. Branding read through a small `useSiteSettings` hook consumed by `Navbar`, `Footer`, and root metadata.
- **Error capture**: extend the existing client error reporting to also insert into `app_error_logs`, with de-duplication by message+stack so one bug doesn't flood the table.
- Styling follows the current admin panel look (dark sidebar, light content, existing tokens) — no redesign.

## Out of scope

Live payment processing, refunds, and payout management; email invitations to people who don't yet have an EventFlow account (grants apply to registered users only).
