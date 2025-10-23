export type TooltipTerm =
  | 'balfour'
  | 'settler-colonialism'
  | 'zionism'
  | 'nakba'
  | 'sumud';

export const TOOLTIP_CONTENT: Record<TooltipTerm, { title: string; text: string }> = {
  balfour: {
    title: 'Balfour Declaration (1917)',
    text: "A public statement issued by the British government announcing support for the establishment of a 'national home for the Jewish people' in Palestine—ignoring the political rights of the Palestinian majority."
  },
  'settler-colonialism': {
    title: 'Settler Colonialism',
    text: 'A colonial project premised on replacing indigenous populations with an invasive settler society that claims sovereignty over the land, often through elimination and erasure of native peoples.'
  },
  zionism: {
    title: 'Zionism',
    text: 'A late 19th-century European movement seeking to establish a Jewish-majority state in Palestine, requiring the systematic dispossession of Indigenous Palestinians to achieve demographic dominance.'
  },
  nakba: {
    title: 'The Nakba (1948)',
    text: 'Arabic for “The Catastrophe,” referring to the 1948 expulsion of over 750,000 Palestinians and destruction of more than 500 villages by Zionist militias and the Israeli military.'
  },
  sumud: {
    title: 'Sumud (صمود)',
    text: 'An Arabic term meaning steadfastness—the daily refusal to be erased through remaining on the land, preserving culture, and resisting occupation.'
  }
};
