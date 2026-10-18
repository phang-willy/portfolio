-- Seed the v1 public catalog (projects, stacks, experiences) when those slugs are
-- still absent, and allow the longest legacy project description.

ALTER TABLE project
  ALTER COLUMN description TYPE VARCHAR(255);

INSERT INTO experience_contract_type (
  id, slug, code, title, lang, created_at, updated_at
)
SELECT
  seed.id,
  seed.slug,
  seed.code,
  seed.title,
  seed.lang,
  stamp.created_at,
  stamp.updated_at
FROM (
  VALUES
    (
      'b1000001-0000-4000-8000-000000000001'::uuid,
      'contrat-en-alternance',
      'contrat-en-alternance-fr',
      $txt$Contrat en Alternance$txt$,
      'fr'
    ),
    (
      'b1000001-0000-4000-8000-000000000002'::uuid,
      'contrat-en-alternance',
      'work-study-contract-en',
      $txt$Work-study contract$txt$,
      'en'
    )
) AS seed(id, slug, code, title, lang)
CROSS JOIN LATERAL (
  SELECT TIMESTAMPTZ '2020-01-01T00:00:00Z' AS created_at, TIMESTAMPTZ '2020-01-01T00:00:00Z' AS updated_at
) AS stamp
WHERE NOT EXISTS (
  SELECT 1
  FROM experience_contract_type existing
  WHERE existing.deleted_at IS NULL
    AND existing.lang = seed.lang
    AND (existing.slug = seed.slug OR existing.code = seed.code)
);

INSERT INTO experience (
  id,
  group_id,
  slug,
  year_start,
  year_end,
  role,
  company,
  summary,
  id_experience_contract_type,
  lang,
  created_at,
  updated_at
)
SELECT
  seed.id,
  seed.group_id,
  seed.slug,
  seed.year_start,
  seed.year_end,
  seed.role,
  seed.company,
  seed.summary,
  contract_type.id,
  seed.lang,
  make_timestamptz(seed.year_start, 1, 1, 0, 0, 0, 'UTC'),
  make_timestamptz(seed.year_end, 1, 1, 0, 0, 0, 'UTC')
FROM (
  VALUES
    (
      'c1000001-0000-4000-8000-000000000011'::uuid,
      'c1000001-0000-4000-8000-000000000001'::uuid,
      'dit-developpeur-full-stack-2023-2025-fr',
      2023::smallint,
      2025::smallint,
      $txt$Développeur Full Stack$txt$,
      'DIT',
      $txt$Développement d'applications de créances et de refurbushing$txt$,
      'fr'
    ),
    (
      'c1000001-0000-4000-8000-000000000012'::uuid,
      'c1000001-0000-4000-8000-000000000001'::uuid,
      'dit-full-stack-developer-2023-2025-en',
      2023::smallint,
      2025::smallint,
      $txt$Full Stack Developer$txt$,
      'DIT',
      $txt$Development of receivables and refurbishing applications$txt$,
      'en'
    ),
    (
      'c1000002-0000-4000-8000-000000000011'::uuid,
      'c1000002-0000-4000-8000-000000000001'::uuid,
      'dit-developpeur-wordpress-woocommerce-2022-2023-fr',
      2022::smallint,
      2023::smallint,
      $txt$Développeur WordPress/WooCommerce$txt$,
      'DIT',
      $txt$Développement WordPress/WooCommerce d'événements annuels de conférences et de formations dentaires$txt$,
      'fr'
    ),
    (
      'c1000002-0000-4000-8000-000000000012'::uuid,
      'c1000002-0000-4000-8000-000000000001'::uuid,
      'dit-wordpress-woocommerce-developer-2022-2023-en',
      2022::smallint,
      2023::smallint,
      $txt$WordPress/WooCommerce Developer$txt$,
      'DIT',
      $txt$WordPress/WooCommerce development for annual dental conference and training events$txt$,
      'en'
    ),
    (
      'c1000003-0000-4000-8000-000000000011'::uuid,
      'c1000003-0000-4000-8000-000000000001'::uuid,
      'logistib-integrateur-web-et-webmaster-2020-2022-fr',
      2020::smallint,
      2022::smallint,
      $txt$Intégrateur Web et Webmaster$txt$,
      'Logistib',
      $txt$Intégration de sites web et création de thèmes WordPress/WooCommerce, Shopify et Prestashop$txt$,
      'fr'
    ),
    (
      'c1000003-0000-4000-8000-000000000012'::uuid,
      'c1000003-0000-4000-8000-000000000001'::uuid,
      'logistib-web-integrator-webmaster-2020-2022-en',
      2020::smallint,
      2022::smallint,
      $txt$Web integrator & webmaster$txt$,
      'Logistib',
      $txt$Website integration and custom theme development on WordPress/WooCommerce, Shopify, and PrestaShop$txt$,
      'en'
    )
) AS seed(id, group_id, slug, year_start, year_end, role, company, summary, lang)
LEFT JOIN LATERAL (
  SELECT id
  FROM experience_contract_type
  WHERE deleted_at IS NULL
    AND slug = 'contrat-en-alternance'
    AND lang = seed.lang
  ORDER BY created_at, id
  LIMIT 1
) AS contract_type ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM experience existing
  WHERE existing.deleted_at IS NULL
    AND existing.slug = seed.slug
);

