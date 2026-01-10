-- @param {String} $1:pageId The page ID
-- @param {String} $2:sectionId? The section ID
SELECT "order"
FROM tiles
WHERE page_id = $1::uuid AND section_id IS NOT DISTINCT FROM $2::uuid
ORDER BY "order" DESC
LIMIT 1;
