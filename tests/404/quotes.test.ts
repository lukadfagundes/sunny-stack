import {
  getRandomDeadEndQuote,
  getRandomSakeQuote,
  getRandomWinQuote,
  getNamiLine,
} from "@/components/404/quotes";

describe("getRandomDeadEndQuote", () => {
  it("returns a non-empty string", () => {
    const quote = getRandomDeadEndQuote();
    expect(typeof quote).toBe("string");
    expect(quote.length).toBeGreaterThan(0);
  });

  it("returns different quotes over multiple calls", () => {
    const quotes = new Set(Array.from({ length: 50 }, () => getRandomDeadEndQuote()));
    expect(quotes.size).toBeGreaterThan(1);
  });
});

describe("getRandomSakeQuote", () => {
  it("returns a non-empty string", () => {
    const quote = getRandomSakeQuote();
    expect(typeof quote).toBe("string");
    expect(quote.length).toBeGreaterThan(0);
  });

  it("returns different quotes over multiple calls", () => {
    const quotes = new Set(Array.from({ length: 50 }, () => getRandomSakeQuote()));
    expect(quotes.size).toBeGreaterThan(1);
  });
});

describe("getRandomWinQuote", () => {
  it("returns a non-empty string", () => {
    const quote = getRandomWinQuote();
    expect(typeof quote).toBe("string");
    expect(quote.length).toBeGreaterThan(0);
  });
});

describe("getNamiLine", () => {
  it("returns the first line at move 21", () => {
    const line = getNamiLine(21);
    expect(line).toBe("Zoro... the ship is that way.");
  });

  it("returns escalating lines for moves 22-39", () => {
    const line22 = getNamiLine(22);
    const line30 = getNamiLine(30);
    expect(line22).toBe("Hey. Wrong direction.");
    expect(line30).toBe("I swear you'd get lost in a hallway.");
  });

  it("returns the final line at move 40", () => {
    const line = getNamiLine(40);
    expect(line).toBe("THAT'S IT, I'M COMING TO GET YOU!");
  });

  it("clamps to last line for moves beyond 40", () => {
    const line = getNamiLine(100);
    expect(line).toBe("THAT'S IT, I'M COMING TO GET YOU!");
  });

  it("clamps to first line for moves below 21", () => {
    const line = getNamiLine(0);
    expect(line).toBe("Zoro... the ship is that way.");
  });
});
