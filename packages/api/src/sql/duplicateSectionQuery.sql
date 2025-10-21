-- @param {String} $1:pageId Page ID
-- @param {String} $2:sectionId Section ID
-- @param {String} $3:order Order key
-- TODO: Duplicate tile relations
WITH new_section AS (
  INSERT INTO sections (
    id,
    page_id,
    "order",
    background_color,
    background_gradient,
    background_image_id,
    layout,
    anchor,
    dimensions,
    width,
    height,
    hide
  )
  SELECT
    gen_random_uuid(),
    page_id,
    $3,
    background_color,
    background_gradient,
    background_image_id,
    layout,
    anchor,
    dimensions,
    width,
    height,
    hide
  FROM sections
  WHERE page_id = $1::uuid AND id = $2::uuid
  RETURNING id
),
new_tiles AS (
  INSERT INTO tiles (
    id,
    page_id,
    section_id,
    type,
    position,
    width,
    height,
    row_span,
    x,
    y,
    block,
    image_tile_id,
    video_tile_id,
    text_tile_id,
    map_tile_id,
    link_tile_id,
    page_link_tile_id,
    table_id,
    chart_id
  )
  SELECT
    gen_random_uuid(),
    page_id,
    new_section.id,
    type,
    position,
    width,
    height,
    row_span,
    x,
    y,
    block,
    image_tile_id,
    video_tile_id,
    text_tile_id,
    map_tile_id,
    link_tile_id,
    page_link_tile_id,
    table_id,
    chart_id
  FROM tiles
  JOIN new_section ON true
  WHERE page_id = $1::uuid AND section_id = $2::uuid
)
SELECT id
FROM new_section;