INSERT INTO stack (id, name, created_at, updated_at)
SELECT gen_random_uuid(), seed.name, TIMESTAMPTZ '2026-03-30T00:00:00Z', TIMESTAMPTZ '2026-03-30T00:00:00Z'
FROM (
  VALUES
    ('React'),
    ('TypeScript'),
    ('Tailwind CSS'),
    ('Next.js'),
    ('Golang'),
    ('PostgreSQL'),
    ('Docker'),
    ('Prisma'),
    ('NestJS'),
    ('Airtable'),
    ('Ollama'),
    ('IA'),
    ('WordPress'),
    ('WooCommerce'),
    ('PHP'),
    ('CSS'),
    ('JavaScript')
) AS seed(name)
WHERE NOT EXISTS (
  SELECT 1
  FROM stack existing
  WHERE existing.deleted_at IS NULL
    AND existing.name = seed.name
);

INSERT INTO project (
  id,
  title,
  slug,
  description,
  production_link,
  source_code_link,
  image_link,
  image_alt,
  lang,
  created_at,
  updated_at
)
SELECT
  seed.id,
  seed.title,
  seed.slug,
  seed.description,
  seed.production_link,
  seed.source_code_link,
  seed.image_link,
  seed.image_alt,
  seed.lang,
  seed.created_at,
  seed.updated_at
FROM (
  VALUES
    (
      'a1000001-0000-4000-8000-000000000001'::uuid,
      $txt$Twitch Watchlist$txt$,
      'twitch-watchlist',
      $txt$Extension Chrome permettant de gérer sa liste de watchlist sur Twitch, avec une interface moderne et intuitive.$txt$,
      'https://github.com/phang-willy/twitch-watchlist',
      'https://github.com/phang-willy/twitch-watchlist',
      '/project/twitch-watchlist.webp',
      $txt$Twitch Watchlist$txt$,
      'fr',
      TIMESTAMPTZ '2026-03-23T00:00:00Z',
      TIMESTAMPTZ '2026-03-25T00:00:00Z'
    ),
    (
      'a1000001-0000-4000-8000-000000000002'::uuid,
      $txt$Twitch Watchlist$txt$,
      'twitch-watchlist',
      $txt$Chrome extension to manage your Twitch watchlist with a modern, intuitive interface.$txt$,
      'https://github.com/phang-willy/twitch-watchlist',
      'https://github.com/phang-willy/twitch-watchlist',
      '/project/twitch-watchlist.webp',
      $txt$Twitch Watchlist$txt$,
      'en',
      TIMESTAMPTZ '2026-03-23T00:00:00Z',
      TIMESTAMPTZ '2026-03-25T00:00:00Z'
    ),
    (
      'a1000002-0000-4000-8000-000000000001'::uuid,
      $txt$Geolock$txt$,
      'geolock',
      $txt$Application de géolocalisation et suivi en temps réel de véhicules$txt$,
      'https://geolock.haillouy.fr/',
      'https://github.com/Matiss2702/geolock',
      '/project/geolock.webp',
      $txt$Geolock$txt$,
      'fr',
      TIMESTAMPTZ '2025-04-20T00:00:00Z',
      TIMESTAMPTZ '2026-03-01T00:00:00Z'
    ),
    (
      'a1000002-0000-4000-8000-000000000002'::uuid,
      $txt$Geolock$txt$,
      'geolock',
      $txt$Geolocation app with real-time vehicle tracking$txt$,
      'https://geolock.haillouy.fr/',
      'https://github.com/Matiss2702/geolock',
      '/project/geolock.webp',
      $txt$Geolock$txt$,
      'en',
      TIMESTAMPTZ '2025-04-20T00:00:00Z',
      TIMESTAMPTZ '2026-03-01T00:00:00Z'
    ),
    (
      'a1000003-0000-4000-8000-000000000001'::uuid,
      $txt$Portfolio$txt$,
      'portfolio',
      $txt$Portfolio personnel permettant de présenter mes projets et mes compétences.$txt$,
      'https://phangwilly.com/',
      'https://github.com/phang-willy/portfolio',
      '/project/portfolio.webp',
      $txt$Portfolio$txt$,
      'fr',
      TIMESTAMPTZ '2026-03-30T00:00:00Z',
      TIMESTAMPTZ '2026-04-04T00:00:00Z'
    ),
    (
      'a1000003-0000-4000-8000-000000000002'::uuid,
      $txt$Portfolio$txt$,
      'portfolio',
      $txt$Personal portfolio to showcase my projects and skills.$txt$,
      'https://phangwilly.com/',
      'https://github.com/phang-willy/portfolio',
      '/project/portfolio.webp',
      $txt$Portfolio$txt$,
      'en',
      TIMESTAMPTZ '2026-03-30T00:00:00Z',
      TIMESTAMPTZ '2026-04-04T00:00:00Z'
    ),
    (
      'a1000004-0000-4000-8000-000000000001'::uuid,
      $txt$IA Cooking Assistant$txt$,
      'ia-cooking-assistant',
      $txt$Application de cuisine assistée par IA, permettant de générer des recettes de cuisine en fonction des ingrédients disponibles et des préférences de l'utilisateur.$txt$,
      NULL,
      'https://github.com/Matiss2702/airtable-cuisine',
      NULL,
      $txt$IA Cooking Assistant$txt$,
      'fr',
      TIMESTAMPTZ '2025-04-08T00:00:00Z',
      TIMESTAMPTZ '2025-06-14T00:00:00Z'
    ),
    (
      'a1000004-0000-4000-8000-000000000002'::uuid,
      $txt$AI Cooking Assistant$txt$,
      'ia-cooking-assistant',
      $txt$AI-assisted cooking app that generates recipes based on available ingredients and user preferences.$txt$,
      NULL,
      'https://github.com/Matiss2702/airtable-cuisine',
      NULL,
      $txt$AI Cooking Assistant$txt$,
      'en',
      TIMESTAMPTZ '2025-04-08T00:00:00Z',
      TIMESTAMPTZ '2025-06-14T00:00:00Z'
    ),
    (
      'a1000005-0000-4000-8000-000000000001'::uuid,
      $txt$Parisii Optique$txt$,
      'parisii-optique',
      $txt$Site web et thème custom de la boutique Parisii Optique, intégré sur WordPress et WooCommerce.$txt$,
      'https://parisii-optique.fr/',
      'https://github.com/phang-willy/parisii-optique',
      '/project/parisii-optique.webp',
      $txt$Parisii Optique$txt$,
      'fr',
      TIMESTAMPTZ '2025-10-18T00:00:00Z',
      TIMESTAMPTZ '2026-03-05T00:00:00Z'
    ),
    (
      'a1000005-0000-4000-8000-000000000002'::uuid,
      $txt$Parisii Optique$txt$,
      'parisii-optique',
      $txt$Custom website and theme for the Parisii Optique store, built on WordPress and WooCommerce.$txt$,
      'https://parisii-optique.fr/',
      'https://github.com/phang-willy/parisii-optique',
      '/project/parisii-optique.webp',
      $txt$Parisii Optique$txt$,
      'en',
      TIMESTAMPTZ '2025-10-18T00:00:00Z',
      TIMESTAMPTZ '2026-03-05T00:00:00Z'
    )
) AS seed(
  id,
  title,
  slug,
  description,
  production_link,
  source_code_link,
  image_link,
  image_alt,
  lang,
  created_at,
  updated_at
)
WHERE NOT EXISTS (
  SELECT 1
  FROM project existing
  WHERE existing.deleted_at IS NULL
    AND existing.slug = seed.slug
);

