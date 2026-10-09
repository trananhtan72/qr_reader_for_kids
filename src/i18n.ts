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
} as const;
