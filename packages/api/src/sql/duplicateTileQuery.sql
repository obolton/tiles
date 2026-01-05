-- @param {String} $1:pageId Page ID
-- @param {String} $2:id Tile ID to duplicate
-- @param {String} $3:order Order key for the new tile
-- @param {String} $4:sectionId? Section ID (NULL for top-level tiles)
SELECT duplicate_tile($1::uuid, $2::uuid, $3, $4::uuid) AS id;
