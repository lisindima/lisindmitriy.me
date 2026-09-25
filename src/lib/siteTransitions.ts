const contentPair = {
  old: {
    name: "site-content-out",
    duration: "0.24s",
    easing: "cubic-bezier(.4, 0, 1, 1)",
    fillMode: "both",
  },
  new: {
    name: "site-content-in",
    duration: "0.38s",
    delay: "0.035s",
    easing: "cubic-bezier(.16, 1, .3, 1)",
    fillMode: "both",
  },
};

const headerPair = {
  old: {
    name: "site-header-out",
    duration: "0.16s",
    easing: "cubic-bezier(.4, 0, 1, 1)",
    fillMode: "both",
  },
  new: {
    name: "site-header-in",
    duration: "0.34s",
    delay: "0.025s",
    easing: "cubic-bezier(.16, 1, .3, 1)",
    fillMode: "both",
  },
};

const contentTransition = {
  forwards: contentPair,
  backwards: contentPair,
};

const headerTransition = {
  forwards: headerPair,
  backwards: headerPair,
};

export const siteHeaderTransition = () => headerTransition;
export const siteContentTransition = () => contentTransition;
