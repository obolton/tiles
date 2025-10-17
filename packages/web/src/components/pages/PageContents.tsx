import Each from "@/jsx/each";
import SectionComponent from "@/components/layouts/section/Section";
import type { ReactiveArray } from "@/utils/reactivity";
import type Section from "@/models/Section";

export interface PageContentsProps {
  sections: ReactiveArray<Section>;
}

export default function PageContents({ sections }: PageContentsProps) {
  return (
    <Each items={sections}>
      {(section) => <SectionComponent section={section} />}
    </Each>
  );
}
