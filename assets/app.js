const links = [...document.querySelectorAll(".toc a")];
const sections = [...document.querySelectorAll("section")];
const searchInput = document.querySelector("#searchInput");
const sidebar = document.querySelector("#sidebar");
const menuButton = document.querySelector("#menuButton");
const codeBlocks = [...document.querySelectorAll("pre")];
const inlineCopyItems = [...document.querySelectorAll(".copy-inline")];

const themeKeys = ["theme", "mode", "color_scheme", "color-scheme", "appearance"];
const themeAliases = {
  dark: "dark",
  night: "dark",
  black: "dark",
  light: "light",
  day: "light",
  white: "light",
};

function readThemeFromParams() {
  const params = new URLSearchParams(window.location.search);

  for (const key of themeKeys) {
    const value = params.get(key);
    const theme = value && themeAliases[value.toLowerCase()];
    if (theme) return theme;
  }

  return "";
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;

  if (persist) {
    localStorage.setItem("docs-theme", theme);
  }
}

function resolveInitialTheme() {
  return readThemeFromParams() || localStorage.getItem("docs-theme") || getSystemTheme();
}

applyTheme(resolveInitialTheme(), false);

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    links.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  {
    rootMargin: "-20% 0px -65% 0px",
    threshold: [0.1, 0.3, 0.6],
  },
);

sections.forEach((section) => observer.observe(section));

searchInput.addEventListener("input", (event) => {
  const keyword = event.target.value.trim().toLowerCase();

  sections.forEach((section) => {
    const text = `${section.dataset.title} ${section.textContent}`.toLowerCase();
    section.classList.toggle("hidden", Boolean(keyword) && !text.includes(keyword));
  });
});

menuButton.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

links.forEach((link) => {
  link.addEventListener("click", () => {
    sidebar.classList.remove("open");
  });
});

codeBlocks.forEach((block) => {
  const code = block.querySelector("code");
  if (!code) return;

  const button = document.createElement("button");
  button.className = "code-copy";
  button.type = "button";
  button.textContent = "复制";
  button.setAttribute("aria-label", "复制代码");
  block.append(button);

  button.addEventListener("click", async () => {
    await navigator.clipboard.writeText(code.textContent);
    button.textContent = "已复制";
    button.classList.add("is-copied");

    window.setTimeout(() => {
      button.textContent = "复制";
      button.classList.remove("is-copied");
    }, 1200);
  });
});

inlineCopyItems.forEach((item) => {
  const copy = async () => {
    await navigator.clipboard.writeText(item.textContent.trim());
    item.classList.add("is-copied");

    window.setTimeout(() => {
      item.classList.remove("is-copied");
    }, 900);
  };

  item.addEventListener("click", copy);
  item.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    copy();
  });
});
