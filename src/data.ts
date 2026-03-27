export type SyllableDef = {
  id: string; // Unique ID for the syllable instance
  text: string;
  messageIndex?: number; // 1-based index in the hidden message
};

export type ClueDef = {
  id: number;
  text: string;
  syllables: SyllableDef[];
};

export type PuzzleDef = {
  id: string;
  theme: string;
  clues: ClueDef[];
  hiddenMessage: string;
};

export const PUZZLE: PuzzleDef = {
  id: "SYL_001",
  theme: "Nature & Animals",
  hiddenMessage: "TIME FLIES",
  clues: [
    {
      id: 1,
      text: "Big cat with stripes",
      syllables: [
        { id: "s1_1", text: "TI", messageIndex: 1 },
        { id: "s1_2", text: "GER" },
      ],
    },
    {
      id: 2,
      text: "Snow house",
      syllables: [
        { id: "s2_1", text: "I", messageIndex: 2 },
        { id: "s2_2", text: "GLOO" },
      ],
    },
    {
      id: 3,
      text: "Sweet summer fruit",
      syllables: [
        { id: "s3_1", text: "ME", messageIndex: 3 },
        { id: "s3_2", text: "LON" },
      ],
    },
    {
      id: 4,
      text: "Large mammal with a trunk",
      syllables: [
        { id: "s4_1", text: "EL", messageIndex: 4 },
        { id: "s4_2", text: "E" },
        { id: "s4_3", text: "PHANT" },
      ],
    },
    {
      id: 5,
      text: "Blooming plant",
      syllables: [
        { id: "s5_1", text: "FLO", messageIndex: 5 },
        { id: "s5_2", text: "WER" },
      ],
    },
    {
      id: 6,
      text: "King of the jungle",
      syllables: [
        { id: "s6_1", text: "LI", messageIndex: 6 },
        { id: "s6_2", text: "ON" },
      ],
    },
    {
      id: 7,
      text: "Land surrounded by water",
      syllables: [
        { id: "s7_1", text: "I", messageIndex: 7 },
        { id: "s7_2", text: "SLAND" },
      ],
    },
    {
      id: 8,
      text: "Majestic bird of prey",
      syllables: [
        { id: "s8_1", text: "EA", messageIndex: 8 },
        { id: "s8_2", text: "GLE" },
      ],
    },
    {
      id: 9,
      text: "Slithering reptile",
      syllables: [
        { id: "s9_1", text: "SER", messageIndex: 9 },
        { id: "s9_2", text: "PENT" },
      ],
    },
  ],
};
