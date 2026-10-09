/** All user-facing strings. Add a second language by adding a sibling object. */
export const t = {
  appName: "What's This?",
  hearIt: 'Hear it',
  slowly: 'Slowly',
  home: 'Home',
  alsoCalled: (nickname: string) => `also called ${nickname}`,
  hearNickname: (nickname: string) => `Hear ${nickname}`,
  unknownTitle: "I don't know this one yet",
  unknownBody: 'Ask a grown-up to check the label.',
  homeHint: 'Point the Camera at a label to start!',
  parentGate: 'Grown-ups: press and hold',
  labelsTitle: 'Print labels',
  labelsOrigin: 'Codes open:',
  labelsLocalWarning:
    'This is a local address. Labels printed now will only work on this network, while this computer is serving the app. Set VITE_LABEL_ORIGIN to your deployed address before printing for real.',
  labelSize: 'Label size',
  inches: (n: number) => `${n}″ × ${n}″`,
  selectAll: 'Select all',
  selectNone: 'Select none',
  print: 'Print',
  printTip: 'Print at 100% scale ("Actual size"), not "Fit to page". Untick labels you don\'t need.',
  selectedCount: (n: number, total: number) => `${n} of ${total} labels selected`,
} as const;
