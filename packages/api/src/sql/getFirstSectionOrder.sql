-- @param {String} $1:pageId
SELECT "order"
FROM sections
WHERE page_id = $1::uuid
ORDER BY "order" ASC
LIMIT 1;
