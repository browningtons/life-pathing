// The first screen's offer: what a stranger reads before any number. Shown
// on the Life Path tab until the birthdate is the reader's own. It names the
// two lenses, what is free, and the price, in the almanac voice. The price
// comes from kit.config so it is said in one place.

export interface OfferCopy {
  /** Small caps line above the headline; the app's name. */
  eyebrow: string;
  /** What this is, in one sentence. */
  headline: string;
  /** What you get and what it costs, in one or two sentences. */
  body: string;
  /** The birthdate field's visible label. */
  inputLabel: string;
  /** The free / paid split, as two short rows beside the field. */
  rows: readonly { label: string; text: string }[];
  /** Labels the builder's sample, shown further down as an example. */
  exampleLabel: string;
  /** One line kept under the reader's own number: what is free, what the rest costs. */
  reminder: string;
  /** The helper beside the empty date field; it moves focus there, it does not submit. */
  numberButton: string;
  /** The quiet control that opens the collapsed example, and closes it again. */
  showExample: string;
  hideExample: string;
}

export function offerCopy(price: string, readingEnabled: boolean): OfferCopy {
  const shared = {
    eyebrow: 'Life Pathing',
    headline: 'Your Life Path number and your four letters of type, read together.',
    inputLabel: 'Your birthdate',
    exampleLabel: 'An example: the builder’s own birthdate',
    numberButton: 'See my number',
    showExample: 'Show the example',
    hideExample: 'Hide the example',
  };
  if (readingEnabled) {
    return {
      ...shared,
      reminder: `The opening of your Reading is free; the whole Reading is ${price}, once.`,
      body: `A birthdate gives the number and four letters give the type; a written Reading lays the two side by side. The opening is free, and the whole Reading is ${price}, once.`,
      rows: [
        { label: 'Free', text: 'Your Life Path number, how it is found, and the opening of your Reading.' },
        { label: `${price} once`, text: 'The whole Reading: six more sections, printable. No subscription, no account.' },
      ],
    };
  }
  return {
    ...shared,
    reminder: `The number and all sixteen types are free; the whole Profile is ${price}, once.`,
    body: `A birthdate gives the number and four letters give the type. The number and all sixteen types are free; the whole Profile is ${price}, once.`,
    rows: [
      { label: 'Free', text: 'Your Life Path number, how it is found, and the top of your Profile.' },
      { label: `${price} once`, text: 'The whole Profile below the line. No subscription, no account.' },
    ],
  };
}
