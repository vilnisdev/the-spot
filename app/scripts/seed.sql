-- ============================================================
-- SEED — US National Parks / Nature Spots
-- Run via Supabase MCP execute_sql on project lcjmnxivqndygeepbqwi
-- ============================================================

-- ============================================================
-- WIPE (targets fixed seed UUIDs only — existing data safe)
-- ============================================================
DELETE FROM public.spots WHERE id IN (
  'c1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000004',
  'c1000000-0000-0000-0000-000000000005',
  'c1000000-0000-0000-0000-000000000006',
  'c1000000-0000-0000-0000-000000000007',
  'c1000000-0000-0000-0000-000000000008',
  'c1000000-0000-0000-0000-000000000009',
  'c1000000-0000-0000-0000-000000000010',
  'c1000000-0000-0000-0000-000000000011',
  'c1000000-0000-0000-0000-000000000012',
  'c1000000-0000-0000-0000-000000000013',
  'c1000000-0000-0000-0000-000000000014',
  'c1000000-0000-0000-0000-000000000015',
  'c1000000-0000-0000-0000-000000000016',
  'c1000000-0000-0000-0000-000000000017',
  'c1000000-0000-0000-0000-000000000018',
  'c1000000-0000-0000-0000-000000000019',
  'c1000000-0000-0000-0000-000000000020'
);

DELETE FROM public.networks WHERE id IN (
  'b1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000003'
);

DELETE FROM auth.users WHERE email LIKE '%@seedspot.test';

DELETE FROM public.tags WHERE id IN (
  'd1000000-0000-0000-0000-000000000001',
  'd1000000-0000-0000-0000-000000000002',
  'd1000000-0000-0000-0000-000000000003',
  'd1000000-0000-0000-0000-000000000004',
  'd1000000-0000-0000-0000-000000000005',
  'd1000000-0000-0000-0000-000000000006',
  'd1000000-0000-0000-0000-000000000007',
  'd1000000-0000-0000-0000-000000000008',
  'd1000000-0000-0000-0000-000000000009',
  'd1000000-0000-0000-0000-000000000010',
  'd1000000-0000-0000-0000-000000000011',
  'd1000000-0000-0000-0000-000000000012',
  'd1000000-0000-0000-0000-000000000013',
  'd1000000-0000-0000-0000-000000000014',
  'd1000000-0000-0000-0000-000000000015',
  'd1000000-0000-0000-0000-000000000016',
  'd1000000-0000-0000-0000-000000000017',
  'd1000000-0000-0000-0000-000000000018',
  'd1000000-0000-0000-0000-000000000019',
  'd1000000-0000-0000-0000-000000000020',
  'd1000000-0000-0000-0000-000000000021',
  'd1000000-0000-0000-0000-000000000022',
  'd1000000-0000-0000-0000-000000000023',
  'd1000000-0000-0000-0000-000000000024',
  'd1000000-0000-0000-0000-000000000025',
  'd1000000-0000-0000-0000-000000000026',
  'd1000000-0000-0000-0000-000000000027',
  'd1000000-0000-0000-0000-000000000028',
  'd1000000-0000-0000-0000-000000000029',
  'd1000000-0000-0000-0000-000000000030'
);

-- ============================================================
-- USERS  (trigger on_auth_user_created auto-creates profiles)
-- UUIDs: a1000000-0000-0000-0000-00000000000{1-5}
-- ============================================================
INSERT INTO auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data,
  confirmation_token, recovery_token, email_change_token_new, email_change
) VALUES
(
  'a1000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'alex@seedspot.test',
  crypt('Password123!', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"alex_ridge"}'::jsonb,
  '', '', '', ''
),
(
  'a1000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'sierra@seedspot.test',
  crypt('Password123!', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"sierra_nomad"}'::jsonb,
  '', '', '', ''
),
(
  'a1000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'kate@seedspot.test',
  crypt('Password123!', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"canyon_kate"}'::jsonb,
  '', '', '', ''
),
(
  'a1000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'finn@seedspot.test',
  crypt('Password123!', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"forest_finn"}'::jsonb,
  '', '', '', ''
),
(
  'a1000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'maya@seedspot.test',
  crypt('Password123!', gen_salt('bf')), now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"mesa_maya"}'::jsonb,
  '', '', '', ''
);

-- ============================================================
-- NETWORKS
-- ============================================================
INSERT INTO public.networks (id, name, owner_id, created_at) VALUES
(
  'b1000000-0000-0000-0000-000000000001',
  'Southwest Wanderers',
  'a1000000-0000-0000-0000-000000000001',
  now() - interval '90 days'
),
(
  'b1000000-0000-0000-0000-000000000002',
  'Pacific Trail Crew',
  'a1000000-0000-0000-0000-000000000002',
  now() - interval '75 days'
),
(
  'b1000000-0000-0000-0000-000000000003',
  'Appalachian Trail Club',
  'a1000000-0000-0000-0000-000000000003',
  now() - interval '60 days'
);

