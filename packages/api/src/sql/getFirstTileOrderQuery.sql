-- @param {String} $1:pageId
-- @param {String} $2:sectionId
SELECT "order"
FROM tiles
WHERE page_id = $1::uuid AND section_id = $2::uuid
ORDER BY "order" ASC
LIMIT 1;
