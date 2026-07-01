import type Section from "@/models/Section";
import type Text from "@/models/Text";
import type Image from "@/models/Image";
import type Video from "@/models/Video";
import type Link from "@/models/Link";
import type PageLink from "@/models/PageLink";
import type Table from "@/models/Table";
import type Chart from "@/models/Chart";

export type TileVariant = Section | Text | Image | Video | Link | PageLink | Table | Chart;
