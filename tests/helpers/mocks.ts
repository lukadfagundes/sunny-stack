/* eslint-disable @typescript-eslint/no-require-imports */

// Framer Motion mock — replaces animated elements with plain divs
jest.mock("framer-motion", () => {
  const React = require("react");

  const FRAMER_PROPS = new Set([
    "initial", "animate", "exit", "transition", "variants",
    "whileHover", "whileTap", "whileInView", "layoutId",
    "layout", "onAnimationComplete",
  ]);

  const MotionProxy = React.forwardRef(
    function MotionProxy(props: Record<string, unknown>, ref: unknown) {
      const filtered: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        if (!FRAMER_PROPS.has(k)) filtered[k] = v;
      }
      return React.createElement("div", { ...filtered, ref });
    }
  );

  const motion = new Proxy(
    {},
    {
      get: () => MotionProxy,
    }
  );

  return {
    __esModule: true,
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    LayoutGroup: ({ children }: { children: React.ReactNode }) => children,
    useMotionValue: (val: number) => ({
      get: () => val,
      set: jest.fn(),
      on: jest.fn(),
    }),
    useTransform: (_value: unknown, _input: unknown, output?: unknown[]) => ({
      get: () => (Array.isArray(output) ? output[0] : 0),
      set: jest.fn(),
      on: jest.fn(),
    }),
    useScroll: () => ({
      scrollYProgress: { get: () => 0, set: jest.fn(), on: jest.fn() },
    }),
    useMotionValueEvent: jest.fn(),
    useInView: () => true,
    useReducedMotion: () => false,
  };
});

// Next.js navigation mock
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Next.js Link mock
jest.mock("next/link", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({
      children,
      href,
      ...props
    }: {
      children: React.ReactNode;
      href: string;
      [key: string]: unknown;
    }) => React.createElement("a", { href, ...props }, children),
  };
});

// Next.js Image mock
jest.mock("next/image", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) =>
      React.createElement("img", props),
  };
});

export {};
