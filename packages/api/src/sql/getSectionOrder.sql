-- @param {String} $1:pageId
-- @param {String} $2:sectionId
SELECT section_a."order" AS a, section_b."order" AS b
FROM sections AS section_a
LEFT JOIN LATERAL (
  SELECT "order" FROM sections
  WHERE page_id = $1::uuid AND "order" > section_a."order"
  ORDER BY "order" ASC
  LIMIT 1
) AS section_b ON true
WHERE section_a.page_id = $1::uuid AND section_a.id = $2::uuid;
