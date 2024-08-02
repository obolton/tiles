import {
  MIN_LATITUDE,
  MAX_LATITUDE,
  MIN_LONGITUDE,
  MAX_LONGITUDE,
} from "@/constants/geo.ts";
import { IMAGE_CONTENT_TYPES } from "@/constants/images.ts";
import { getStream } from "@/utils/http.ts";

const MAPBOX_STYLE_USERNAME = "mapbox";
const MAPBOX_STYLE_ID = "streets-v12";
const ZOOM = 14;
const BEARING = 0;
const PITCH = 0;
const PIN_COLOR = "555555";

const MIN_DIMENSION = 100;
const MAX_DIMENSION = 1280;

const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

function validateCoordinates(long: number, lat: number) {
  if (
    long < MIN_LONGITUDE ||
    long > MAX_LONGITUDE ||
    lat < MIN_LATITUDE ||
    lat > MAX_LATITUDE
  ) {
    throw new Error(`Invalid coordinates: ${long},${lat}`);
  }
}

export async function getStaticMap({
  width,
  height,
  lat,
  long,
  boundingBox,
}: {
  width: number;
  height: number;
  lat: number;
  long: number;
  boundingBox: number[] | null;
}) {
  if (
    width < MIN_DIMENSION ||
    width > MAX_DIMENSION ||
    height < MIN_DIMENSION ||
    height > MAX_DIMENSION
  ) {
    throw new Error(`Invalid dimensions: ${width}x${height}`);
  }
  validateCoordinates(long, lat);
  if (boundingBox) {
    if (boundingBox.length !== 4) {
      throw new Error(`Invalid bounding box: ${boundingBox}`);
    }
    validateCoordinates(boundingBox[0], boundingBox[1]);
    validateCoordinates(boundingBox[2], boundingBox[3]);
  }
  const style = `${MAPBOX_STYLE_USERNAME}/${MAPBOX_STYLE_ID}`;
  const pin = `pin-s+${PIN_COLOR}(${long},${lat})`;
  const location =
    boundingBox && boundingBox.length === 4
      ? `[${boundingBox.join(",")}]`
      : `${long},${lat},${ZOOM},${BEARING},${PITCH}`;
  const size = `${Math.round(width)}x${Math.round(height)}`;
  const url = `https://api.mapbox.com/styles/v1/${style}/static/${pin}/${location}/${size}@2x?access_token=${MAPBOX_ACCESS_TOKEN}&logo=false`;
  return getStream(url, IMAGE_CONTENT_TYPES);
}
