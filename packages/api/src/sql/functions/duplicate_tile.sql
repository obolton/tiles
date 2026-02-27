-- Duplicates a tile and all its associated data (type-specific data, child tiles, etc.)
-- Returns the new tile's ID
--
-- Parameters:
--   p_page_id: The page containing the tile
--   p_tile_id: The tile to duplicate
--   p_new_order: The order key for the new tile
--   p_new_section_id: The section to place the new tile in (NULL for top-level)
CREATE OR REPLACE FUNCTION duplicate_tile(
  p_page_id UUID,
  p_tile_id UUID,
  p_new_order TEXT,
  p_new_section_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_new_id UUID := gen_random_uuid();
  v_tile_type TEXT;
  v_child RECORD;
  v_column_mapping JSONB;
BEGIN
  -- Insert base tile and capture its type
  INSERT INTO tiles (
    id, page_id, section_id, type, "order", anchor, sizing,
    width, height, row_span, x, y, block, animation, hide, dock, theme_id
  )
  SELECT
    v_new_id, page_id, p_new_section_id, type, p_new_order, anchor, sizing,
    width, height, row_span, x, y, block, animation, hide, dock, theme_id
  FROM tiles
  WHERE page_id = p_page_id AND id = p_tile_id
  RETURNING type INTO v_tile_type;

  -- Handle type-specific data
  CASE v_tile_type
    WHEN 'TEXT' THEN
      INSERT INTO text_tiles (id, page_id, content, text_color, background_color, background_gradient, background_image_id, align)
      SELECT v_new_id, p_page_id, content, text_color, background_color, background_gradient, background_image_id, align
      FROM text_tiles
      WHERE id = p_tile_id AND page_id = p_page_id;

    WHEN 'IMAGE' THEN
      INSERT INTO image_tiles (id, page_id, image_id, origin_x, origin_y, text)
      SELECT v_new_id, p_page_id, image_id, origin_x, origin_y, text
      FROM image_tiles
      WHERE id = p_tile_id AND page_id = p_page_id;

    WHEN 'VIDEO' THEN
      INSERT INTO video_tiles (id, page_id, video_type, video_id, original_image_url, title, description)
      SELECT v_new_id, p_page_id, video_type, video_id, original_image_url, title, description
      FROM video_tiles
      WHERE id = p_tile_id AND page_id = p_page_id;

    WHEN 'LINK' THEN
      INSERT INTO link_tiles (id, page_id, url, title, description, site_name, original_image_url)
      SELECT v_new_id, p_page_id, url, title, description, site_name, original_image_url
      FROM link_tiles
      WHERE id = p_tile_id AND page_id = p_page_id;

    WHEN 'PAGE_LINK' THEN
      INSERT INTO page_link_tiles (id, page_id, linked_page_id)
      SELECT v_new_id, p_page_id, linked_page_id
      FROM page_link_tiles
      WHERE id = p_tile_id AND page_id = p_page_id;

    WHEN 'MAP' THEN
      INSERT INTO map_tiles (id, page_id, style)
      SELECT v_new_id, p_page_id, style
      FROM map_tiles
      WHERE id = p_tile_id AND page_id = p_page_id;

      -- Duplicate all places on this map
      INSERT INTO places (id, name, lat, long, bounding_box, address, provider_id, map_tile_id)
      SELECT gen_random_uuid(), name, lat, long, bounding_box, address, provider_id, v_new_id
      FROM places
      WHERE map_tile_id = p_tile_id;

    WHEN 'TABLE' THEN
      INSERT INTO table_tiles (id, page_id, text_color, background_color, background_gradient, background_image_id)
      SELECT v_new_id, p_page_id, text_color, background_color, background_gradient, background_image_id
      FROM table_tiles
      WHERE id = p_tile_id AND page_id = p_page_id;

      -- Duplicate columns and build old->new ID mapping using order field
      WITH new_columns AS (
        INSERT INTO table_columns (id, table_id, "order", title, width, background_color, background_gradient, background_image_id)
        SELECT gen_random_uuid(), v_new_id, "order", title, width, background_color, background_gradient, background_image_id
        FROM table_columns
        WHERE table_id = p_tile_id
        RETURNING id, "order"
      )
      SELECT jsonb_object_agg(old_cols.id::text, new_cols.id::text)
      INTO v_column_mapping
      FROM table_columns old_cols
      JOIN new_columns new_cols ON old_cols."order" = new_cols."order"
      WHERE old_cols.table_id = p_tile_id;

      -- Duplicate rows, transforming data JSONB to reference new column IDs
      INSERT INTO table_rows (id, table_id, "order", height, data, background_color, background_gradient, background_image_id)
      SELECT
        gen_random_uuid(),
        v_new_id,
        "order",
        height,
        COALESCE(
          (
            SELECT jsonb_object_agg(v_column_mapping->>kv.key, kv.value)
            FROM jsonb_each(data) AS kv(key, value)
            WHERE v_column_mapping ? kv.key
          ),
          '{}'::jsonb
        ),
        background_color,
        background_gradient,
        background_image_id
      FROM table_rows
      WHERE table_id = p_tile_id;

    WHEN 'CHART' THEN
      -- Chart references an existing table, so column IDs remain valid
      INSERT INTO charts (id, page_id, table_id, label_column_id, text_color, background_color, background_gradient, background_image_id)
      SELECT v_new_id, p_page_id, table_id, label_column_id, text_color, background_color, background_gradient, background_image_id
      FROM charts
      WHERE id = p_tile_id AND page_id = p_page_id;

      INSERT INTO chart_series (id, chart_id, column_id, type, color, gradient)
      SELECT gen_random_uuid(), v_new_id, column_id, type, color, gradient
      FROM chart_series
      WHERE chart_id = p_tile_id;

    WHEN 'SECTION' THEN
      INSERT INTO sections (id, page_id, layout, background_color, background_gradient, background_image_id)
      SELECT v_new_id, p_page_id, layout, background_color, background_gradient, background_image_id
      FROM sections
      WHERE id = p_tile_id AND page_id = p_page_id;

      -- Recursively duplicate all child tiles, preserving their order
      FOR v_child IN
        SELECT id, "order" FROM tiles
        WHERE page_id = p_page_id AND section_id = p_tile_id
        ORDER BY "order"
      LOOP
        PERFORM duplicate_tile(p_page_id, v_child.id, v_child."order", v_new_id);
      END LOOP;

    ELSE
      NULL; -- Unknown type: base tile created, type-specific data skipped
  END CASE;

  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql;
