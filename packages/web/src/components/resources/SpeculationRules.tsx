const SPECULATION_RULES = {
  prerender: [
    {
      where: {
        and: [
          {
            href_matches: ["/", "/workspaces/*", "/pages/:id"],
          },
          {
            not: { selector_matches: '[target="_blank"]' },
          },
        ],
      },
      eagerness: "moderate",
    },
  ],
};

export default function SpeculationRules() {
  return <script type="speculationrules">{JSON.stringify(SPECULATION_RULES)}</script>;
}
