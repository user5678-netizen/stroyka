-- Create promo code SAVE10
INSERT INTO promo_codes (id, code, discount_percentage, is_active)
VALUES (
  gen_random_uuid(),
  'SAVE10',
  10.00,
  true
) ON CONFLICT (code) DO NOTHING;