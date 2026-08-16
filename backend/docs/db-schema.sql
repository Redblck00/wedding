-- ============================================
-- Wedding Invitation SaaS — Full Database Schema
-- PostgreSQL 15+
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE billing_period AS ENUM ('monthly', 'yearly', 'lifetime');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trialing');
CREATE TYPE wedding_status AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE section_type AS ENUM (
    'bride_info', 'groom_info', 'wedding_story', 'event_schedule',
    'venue', 'gallery', 'rsvp_form', 'background_music',
    'gift_info', 'dress_code'
);
CREATE TYPE media_type AS ENUM ('image', 'video', 'audio');
CREATE TYPE payment_provider AS ENUM ('qpay', 'socialpay', 'bank_qr', 'stripe');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE purchase_type AS ENUM ('template', 'subscription', 'extra_storage', 'custom_domain', 'premium_animation');
CREATE TYPE notification_type AS ENUM ('payment_success', 'rsvp_update', 'publish_confirmation', 'subscription_expiry');
CREATE TYPE access_type AS ENUM ('free', 'purchased', 'plan_included');
CREATE TYPE user_template_status AS ENUM ('active', 'revoked');

-- ============================================
-- USERS & AUTH
-- ============================================
CREATE TABLE users (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name        VARCHAR(255) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    password_hash    VARCHAR(255) NOT NULL,
    -- Text, not int: an integer column drops the +976 prefix, a leading zero
    -- and any separator the user typed.
    phone            VARCHAR(20) NOT NULL,
    role             user_role NOT NULL DEFAULT 'user',
    avatar_url       TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No index on email: the UNIQUE constraint above already builds one.

CREATE TABLE refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   VARCHAR(255) NOT NULL,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ============================================
-- TEMPLATES
-- ============================================
CREATE TABLE template_categories (
    id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name   VARCHAR(100) NOT NULL,
    slug   VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE templates (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id    UUID REFERENCES template_categories(id) ON DELETE SET NULL,
    -- Stable key joining this row to the React component that draws the design,
    -- e.g. 'rose-envelope'. The id cannot do this job: UUIDs are generated per
    -- database, so a component registry keyed on one would break the moment
    -- production stopped being the local machine.
    -- Deliberately not named `slug` — weddings.slug is a public URL a couple
    -- picks, whereas this is an identifier a developer commits alongside code.
    code           VARCHAR(60) NOT NULL UNIQUE,
    name           VARCHAR(150) NOT NULL,
    thumbnail_url  TEXT NOT NULL,
    preview_url    TEXT,
    price          NUMERIC(12,2) NOT NULL DEFAULT 0,
    is_free        BOOLEAN NOT NULL DEFAULT FALSE,
    is_active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    -- NOTE: category name is looked up via category_id -> template_categories.name.
    -- No separate `category` string column here — avoids two sources of truth.
);
CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_templates_is_free ON templates(is_free);

-- Defines which sections a template ships with and their defaults —
-- lets different templates offer different section sets/defaults without new tables per template.
CREATE TABLE template_content (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id      UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    section_key      VARCHAR(100) NOT NULL,       -- stable machine key, e.g. "bride_info"
    display_name     VARCHAR(150) NOT NULL,       -- label shown in the editor, e.g. "Bride's info"
    section_type     section_type NOT NULL,
    default_content  JSONB NOT NULL DEFAULT '{}',
    display_order    INTEGER NOT NULL DEFAULT 0,
    is_required      BOOLEAN NOT NULL DEFAULT FALSE,
    is_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (template_id, section_key)
);
CREATE INDEX idx_template_content_template ON template_content(template_id);

CREATE TABLE user_templates (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id    UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    access_type    access_type NOT NULL DEFAULT 'free',
    status         user_template_status NOT NULL DEFAULT 'active',
    payment_id     UUID,  -- FK added after payments table exists
    acquired_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, template_id)
);
CREATE INDEX idx_user_templates_user ON user_templates(user_id);

CREATE TABLE subscription_plans (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name              VARCHAR(100) NOT NULL,
    billing_period    billing_period NOT NULL,
    price             NUMERIC(12,2) NOT NULL,
    storage_limit_mb  INTEGER NOT NULL,
    max_websites      INTEGER NOT NULL,
    features          JSONB NOT NULL DEFAULT '{}',
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subscriptions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id      UUID NOT NULL REFERENCES subscription_plans(id),
    status       subscription_status NOT NULL DEFAULT 'active',
    started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TABLE weddings (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id    UUID NOT NULL REFERENCES templates(id),
    slug           VARCHAR(150) NOT NULL UNIQUE,
    bride_name     VARCHAR(150),
    groom_name     VARCHAR(150),
    wedding_date   DATE,
    theme_color    VARCHAR(20),
    font_family    VARCHAR(100),
    status         wedding_status NOT NULL DEFAULT 'draft',
    published_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_weddings_user ON weddings(user_id);
-- No index on slug: the UNIQUE constraint already builds the one that the
-- public /wedding/{slug} lookup uses.
CREATE INDEX idx_weddings_status ON weddings(status);

-- Per-section flexible content only — section-specific fields (bride bio, story text,
-- schedule events, gift bank info, dress code, etc.) live inside `content`, never as
-- separate flat columns on this table.
CREATE TABLE wedding_sections (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id      UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    section_type    section_type NOT NULL,
    content         JSONB NOT NULL DEFAULT '{}',
    display_order   INTEGER NOT NULL DEFAULT 0,
    is_visible      BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (wedding_id, section_type)
);
CREATE INDEX idx_wedding_sections_wedding ON wedding_sections(wedding_id);
CREATE INDEX idx_wedding_sections_content_gin ON wedding_sections USING GIN (content);

-- One or more physical locations for a wedding (e.g. ceremony vs. reception venue).
-- Normalized into its own table rather than kept inside a section's jsonb, so it has
-- one source of truth and can be queried/mapped directly.
CREATE TABLE venues (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id      UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    name            VARCHAR(200) NOT NULL,     -- e.g. "Хуримын ордон"
    address         TEXT,
    map_url         TEXT,                      -- Google Maps share link
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    -- When this location's part of the day starts, e.g. 17:00 for the ceremony.
    -- TIME rather than TIMESTAMPTZ: the calendar day lives on
    -- weddings.wedding_date, and a venue card only ever shows a clock time.
    starts_at       TIME,
    -- The photo shown on the venue card. An FK into media_assets, not a URL
    -- column: an uploaded file is only deletable while its cloudinary_public_id
    -- is kept, so a bare URL here would strand every replaced photo in storage
    -- and keep billing for it. Same reason gallery sections store media ids.
    photo_media_id  UUID,  -- FK added after media_assets table exists
    display_order   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_venues_wedding ON venues(wedding_id);

CREATE TABLE media_assets (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id        UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    section_id        UUID REFERENCES wedding_sections(id) ON DELETE SET NULL,
    type              media_type NOT NULL,
    url               TEXT NOT NULL,
    thumbnail_url     TEXT,
    -- Cloudinary's destroy API takes a public_id, not a URL. Without this the
    -- file can never be deleted from storage, and the account keeps paying for it.
    cloudinary_public_id VARCHAR(255),
    file_size_bytes   BIGINT NOT NULL DEFAULT 0,
    width             INTEGER,
    height            INTEGER,
    uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_wedding ON media_assets(wedding_id);
CREATE INDEX idx_media_section ON media_assets(section_id);

-- Declared here rather than inline above because venues is created first.
-- SET NULL, not CASCADE: deleting a photo must drop the venue's picture, never
-- the venue itself.
ALTER TABLE venues
    ADD CONSTRAINT fk_venues_photo_media
    FOREIGN KEY (photo_media_id) REFERENCES media_assets(id) ON DELETE SET NULL;

CREATE TABLE rsvp_responses (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wedding_id         UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
    guest_name         VARCHAR(150) NOT NULL,
    guest_contact      VARCHAR(150),
    attending          BOOLEAN NOT NULL,
    number_of_guests   INTEGER NOT NULL DEFAULT 1,
    message            TEXT,
    responded_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rsvp_wedding ON rsvp_responses(wedding_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE payments (
    id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount                    NUMERIC(12,2) NOT NULL,
    currency                  VARCHAR(10) NOT NULL DEFAULT 'MNT',
    provider                  payment_provider NOT NULL,
    provider_transaction_id   VARCHAR(255),
    status                    payment_status NOT NULL DEFAULT 'pending',
    purchase_type             purchase_type NOT NULL,
    reference_id              UUID,  -- polymorphic: templates.id / subscriptions.id / etc.
    created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider_txn ON payments(provider_transaction_id);

ALTER TABLE user_templates
    ADD CONSTRAINT fk_user_templates_payment
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL;

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         notification_type NOT NULL,
    title        VARCHAR(255) NOT NULL,
    message      TEXT,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================
-- ADMIN
-- ============================================
CREATE TABLE admin_activity_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id      UUID NOT NULL REFERENCES users(id),
    action        VARCHAR(255) NOT NULL,
    target_type   VARCHAR(100),
    target_id     UUID,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_admin_logs_admin ON admin_activity_logs(admin_id);

-- ============================================
-- updated_at auto-touch trigger (reusable)
-- ============================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_weddings_updated_at BEFORE UPDATE ON weddings
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_wedding_sections_updated_at BEFORE UPDATE ON wedding_sections
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION touch_updated_at();