-- ============================================================
-- MEMBERSHIPS
-- Southwest Wanderers: alex (owner), kate (member), maya (member)
-- Pacific Trail Crew:  sierra (owner), finn (member), alex (member)
-- Appalachian Trail Club: kate (owner), finn (member)
-- ============================================================
INSERT INTO public.memberships (user_id, network_id, role) VALUES
('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'owner'),
('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'member'),
('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001', 'member'),
('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'owner'),
('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000002', 'member'),
('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'member'),
('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'owner'),
('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'member');

-- ============================================================
-- SPOTS (20)
-- Authors:
--   alex  (a1...001): 1, 2, 6, 10, 15
--   sierra(a1...002): 3, 5, 12, 13
--   kate  (a1...003): 7, 8, 16, 17
--   finn  (a1...004): 4, 9, 11, 18, 19
--   maya  (a1...005): 14, 20
-- ============================================================
INSERT INTO public.spots (id, author_id, title, description, lat, lng, state, date, created_at) VALUES

-- 1. Half Dome Summit — Yosemite, CA
(
  'c1000000-0000-0000-0000-000000000001',
  'a1000000-0000-0000-0000-000000000001',
  'Half Dome Summit',
  'The iconic 8,842-foot granite dome towers above Yosemite Valley with unobstructed 360-degree views of the Sierra Nevada. The nerve-wracking cables route requires a permit and rewards hikers with one of the most dramatic summits in the American West. Save energy for the descent — your quads will hate you. #hiking #summit #granite #yosemite #viewpoint',
  37.7459, -119.5333, 'California',
  '2025-08-15', now() - interval '60 days'
),

-- 2. Grand Canyon South Rim — Grand Canyon, AZ
(
  'c1000000-0000-0000-0000-000000000002',
  'a1000000-0000-0000-0000-000000000001',
  'Grand Canyon South Rim',
  'Standing at the South Rim reveals Colorado River-carved geology spanning two billion years — red and orange strata dropping nearly a mile to the canyon floor. Sunrise here paints the limestone in electric gold and purple. Arrive before dawn at Mather Point for the full effect. #grandcanyon #geology #viewpoint #sunrise #arizona',
  36.0544, -112.1401, 'Arizona',
  '2025-06-20', now() - interval '120 days'
),

-- 3. Hidden Lake Overlook — Glacier NP, MT
(
  'c1000000-0000-0000-0000-000000000003',
  'a1000000-0000-0000-0000-000000000002',
  'Hidden Lake Overlook',
  'Above the treeline at Logan Pass, Hidden Lake Overlook rewards hikers with turquoise alpine water framed by jagged peaks and glacier lily meadows. Mountain goats routinely wander the rocky boardwalk, completely unbothered by humans. Snow often lingers into July — bring microspikes in early summer. #alpine #wildlife #hiking #glacier #reflection',
  48.6958, -113.7179, 'Montana',
  '2025-07-10', now() - interval '110 days'
),

-- 4. Angels Landing — Zion NP, UT
(
  'c1000000-0000-0000-0000-000000000004',
  'a1000000-0000-0000-0000-000000000004',
  'Angels Landing',
  'A narrow sandstone fin rising 1,488 feet above the Virgin River, Angels Landing demands chain-gripping nerve on its exposed final half-mile. The views of the canyon snaking below are worth every white-knuckle step. A permit lottery system now limits the crowds on the summit chains. #hiking #adventure #zion #utah #canyon',
  37.2690, -112.9481, 'Utah',
  '2025-05-03', now() - interval '150 days'
),

-- 5. Grand Prismatic Spring — Yellowstone, WY
(
  'c1000000-0000-0000-0000-000000000005',
  'a1000000-0000-0000-0000-000000000002',
  'Grand Prismatic Spring',
  'The largest hot spring in the US blazes with concentric rings of orange, yellow, and green heat-loving microbes surrounding a 160-foot deep sapphire pool. Take the Fairy Falls overlook trail for the bird''s-eye rainbow perspective — the boardwalk view at ground level misses the scale entirely. #geothermal #hotspring #yellowstone #wilderness #volcanic',
  44.5250, -110.8381, 'Wyoming',
  '2025-06-05', now() - interval '130 days'
),

-- 6. Delicate Arch — Arches NP, UT
(
  'c1000000-0000-0000-0000-000000000006',
  'a1000000-0000-0000-0000-000000000001',
  'Delicate Arch',
  'Utah''s most beloved arch stands alone on the rim of a sandstone bowl, framing the La Sal Mountains in a natural window that glows copper at sunset. The 3-mile round trip hike climbs exposed slickrock with no shade — start early and bring far more water than you think you need. #arch #slickrock #desert #utah #sunset',
  38.7436, -109.4993, 'Utah',
  '2025-09-22', now() - interval '40 days'
),

-- 7. Cadillac Mountain Summit — Acadia NP, ME
(
  'c1000000-0000-0000-0000-000000000007',
  'a1000000-0000-0000-0000-000000000003',
  'Cadillac Mountain Summit',
  'From October through early March, Cadillac Mountain is the first place in the eastern US to catch the day''s first sunlight. Pink granite slabs sweep the summit with panoramic views of Frenchman Bay and the Porcupine Islands scattered like stepping stones below. The sunrise reservation system is worth the early alarm. #summit #sunrise #acadia #maine #coast',
  44.3526, -68.2273, 'Maine',
  '2025-10-12', now() - interval '20 days'
),

-- 8. Clingmans Dome — Great Smoky Mountains, TN
(
  'c1000000-0000-0000-0000-000000000008',
  'a1000000-0000-0000-0000-000000000003',
  'Clingmans Dome',
  'At 6,643 feet the highest point in the Great Smokies, Clingmans Dome sits astride the Tennessee-North Carolina border wrapped in the blue haze that names these mountains. The spiral observation tower peeks above the Fraser fir canopy for views up to 100 miles on clear days — though clouds are far more common. #summit #fog #appalachian #smokymountains #hiking',
  35.5629, -83.4985, 'Tennessee',
  '2025-04-18', now() - interval '165 days'
),

-- 9. Hoh Rain Forest — Olympic NP, WA
(
  'c1000000-0000-0000-0000-000000000009',
  'a1000000-0000-0000-0000-000000000004',
  'Hoh Rain Forest',
  'One of the finest temperate rainforests on Earth, the Hoh receives 140 inches of rain per year, nurturing towering old-growth Sitka spruce and bigleaf maple wrapped in thick club moss curtains. The cathedral silence here — broken only by the Hoh River and dripping rain — is unlike anywhere else in the lower 48. #rainforest #moss #pnw #wilderness #oldgrowth',
  47.8601, -123.9343, 'Washington',
  '2025-03-28', now() - interval '195 days'
),

-- 10. Thor''s Hammer — Bryce Canyon, UT
(
  'c1000000-0000-0000-0000-000000000010',
  'a1000000-0000-0000-0000-000000000001',
  'Thor''s Hammer',
  'Rising from Bryce Amphitheater''s pink and orange hoodoo forest, Thor''s Hammer is the park''s most recognizable spire — a balanced column capped with a flat rock defying gravitational logic. The Navajo Loop drops directly past it into a canyon of stone columns that glow vivid at first and last light. #hoodoo #geology #desert #brycecanyon #hiking',
  37.6231, -112.1669, 'Utah',
  '2025-08-01', now() - interval '75 days'
),

-- 11. Bear Lake — Rocky Mountain NP, CO
(
  'c1000000-0000-0000-0000-000000000011',
  'a1000000-0000-0000-0000-000000000004',
  'Bear Lake',
  'A glacial cirque lake reflecting Hallett Peak and Flattop Mountain in glassy alpine water, Bear Lake delivers Colorado''s most iconic mountain reflection in a half-mile stroll. Arrive before 8am or take the shuttle from Estes Park — the parking lot fills by 9am year-round. The chain of lakes above — Nymph, Dream, Emerald — gets better the higher you go. #lake #reflection #alpine #colorado #mountains',
  40.3129, -105.6449, 'Colorado',
  '2025-09-05', now() - interval '50 days'
),

-- 12. Crater Lake Rim — Crater Lake NP, OR
(
  'c1000000-0000-0000-0000-000000000012',
  'a1000000-0000-0000-0000-000000000002',
  'Crater Lake Rim',
  'Formed by the collapse of Mount Mazama 7,700 years ago, Crater Lake plunges 1,943 feet — the deepest lake in the US — its water impossibly pure and vivid blue. The 33-mile Rim Drive reveals constantly shifting perspectives on the lake''s otherworldly color as clouds and light change throughout the day. #lake #volcanic #geology #oregon #viewpoint',
  42.9446, -122.1090, 'Oregon',
  '2025-07-25', now() - interval '90 days'
),

-- 13. Wonder Lake — Denali NP, AK
(
  'c1000000-0000-0000-0000-000000000013',
  'a1000000-0000-0000-0000-000000000002',
  'Wonder Lake',
  'On calm, clear days Wonder Lake mirrors Denali — North America''s highest summit at 20,310 feet — in still water, doubling its staggering scale in a single frame. Reaching it requires an 85-mile bus ride on the park road, making the journey as much a wilderness experience as the destination. Reserve the campground a full year out. #lake #reflection #wilderness #denali #alaska',
  63.4716, -150.8682, 'Alaska',
  '2025-06-28', now() - interval '105 days'
),

-- 14. McWay Falls — Big Sur, CA
(
  'c1000000-0000-0000-0000-000000000014',
  'a1000000-0000-0000-0000-000000000005',
  'McWay Falls',
  'One of only a handful of tidefalls in California, McWay Falls drops 80 feet off a cliff directly onto an inaccessible crescent of white sand at Julia Pfeiffer Burns State Park. The short Overlook Trail frames the falls against the Pacific''s turquoise shallows in a view that photographers have chased for decades. Check Caltrans before driving — Highway 1 closes often after storms. #waterfall #coast #bigsur #california #hiking',
  36.1576, -121.6719, 'California',
  '2025-05-18', now() - interval '145 days'
),

-- 15. Antelope Canyon — Navajo Nation, AZ
(
  'c1000000-0000-0000-0000-000000000015',
  'a1000000-0000-0000-0000-000000000001',
  'Antelope Canyon',
  'Flash-flood-carved slot canyons glow with warm light beams that shift through Navajo sandstone walls throughout the day. Upper Antelope Canyon''s famous light shafts appear between 10am and 1pm in the summer months. The vivid swirling layers feel more like a living painting than a geological formation. #canyon #sandstone #desert #geology #slotcanyon',
  36.8619, -111.3743, 'Arizona',
  '2025-04-10', now() - interval '175 days'
),

-- 16. Havasu Falls — Havasupai, AZ
(
  'c1000000-0000-0000-0000-000000000016',
  'a1000000-0000-0000-0000-000000000003',
  'Havasu Falls',
  'Havasu Falls cascades 100 feet into travertine pools of surreal turquoise water on Havasupai tribal land deep in the Grand Canyon. The 10-mile hike with a loaded pack is genuinely difficult, but those electric blue pools erase every complaint on arrival. Permits open February 1st and sell out within minutes. #waterfall #adventure #canyon #arizona #havasupai',
  36.2554, -112.6977, 'Arizona',
  '2025-05-30', now() - interval '135 days'
),

-- 17. Multnomah Falls — Columbia River Gorge, OR
(
  'c1000000-0000-0000-0000-000000000017',
  'a1000000-0000-0000-0000-000000000003',
  'Multnomah Falls',
  'Oregon''s most visited natural attraction thunders 620 feet in two tiers over basalt, with the Historic Columbia River Highway bridge perfectly framing the upper cascade. In spring, the gorge fills with a dozen interconnected waterfalls accessible from the same trailhead — Latourell, Bridal Veil, and Wahkeena are all within a mile. #waterfall #pnw #hiking #oregon #gorge',
  45.5762, -122.1158, 'Oregon',
  '2025-11-08', now() - interval '5 days'
),

-- 18. Maroon Bells — White River NF, CO  (no images)
(
  'c1000000-0000-0000-0000-000000000018',
  'a1000000-0000-0000-0000-000000000004',
  'Maroon Bells',
  'The twin summits of Maroon and North Maroon Bell rise above Maroon Lake in one of Colorado''s most composed scenes — burgundy fourteeners reflected in still water, framed by golden aspen groves in late September. The mandatory shuttle from Aspen runs June through October and keeps the valley from being overrun. #mountains #reflection #alpine #colorado #aspens',
  39.0708, -106.9890, 'Colorado',
  '2025-09-28', now() - interval '30 days'
),

-- 19. Painted Hills — John Day Fossil Beds, OR  (no images)
(
  'c1000000-0000-0000-0000-000000000019',
  'a1000000-0000-0000-0000-000000000004',
  'Painted Hills',
  'The volcanic claystone hills shift between gold, black, and deep burgundy depending on moisture and light, preserving 33 million years of climate change in their striped layers. Sunrise and late afternoon bring the most saturated colors when the clay is slightly damp — and after rain the entire hillside seems to glow from within. #geology #desert #volcanic #oregon #painted',
  44.6614, -120.2681, 'Oregon',
  '2025-04-25', now() - interval '170 days'
),

-- 20. Mesa Arch — Canyonlands NP, UT
(
  'c1000000-0000-0000-0000-000000000020',
  'a1000000-0000-0000-0000-000000000005',
  'Mesa Arch',
  'Perched on the edge of the Island in the Sky mesa, Mesa Arch frames the dramatic canyons and buttes of Canyonlands in a natural sandstone window that blazes orange at sunrise. The half-mile walk from the trailhead makes it one of the most accessible dramatic views in Utah — arrive 30 minutes before sunrise to claim a tripod spot. #arch #canyon #desert #utah #sunrise',
  38.3705, -109.8653, 'Utah',
  '2025-07-04', now() - interval '100 days'
);

-- ============================================================
-- SPOT_NETWORKS
-- SW Wanderers (b1...001): 1,2,4,6,10,14,15,16,20
-- Pacific Trail (b1...002): 1,3,5,9,11,12,13,14,17,18,19
-- Appalachian  (b1...003): 7,8,18,19
-- ============================================================
INSERT INTO public.spot_networks (spot_id, network_id) VALUES
-- Southwest Wanderers
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000010', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000015', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000016', 'b1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000020', 'b1000000-0000-0000-0000-000000000001'),
-- Pacific Trail Crew
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000009', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000011', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000012', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000013', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000014', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000017', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000002'),
-- Appalachian Trail Club
('c1000000-0000-0000-0000-000000000007', 'b1000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000008', 'b1000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000018', 'b1000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000019', 'b1000000-0000-0000-0000-000000000003');

-- ============================================================
-- TAGS (30 unique)
-- d1000000-0000-0000-0000-0000000000{01-30}
-- ============================================================
INSERT INTO public.tags (id, name) VALUES
('d1000000-0000-0000-0000-000000000001', 'hiking'),
('d1000000-0000-0000-0000-000000000002', 'summit'),
('d1000000-0000-0000-0000-000000000003', 'granite'),
('d1000000-0000-0000-0000-000000000004', 'viewpoint'),
('d1000000-0000-0000-0000-000000000005', 'sunrise'),
('d1000000-0000-0000-0000-000000000006', 'geology'),
('d1000000-0000-0000-0000-000000000007', 'wildlife'),
('d1000000-0000-0000-0000-000000000008', 'alpine'),
('d1000000-0000-0000-0000-000000000009', 'adventure'),
('d1000000-0000-0000-0000-000000000010', 'waterfall'),
('d1000000-0000-0000-0000-000000000011', 'geothermal'),
('d1000000-0000-0000-0000-000000000012', 'volcanic'),
('d1000000-0000-0000-0000-000000000013', 'desert'),
('d1000000-0000-0000-0000-000000000014', 'slickrock'),
('d1000000-0000-0000-0000-000000000015', 'forest'),
('d1000000-0000-0000-0000-000000000016', 'rainforest'),
('d1000000-0000-0000-0000-000000000017', 'lake'),
('d1000000-0000-0000-0000-000000000018', 'reflection'),
('d1000000-0000-0000-0000-000000000019', 'wilderness'),
('d1000000-0000-0000-0000-000000000020', 'coast'),
('d1000000-0000-0000-0000-000000000021', 'hoodoo'),
('d1000000-0000-0000-0000-000000000022', 'canyon'),
('d1000000-0000-0000-0000-000000000023', 'arch'),
('d1000000-0000-0000-0000-000000000024', 'fog'),
('d1000000-0000-0000-0000-000000000025', 'moss'),
('d1000000-0000-0000-0000-000000000026', 'mountains'),
('d1000000-0000-0000-0000-000000000027', 'appalachian'),
('d1000000-0000-0000-0000-000000000028', 'pnw'),
('d1000000-0000-0000-0000-000000000029', 'hotspring'),
('d1000000-0000-0000-0000-000000000030', 'sandstone');

-- ============================================================
-- SPOT_TAGS
-- ============================================================
INSERT INTO public.spot_tags (spot_id, tag_id) VALUES
-- 1. Half Dome: hiking, summit, granite, viewpoint
('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003'),
('c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004'),
-- 2. Grand Canyon South Rim: geology, viewpoint, sunrise, canyon
('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000006'),
('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000004'),
('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000005'),
('c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000022'),
-- 3. Hidden Lake Overlook: alpine, wildlife, hiking, reflection
('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008'),
('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000007'),
('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000018'),
-- 4. Angels Landing: hiking, adventure, canyon, viewpoint
('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009'),
('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000022'),
('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000004'),
-- 5. Grand Prismatic Spring: geothermal, hotspring, volcanic, wilderness
('c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000011'),
('c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000029'),
('c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000012'),
('c1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000019'),
-- 6. Delicate Arch: arch, slickrock, desert, sunrise
('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000023'),
('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000014'),
('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000013'),
('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000005'),
-- 7. Cadillac Mountain: summit, sunrise, viewpoint, coast
('c1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000005'),
('c1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000004'),
('c1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000020'),
-- 8. Clingmans Dome: summit, fog, appalachian, hiking
('c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000002'),
('c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000024'),
('c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000027'),
('c1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000001'),
-- 9. Hoh Rain Forest: rainforest, moss, pnw, wilderness
('c1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000016'),
('c1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000025'),
('c1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000028'),
('c1000000-0000-0000-0000-000000000009', 'd1000000-0000-0000-0000-000000000019'),
-- 10. Thor''s Hammer: hoodoo, geology, desert, hiking
('c1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000021'),
('c1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000006'),
('c1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000013'),
('c1000000-0000-0000-0000-000000000010', 'd1000000-0000-0000-0000-000000000001'),
-- 11. Bear Lake: lake, reflection, alpine, mountains
('c1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000017'),
('c1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000018'),
('c1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000008'),
('c1000000-0000-0000-0000-000000000011', 'd1000000-0000-0000-0000-000000000026'),
-- 12. Crater Lake Rim: lake, volcanic, geology, viewpoint
('c1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000017'),
('c1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000012'),
('c1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000006'),
('c1000000-0000-0000-0000-000000000012', 'd1000000-0000-0000-0000-000000000004'),
-- 13. Wonder Lake: lake, reflection, wilderness, mountains
('c1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000017'),
('c1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000018'),
('c1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000019'),
('c1000000-0000-0000-0000-000000000013', 'd1000000-0000-0000-0000-000000000026'),
-- 14. McWay Falls: waterfall, coast, hiking, wilderness
('c1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000010'),
('c1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000020'),
('c1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000014', 'd1000000-0000-0000-0000-000000000019'),
-- 15. Antelope Canyon: canyon, sandstone, desert, geology
('c1000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000022'),
('c1000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000030'),
('c1000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000013'),
('c1000000-0000-0000-0000-000000000015', 'd1000000-0000-0000-0000-000000000006'),
-- 16. Havasu Falls: waterfall, adventure, canyon, wilderness
('c1000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000010'),
('c1000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000009'),
('c1000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000022'),
('c1000000-0000-0000-0000-000000000016', 'd1000000-0000-0000-0000-000000000019'),
-- 17. Multnomah Falls: waterfall, pnw, hiking, forest
('c1000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000010'),
('c1000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000028'),
('c1000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000001'),
('c1000000-0000-0000-0000-000000000017', 'd1000000-0000-0000-0000-000000000015'),
-- 18. Maroon Bells: mountains, reflection, alpine, wilderness
('c1000000-0000-0000-0000-000000000018', 'd1000000-0000-0000-0000-000000000026'),
('c1000000-0000-0000-0000-000000000018', 'd1000000-0000-0000-0000-000000000018'),
('c1000000-0000-0000-0000-000000000018', 'd1000000-0000-0000-0000-000000000008'),
('c1000000-0000-0000-0000-000000000018', 'd1000000-0000-0000-0000-000000000019'),
-- 19. Painted Hills: geology, desert, volcanic, hiking
('c1000000-0000-0000-0000-000000000019', 'd1000000-0000-0000-0000-000000000006'),
('c1000000-0000-0000-0000-000000000019', 'd1000000-0000-0000-0000-000000000013'),
('c1000000-0000-0000-0000-000000000019', 'd1000000-0000-0000-0000-000000000012'),
('c1000000-0000-0000-0000-000000000019', 'd1000000-0000-0000-0000-000000000001'),
-- 20. Mesa Arch: arch, canyon, sunrise, desert
('c1000000-0000-0000-0000-000000000020', 'd1000000-0000-0000-0000-000000000023'),
('c1000000-0000-0000-0000-000000000020', 'd1000000-0000-0000-0000-000000000022'),
('c1000000-0000-0000-0000-000000000020', 'd1000000-0000-0000-0000-000000000005'),
('c1000000-0000-0000-0000-000000000020', 'd1000000-0000-0000-0000-000000000013');

-- ============================================================
-- COMMENTS (2 per spot = 40 total)
-- f1000000-0000-0000-0000-0000000000{01-40}
-- ============================================================
INSERT INTO public.comments (id, spot_id, author_id, body, created_at) VALUES
-- Spot 1 — Half Dome (authors: sierra, kate)
('f1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','Cables were terrifying but those 360 views made every step worth it. Nothing else compares.',now() - interval '55 days'),
('f1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','Woke up at 4am for the permit hike — sunrise from the top was something I''ll never forget.',now() - interval '50 days'),
-- Spot 2 — Grand Canyon South Rim (finn, maya)
('f1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','Watched sunrise from Mather Point and was genuinely moved to tears. Recommend it to everyone.',now() - interval '115 days'),
('f1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000005','Come in spring or fall, summer heat is punishing on the inner canyon trails.',now() - interval '110 days'),
-- Spot 3 — Hidden Lake Overlook (alex, kate)
('f1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','Saw three mountain goat families on the boardwalk. They own this place and they know it.',now() - interval '105 days'),
('f1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003','Snow on the trail in early July, bring microspikes — do not skip this.',now() - interval '100 days'),
-- Spot 4 — Angels Landing (alex, sierra)
('f1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','Permit required now — book months ahead. The new system actually makes the summit way less crowded.',now() - interval '145 days'),
('f1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','The Walter''s Wiggles switchbacks below are deceptively tiring. Pace yourself before the chains.',now() - interval '140 days'),
-- Spot 5 — Grand Prismatic Spring (kate, maya)
('f1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000003','Visit early morning before the boardwalk fills — steam rises dramatically in cool air.',now() - interval '125 days'),
('f1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000005','The sulfur smell is strong but you completely forget about it staring at those colors.',now() - interval '120 days'),
-- Spot 6 — Delicate Arch (sierra, finn)
('f1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000002','Golden hour turns the arch deep copper — absolutely worth staying for sunset.',now() - interval '35 days'),
('f1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004','The slickrock section mid-hike has no trail markers — look for cairns or you''ll go off route.',now() - interval '30 days'),
-- Spot 7 — Cadillac Mountain (alex, maya)
('f1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001','Drove up at 4:30am in October — zero other cars, completely alone for first light on the summit.',now() - interval '15 days'),
('f1000000-0000-0000-0000-000000000014','c1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000005','The carriage roads below are perfect for biking after you''ve done the summit.',now() - interval '12 days'),
-- Spot 8 — Clingmans Dome (finn, sierra)
('f1000000-0000-0000-0000-000000000015','c1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000004','Cloud-covered every time I''ve been — but even in the fog the old Fraser firs are hauntingly beautiful.',now() - interval '160 days'),
('f1000000-0000-0000-0000-000000000016','c1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000002','Closed in winter, try the Road Prong trail below for a quiet approach through old hemlocks.',now() - interval '155 days'),
-- Spot 9 — Hoh Rain Forest (maya, kate)
('f1000000-0000-0000-0000-000000000017','c1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000005','Go in November — fewer people and the mist and rain make it dramatically atmospheric.',now() - interval '190 days'),
('f1000000-0000-0000-0000-000000000018','c1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000003','The Hall of Mosses loop is short but you''ll spend an hour in there just staring straight up.',now() - interval '185 days'),
-- Spot 10 — Thor''s Hammer (kate, maya)
('f1000000-0000-0000-0000-000000000019','c1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000003','Do the Figure 8 combining Navajo Loop and Queen''s Garden — best circuit in the park.',now() - interval '70 days'),
('f1000000-0000-0000-0000-000000000020','c1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000005','Come in February for snow-dusted hoodoos — the contrast with the orange rock is otherworldly.',now() - interval '65 days'),
-- Spot 11 — Bear Lake (sierra, maya)
('f1000000-0000-0000-0000-000000000021','c1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000002','Dawn light on Hallett Peak reflected perfectly in still water — brought my whole family here.',now() - interval '45 days'),
('f1000000-0000-0000-0000-000000000022','c1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000005','Skip the loop and go straight up to Nymph, Dream, and Emerald — it only gets better.',now() - interval '40 days'),
-- Spot 12 — Crater Lake Rim (alex, finn)
('f1000000-0000-0000-0000-000000000023','c1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000001','Cloudcap Overlook has the best angle on the entire rim drive — worth the extra few miles.',now() - interval '85 days'),
('f1000000-0000-0000-0000-000000000024','c1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000004','Wizard Island boat tours book out months in advance — don''t wait until you arrive.',now() - interval '80 days'),
-- Spot 13 — Wonder Lake (kate, maya)
('f1000000-0000-0000-0000-000000000025','c1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000003','Mosquitoes are absolutely brutal mid-summer. A head net is not optional — bring two.',now() - interval '100 days'),
('f1000000-0000-0000-0000-000000000026','c1000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000005','The bus ride itself is incredible wildlife watching — bears, moose, and caribou herds all day.',now() - interval '95 days'),
-- Spot 14 — McWay Falls (alex, finn)
('f1000000-0000-0000-0000-000000000027','c1000000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000001','Parking lot fills by 9am — walk from the campsite down the road if you''re staying nearby.',now() - interval '140 days'),
('f1000000-0000-0000-0000-000000000028','c1000000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000004','Check Caltrans road conditions before driving south — Highway 1 closes constantly after storms.',now() - interval '135 days'),
-- Spot 15 — Antelope Canyon (sierra, kate)
('f1000000-0000-0000-0000-000000000029','c1000000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000002','Upper Antelope is tour-only for a reason — the midday light shafts in summer are remarkable.',now() - interval '170 days'),
('f1000000-0000-0000-0000-000000000030','c1000000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000003','Lower Antelope is cheaper and equally beautiful with smaller tour groups.',now() - interval '165 days'),
-- Spot 16 — Havasu Falls (finn, maya)
('f1000000-0000-0000-0000-000000000031','c1000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000004','Permits open February 1st and are gone within literal minutes — set multiple alarms.',now() - interval '130 days'),
('f1000000-0000-0000-0000-000000000032','c1000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000005','Bring cash for the tribal store, no card readers anywhere in the canyon.',now() - interval '125 days'),
-- Spot 17 — Multnomah Falls (alex, sierra)
('f1000000-0000-0000-0000-000000000033','c1000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000001','Come in winter after heavy rain — the flow is dramatically more powerful than summer.',now() - interval '3 days'),
('f1000000-0000-0000-0000-000000000034','c1000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000002','Latourell Falls just down the highway is far less crowded and equally spectacular.',now() - interval '2 days'),
-- Spot 18 — Maroon Bells (kate, maya)
('f1000000-0000-0000-0000-000000000035','c1000000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000003','September aspen color here beats anywhere else in Colorado — timing is everything though.',now() - interval '25 days'),
('f1000000-0000-0000-0000-000000000036','c1000000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000005','The mandatory shuttle from Aspen is actually well-organized, no complaints.',now() - interval '22 days'),
-- Spot 19 — Painted Hills (alex, sierra)
('f1000000-0000-0000-0000-000000000037','c1000000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000001','After rain the colors are 10x more vivid — check the forecast and plan around it.',now() - interval '165 days'),
('f1000000-0000-0000-0000-000000000038','c1000000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000002','Carroll Rim Trail above gives great context for the whole formation — short and very worthwhile.',now() - interval '160 days'),
-- Spot 20 — Mesa Arch (kate, finn)
('f1000000-0000-0000-0000-000000000039','c1000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000003','Show up 20 minutes before sunrise and stake your tripod spot — photographers fill it incredibly fast.',now() - interval '95 days'),
('f1000000-0000-0000-0000-000000000040','c1000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000004','One of the few Utah arches where you can walk right up and stand inside. Easy trail too.',now() - interval '90 days');

-- ============================================================
-- MEDIA (29 rows — bare storage paths, files uploaded separately)
-- Image dist: 3 spots × 3 imgs, 5 spots × 2 imgs, 10 spots × 1 img, 2 spots × 0 imgs
-- Spots 18 and 19 have no images.
-- ============================================================
INSERT INTO public.media (id, spot_id, url, type) VALUES
-- Spot 1 (1 image)
('e1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001/1.jpg','image'),
-- Spot 2 (2 images)
('e1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002/1.jpg','image'),
('e1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002/2.jpg','image'),
-- Spot 3 (3 images)
('e1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003/1.jpg','image'),
('e1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003/2.jpg','image'),
('e1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003/3.jpg','image'),
-- Spot 4 (1 image)
('e1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000004/1.jpg','image'),
-- Spot 5 (2 images)
('e1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000005/1.jpg','image'),
('e1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000005/2.jpg','image'),
-- Spot 6 (1 image)
('e1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000006','c1000000-0000-0000-0000-000000000006/1.jpg','image'),
-- Spot 7 (2 images)
('e1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000007/1.jpg','image'),
('e1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000007','c1000000-0000-0000-0000-000000000007/2.jpg','image'),
-- Spot 8 (1 image)
('e1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000008/1.jpg','image'),
-- Spot 9 (3 images)
('e1000000-0000-0000-0000-000000000014','c1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000009/1.jpg','image'),
('e1000000-0000-0000-0000-000000000015','c1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000009/2.jpg','image'),
('e1000000-0000-0000-0000-000000000016','c1000000-0000-0000-0000-000000000009','c1000000-0000-0000-0000-000000000009/3.jpg','image'),
-- Spot 10 (1 image)
('e1000000-0000-0000-0000-000000000017','c1000000-0000-0000-0000-000000000010','c1000000-0000-0000-0000-000000000010/1.jpg','image'),
-- Spot 11 (2 images)
('e1000000-0000-0000-0000-000000000018','c1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000011/1.jpg','image'),
('e1000000-0000-0000-0000-000000000019','c1000000-0000-0000-0000-000000000011','c1000000-0000-0000-0000-000000000011/2.jpg','image'),
-- Spot 12 (1 image)
('e1000000-0000-0000-0000-000000000020','c1000000-0000-0000-0000-000000000012','c1000000-0000-0000-0000-000000000012/1.jpg','image'),
-- Spot 13 (3 images)
('e1000000-0000-0000-0000-000000000021','c1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000013/1.jpg','image'),
('e1000000-0000-0000-0000-000000000022','c1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000013/2.jpg','image'),
('e1000000-0000-0000-0000-000000000023','c1000000-0000-0000-0000-000000000013','c1000000-0000-0000-0000-000000000013/3.jpg','image'),
-- Spot 14 (2 images)
('e1000000-0000-0000-0000-000000000024','c1000000-0000-0000-0000-000000000014','c1000000-0000-0000-0000-000000000014/1.jpg','image'),
('e1000000-0000-0000-0000-000000000025','c1000000-0000-0000-0000-000000000014','c1000000-0000-0000-0000-000000000014/2.jpg','image'),
-- Spot 15 (1 image)
('e1000000-0000-0000-0000-000000000026','c1000000-0000-0000-0000-000000000015','c1000000-0000-0000-0000-000000000015/1.jpg','image'),
-- Spot 16 (1 image)
('e1000000-0000-0000-0000-000000000027','c1000000-0000-0000-0000-000000000016','c1000000-0000-0000-0000-000000000016/1.jpg','image'),
-- Spot 17 (1 image)
('e1000000-0000-0000-0000-000000000028','c1000000-0000-0000-0000-000000000017','c1000000-0000-0000-0000-000000000017/1.jpg','image'),
-- Spot 20 (1 image) — spots 18 & 19 have none
('e1000000-0000-0000-0000-000000000029','c1000000-0000-0000-0000-000000000020','c1000000-0000-0000-0000-000000000020/1.jpg','image');
