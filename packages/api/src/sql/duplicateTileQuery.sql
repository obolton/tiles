-- @param {String} $1:pageId Page ID
-- @param {String} $2:id Tile ID to duplicate
-- @param {String} $3:order Order key
WITH new_tile AS (
  INSERT INTO tiles (
    id,
    page_id,
    section_id,
    type,
    "order",
    anchor,
    dimensions,
    width,
    height,
    row_span,
    x,
    y,
    block,
    animation,
    hide,
    dock,
    theme_id
  )
  SELECT
    gen_random_uuid(),
    page_id,
    section_id,
    type,
    $3,
    anchor,
    dimensions,
    width,
    height,
    row_span,
    x,
    y,
    block,
    animation,
    hide,
    dock,
    theme_id
  FROM tiles
  WHERE tiles.page_id = $1::uuid
    AND tiles.id = $2::uuid
  RETURNING id, page_id, type
),
new_text_tile AS (
  INSERT INTO text_tiles (
    id,
    page_id,
    content,
    text_color,
    background_color,
    background_gradient,
    background_image_id,
    align
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    content,
    text_color,
    background_color,
    background_gradient,
    background_image_id,
    align
  FROM text_tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'TEXT'
    AND text_tiles.page_id = $1::uuid
    AND text_tiles.id = $2::uuid
  RETURNING id
),
new_image_tile AS (
  INSERT INTO image_tiles (
    id,
    page_id,
    image_id,
    origin_x,
    origin_y,
    text
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    image_id,
    origin_x,
    origin_y,
    text
  FROM image_tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'IMAGE'
    AND image_tiles.page_id = $1::uuid
    AND image_tiles.id = $2::uuid
  RETURNING id
),
new_video_tile AS (
  INSERT INTO video_tiles (
    id,
    page_id,
    video_type,
    video_id,
    original_image_url,
    title,
    description
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    video_type,
    video_id,
    original_image_url,
    title,
    description
  FROM video_tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'VIDEO'
    AND video_tiles.page_id = $1::uuid
    AND video_tiles.id = $2::uuid
  RETURNING id
),
new_link_tile AS (
  INSERT INTO link_tiles (
    id,
    page_id,
    url,
    title,
    description,
    site_name,
    original_image_url
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    url,
    title,
    description,
    site_name,
    original_image_url
  FROM link_tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'LINK'
    AND link_tiles.page_id = $1::uuid
    AND link_tiles.id = $2::uuid
  RETURNING id
),
new_page_link_tile AS (
  INSERT INTO page_link_tiles (
    id,
    page_id,
    linked_page_id
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    linked_page_id
  FROM page_link_tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'PAGE_LINK'
    AND page_link_tiles.page_id = $1::uuid
    AND page_link_tiles.id = $2::uuid
  RETURNING id
),
new_map_tile AS (
  INSERT INTO map_tiles (
    id,
    page_id,
    style
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    style
  FROM map_tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'MAP'
    AND map_tiles.page_id = $1::uuid
    AND map_tiles.id = $2::uuid
  RETURNING id
),
new_places AS (
  INSERT INTO places (
    id,
    name,
    lat,
    long,
    bounding_box,
    address,
    provider_id,
    map_tile_id
  )
  SELECT
    gen_random_uuid(),
    name,
    lat,
    long,
    bounding_box,
    address,
    provider_id,
    new_map_tile.id
  FROM places
  JOIN new_map_tile ON true
  WHERE places.map_tile_id = $2::uuid
),
new_table_tile AS (
  INSERT INTO table_tiles (
    id,
    page_id,
    text_color,
    background_color,
    background_gradient,
    background_image_id
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    text_color,
    background_color,
    background_gradient,
    background_image_id
  FROM table_tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'TABLE'
    AND table_tiles.page_id = $1::uuid
    AND table_tiles.id = $2::uuid
  RETURNING id
),
new_table_columns AS (
  INSERT INTO table_columns (
    id,
    table_id,
    "order",
    title,
    width,
    background_color,
    background_gradient,
    background_image_id
  )
  SELECT
    gen_random_uuid(),
    new_table_tile.id,
    "order",
    title,
    width,
    background_color,
    background_gradient,
    background_image_id
  FROM table_columns
  JOIN new_table_tile ON true
  WHERE table_columns.table_id = $2::uuid
  RETURNING id, "order"
),
-- Map old column IDs to new column IDs (matched by order) so we can
-- transform the row data to reference the new columns
column_id_mapping AS (
  SELECT
    old_cols.id AS old_id,
    new_cols.id AS new_id
  FROM table_columns old_cols
  JOIN new_table_columns new_cols ON old_cols."order" = new_cols."order"
  WHERE old_cols.table_id = $2::uuid
),
new_table_rows AS (
  INSERT INTO table_rows (
    id,
    table_id,
    "order",
    height,
    data,
    background_color,
    background_gradient,
    background_image_id
  )
  SELECT
    gen_random_uuid(),
    new_table_tile.id,
    table_rows."order",
    height,
    COALESCE(
      (
        SELECT jsonb_object_agg(m.new_id::text, kv.value)
        FROM jsonb_each(table_rows.data) AS kv(key, value)
        JOIN column_id_mapping m ON m.old_id::text = kv.key
      ),
      '{}'::jsonb
    ),
    background_color,
    background_gradient,
    background_image_id
  FROM table_rows
  JOIN new_table_tile ON true
  WHERE table_rows.table_id = $2::uuid
),
new_chart_tile AS (
  INSERT INTO charts (
    id,
    page_id,
    table_id,
    label_column_id,
    text_color,
    background_color,
    background_gradient,
    background_image_id
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    table_id,
    label_column_id,
    text_color,
    background_color,
    background_gradient,
    background_image_id
  FROM charts
  JOIN new_tile ON true
  WHERE new_tile.type = 'CHART'
    AND charts.page_id = $1::uuid
    AND charts.id = $2::uuid
  RETURNING id
),
new_section AS (
  INSERT INTO sections (
    id,
    page_id,
    layout,
    background_color,
    background_gradient,
    background_image_id
  )
  SELECT
    new_tile.id,
    new_tile.page_id,
    layout,
    background_color,
    background_gradient,
    background_image_id
  FROM sections
  JOIN new_tile ON true
  WHERE new_tile.type = 'SECTION'
    AND sections.page_id = $1::uuid
    AND sections.id = $2::uuid
  RETURNING id
),
new_child_tiles AS (
  INSERT INTO tiles (
    id,
    page_id,
    section_id,
    type,
    "order",
    anchor,
    dimensions,
    width,
    height,
    row_span,
    x,
    y,
    block,
    animation,
    hide
  )
  SELECT
    gen_random_uuid(),
    new_tile.page_id,
    new_tile.id,
    tiles.type,
    "order",
    anchor,
    dimensions,
    width,
    height,
    row_span,
    x,
    y,
    block,
    animation,
    hide
  FROM tiles
  JOIN new_tile ON true
  WHERE new_tile.type = 'SECTION'
    AND tiles.page_id = $1::uuid
    AND tiles.section_id = $2::uuid
)
SELECT id
FROM new_tile;
