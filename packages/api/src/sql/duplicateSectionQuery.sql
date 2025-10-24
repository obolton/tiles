-- @param {String} $1:pageId Page ID
-- @param {String} $2:sectionId Section ID
-- @param {String} $3:order Order key
-- TODO: Duplicate tile relations
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
    hide
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
    hide
  FROM tiles
  WHERE tiles.page_id = $1::uuid
    AND tiles.id = $2::uuid
    AND tiles.type = 'SECTION'
  RETURNING id, page_id
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
  WHERE sections.page_id = $1::uuid
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
  FROM tiles
  JOIN new_tile ON true
  WHERE tiles.page_id = $1::uuid
    AND tiles.section_id = $2::uuid
)
SELECT id
FROM new_tile;
