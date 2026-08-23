# Styles Map

This project uses **three CSS layers**. Keep admin and storefront isolated, and only put shared base styles in `globals.css`.

## 1) Shared Base (Global)
**File:** `src/app/globals.css`

**Purpose:** Global tokens and truly shared base styles.

**What belongs here:**
- CSS variables (theme tokens)
- Global resets/base element styles
- Shared animations used in both admin and storefront (e.g., `shimmer`)

**Do not add:**
- Storefront utilities (`.page-shell`, `.section-*`, `.btn-*`, `.soft-card`, etc.)
- Admin styles (`.admin-*`, admin buttons/forms)

---

## 2) Storefront Only
**File:** `src/app/storefront.css`  
**Loaded by:** `src/app/(store)/layout.tsx`

**Purpose:** All storefront utilities and visual language.

**Includes:**
- Layout helpers: `.page-shell`, `.section-pad`, `.section-title`, `.section-kicker`
- Storefront buttons: `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-sweep`, `.btn-sweep-label`
- Storefront cards: `.soft-card`, `.card-hover`
- Storefront animations: `.fade-in`, `.cart-pop`, `.badge-pop`, `.qty-pop`, `.cart-pop-strong`
- UI helpers: `.pp-scrollbar`

**Notes:**
- Button radius reset is scoped to `.storefront` in this file.

---

## 3) Admin Only
**File:** `src/app/(admin)/admin/(panel)/admin.css`  
**Loaded by:** `src/app/(admin)/admin/(panel)/layout.tsx` and `src/app/(admin)/admin/login/layout.tsx`

**Purpose:** Admin UI styles and component utilities.

**Includes:**
- Admin inputs/selects: `.admin-input`, `.admin-textarea`, `.admin-select-*`, error states
- Admin labels and validation: `.admin-label`, `.admin-required`, `.field-error`
- Admin buttons: `.admin-btn`, `.admin-btn-size`, `.btn-round`
- Admin cards: `.soft-card` (admin styling)
- Admin animations: `.admin-fade-in`

---

## Quick Rule of Thumb
- **Is it used on storefront only?** → `storefront.css`
- **Is it used on admin only?** → `admin.css`
- **Is it a shared base token/reset?** → `globals.css`

