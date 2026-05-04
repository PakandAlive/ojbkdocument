const links = [...document.querySelectorAll(".toc a")];
const sections = [...document.querySelectorAll("section")];
const searchInput = document.querySelector("#searchInput");
const sidebar = document.querySelector("#sidebar");
const menuButton = document.querySelector("#menuButton");

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
