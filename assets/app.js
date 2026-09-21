// ============================================================
// 配置文档 · 交互脚本
// 主题参数解析 / 目录高亮 / 搜索过滤 / 代码块与复制
// ============================================================

// ---------- 主题 ----------

const themeKeys = ["theme", "mode", "color_scheme", "color-scheme", "appearance"];
const themeAliases = {
  dark: "dark",
  night: "dark",
  black: "dark",
  light: "light",
  day: "light",
  white: "light",
};

function readThemeAlias(raw) {
  return (raw && themeAliases[raw.toLowerCase()]) || "";
}

function readThemeFromParams() {
  const params = new URLSearchParams(window.location.search);

  for (const key of themeKeys) {
    const theme = readThemeAlias(params.get(key));
    if (theme) return theme;
  }

  return "";
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme() {
  return readThemeFromParams() || readThemeAlias(localStorage.getItem("docs-theme")) || getSystemTheme();
}

// 是否由参数或本地存储显式指定了主题
function hasExplicitTheme() {
  return Boolean(readThemeFromParams() || readThemeAlias(localStorage.getItem("docs-theme")));
}

function applyTheme() {
  document.documentElement.dataset.theme = resolveTheme();
}

applyTheme();

// 未显式指定主题时，跟随系统深浅色变化实时切换
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  if (hasExplicitTheme()) return;
  applyTheme();
});

// ---------- 元素引用 ----------

const navLinks = [...document.querySelectorAll(".doc-nav a")];
const sections = [...document.querySelectorAll(".doc-body section")];
const searchInput = document.querySelector("#searchInput");

// ---------- 目录高亮 ----------

function setActiveLink(id) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting && !entry.target.classList.contains("hidden"))
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    setActiveLink(visible.target.id);
  },
  {
    rootMargin: "-20% 0px -65% 0px",
    threshold: [0.1, 0.3, 0.6],
  },
);

sections.forEach((section) => observer.observe(section));

// ---------- 搜索过滤 ----------

searchInput.addEventListener("input", (event) => {
  const keyword = event.target.value.trim().toLowerCase();

  sections.forEach((section) => {
    const text = `${section.dataset.title} ${section.textContent}`.toLowerCase();
    section.classList.toggle("hidden", Boolean(keyword) && !text.includes(keyword));
  });

  navLinks.forEach((link) => {
    const target = document.querySelector(link.getAttribute("href"));
    link.classList.toggle("hidden", Boolean(target) && target.classList.contains("hidden"));
  });
});

// ---------- 代码块：语言标签 + 复制 + 注释高亮 ----------

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightComments(code) {
  // 已有语法高亮的代码块保持原样，避免覆盖手工标注
  if (code.querySelector("span")) return;

  code.innerHTML = code.textContent
    .split("\n")
    .map((line) => {
      const match = line.match(/^(\s*)(#.*)$/);
      if (match) return `${match[1]}<span class="c-c">${escapeHtml(match[2])}</span>`;
      return escapeHtml(line);
    })
    .join("\n");
}

function buildCodeBlock(pre) {
  const code = pre.querySelector("code");
  if (!code) return;

  const block = document.createElement("div");
  block.className = "codeblock";
  pre.parentNode.insertBefore(block, pre);
  block.appendChild(pre);

  const head = document.createElement("div");
  head.className = "codeblock-head";

  const label = document.createElement("span");
  label.textContent = pre.dataset.lang || "bash";

  const button = document.createElement("button");
  button.className = "copy-btn";
  button.type = "button";
  button.textContent = "复制";
  button.setAttribute("aria-label", "复制代码");

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(code.textContent);
      button.textContent = "已复制";
      button.classList.add("is-copied");
    } catch {
      button.textContent = "复制失败";
    }

    window.setTimeout(() => {
      button.textContent = "复制";
      button.classList.remove("is-copied");
    }, 1200);
  });

  head.append(label, button);
  block.insertBefore(head, pre);

  highlightComments(code);
}

document.querySelectorAll("pre").forEach(buildCodeBlock);

// ---------- 内联复制 ----------

document.querySelectorAll(".copy-inline").forEach((item) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(item.textContent.trim());
      item.classList.add("is-copied");
    } catch {
      item.classList.add("is-failed");
      window.setTimeout(() => {
        item.classList.remove("is-failed");
      }, 900);
      return;
    }

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
