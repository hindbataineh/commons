ALTER TABLE bookings ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS birth_year integer;

ALTER TABLE members ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE members ADD COLUMN IF NOT EXISTS birth_year integer;