INSERT INTO project_stacks (id, id_project, id_stack, created_at, updated_at)
SELECT gen_random_uuid(), project.id, stack.id, project.created_at, project.updated_at
FROM (
  VALUES
    ('twitch-watchlist', 'React'),
    ('twitch-watchlist', 'TypeScript'),
    ('twitch-watchlist', 'Tailwind CSS'),
    ('twitch-watchlist', 'Next.js'),
    ('geolock', 'React'),
    ('geolock', 'TypeScript'),
    ('geolock', 'Tailwind CSS'),
    ('geolock', 'Next.js'),
    ('geolock', 'Golang'),
    ('geolock', 'PostgreSQL'),
    ('geolock', 'Docker'),
    ('geolock', 'Prisma'),
    ('geolock', 'NestJS'),
    ('portfolio', 'Next.js'),
    ('portfolio', 'TypeScript'),
    ('portfolio', 'Tailwind CSS'),
    ('portfolio', 'React'),
    ('ia-cooking-assistant', 'Airtable'),
    ('ia-cooking-assistant', 'TypeScript'),
    ('ia-cooking-assistant', 'Tailwind CSS'),
    ('ia-cooking-assistant', 'Next.js'),
    ('ia-cooking-assistant', 'Ollama'),
    ('ia-cooking-assistant', 'IA'),
    ('parisii-optique', 'WordPress'),
    ('parisii-optique', 'WooCommerce'),
    ('parisii-optique', 'PHP'),
    ('parisii-optique', 'CSS'),
    ('parisii-optique', 'JavaScript'),
    ('parisii-optique', 'Tailwind CSS')
) AS wanted(slug, stack_name)
JOIN project
  ON project.slug = wanted.slug
 AND project.deleted_at IS NULL
JOIN LATERAL (
  SELECT id
  FROM stack
  WHERE deleted_at IS NULL
    AND name = wanted.stack_name
  ORDER BY created_at, id
  LIMIT 1
) AS stack ON TRUE
WHERE NOT EXISTS (
  SELECT 1
  FROM project_stacks existing
  WHERE existing.id_project = project.id
    AND existing.deleted_at IS NULL
);
