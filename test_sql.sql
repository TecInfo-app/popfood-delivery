UPDATE products SET image_url = NULL WHERE image_url LIKE 'data:image%';
UPDATE restaurant_profiles SET logo_url = NULL WHERE logo_url LIKE 'data:image%';
UPDATE restaurant_profiles SET cover_url = NULL WHERE cover_url LIKE 'data:image%';
UPDATE restaurant_profiles SET settings = settings - 'banners' - 'categoryImages';
