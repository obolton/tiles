-- @param {String} $1:pageId
-- @param {String} $2:sectionId
-- @param {String} $3:tileId
SELECT tile_a."order" AS a, tile_b."order" AS b
FROM tiles AS tile_a
LEFT JOIN LATERAL (
  SELECT "order" FROM tiles
  WHERE page_id = $1::uuid AND section_id = $2::uuid AND "order" > tile_a."order"
  ORDER BY "order" ASC
  LIMIT 1
) AS tile_b ON true
WHERE tile_a.page_id = $1::uuid
  AND tile_a.section_id = $2::uuid
  AND tile_a.id = $3::uuid;
