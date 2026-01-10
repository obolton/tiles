-- @param {String} $1:pageId The page ID
-- @param {String} $2:sectionId? The section ID
-- @param {String} $3:tileId The ID of the tile to insert before
SELECT tile_a."order" AS a, tile_b."order" AS b
FROM tiles AS tile_b
LEFT JOIN LATERAL (
  SELECT "order" FROM tiles
  WHERE page_id = $1::uuid
    AND section_id IS NOT DISTINCT FROM $2::uuid
    AND "order" < tile_b."order"
  ORDER BY "order" DESC
  LIMIT 1
) AS tile_a ON true
WHERE tile_b.page_id = $1::uuid
  AND tile_b.section_id IS NOT DISTINCT FROM $2::uuid
  AND tile_b.id = $3::uuid;
