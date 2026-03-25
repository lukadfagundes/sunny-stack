// ── Zoro quote pools and random selectors ──

const DEAD_END_QUOTES = [
  "This is clearly a shortcut.",
  "The map is wrong, not me.",
  "I meant to come this way.",
  "Everyone else is lost, not me.",
  "This path has character.",
  "I'm taking the scenic route.",
  "North is... that way. Probably.",
  "Roads are just suggestions anyway.",
  "I don't need directions. Directions need me.",
  "If I keep going, I'll end up where I started. That's basically navigation.",
  "The Sunny moved. I didn't.",
  "Tch. Another dead end that shouldn't exist.",
];

const SAKE_QUOTES = [
  "*takes a long sip* ...What was I doing again?",
  "One drink won't hurt. ...Okay maybe two.",
  "A swordsman needs fuel. This counts.",
  "I'll find the ship after this bottle.",
  "This sake is better than directions anyway.",
  "Cheers to being completely lost.",
  "*hic* ...Which way was the ship?",
  "Sake now, navigation... eventually.",
];

const WIN_QUOTES = [
  "See? I knew exactly where I was going.",
  "Told you it was a shortcut.",
  "I wasn't lost. I was... scouting.",
  "The Sunny was the one that was lost, not me.",
];

// 20 escalating Nami lines, one per move from 21-40
// Severity increases with each step
const NAMI_LINES: string[] = [
  "Zoro... the ship is that way.",                        // 21 - calm
  "Hey. Wrong direction.",                                // 22
  "Are you even trying?",                                 // 23
  "The ship is LITERALLY right there.",                   // 24
  "I can SEE the Sunny from here!",                       // 25
  "Zoro. Turn around. Now.",                              // 26
  "How are you getting FURTHER away?!",                   // 27
  "LEFT! YOUR OTHER LEFT!",                               // 28
  "I'm not asking anymore. GO STRAIGHT.",                 // 29
  "I swear you'd get lost in a hallway.",                 // 30 - mid frustration
  "ZORO! THE SHIP IS RIGHT THERE!",                       // 31
  "I'm adding navigation lessons to your debt.",          // 32
  "That's it, I'm getting the newspaper.",                // 33
  "Even Luffy has better directions than you!",           // 34
  "TURN. AROUND. RIGHT. NOW.",                            // 35 - yelling
  "I WILL come down there and DRAG you back!",            // 36
  "YOU OWE ME 500,000 BERRIES FOR THIS!",                 // 37
  "RORONOA ZORO GET BACK HERE THIS INSTANT!",             // 38
  "I'M DONE. I AM ABSOLUTELY DONE.",                      // 39
  "THAT'S IT, I'M COMING TO GET YOU!",                    // 40 - final
];

export function getRandomDeadEndQuote(): string {
  return DEAD_END_QUOTES[Math.floor(Math.random() * DEAD_END_QUOTES.length)];
}

export function getRandomSakeQuote(): string {
  return SAKE_QUOTES[Math.floor(Math.random() * SAKE_QUOTES.length)];
}

export function getRandomWinQuote(): string {
  return WIN_QUOTES[Math.floor(Math.random() * WIN_QUOTES.length)];
}

export function getNamiLine(moveCount: number): string {
  const index = Math.min(moveCount - 21, NAMI_LINES.length - 1);
  return NAMI_LINES[Math.max(0, index)];
}
