document.addEventListener("click", (e) => {
  if (e.target.matches("[data-count-btn]")) handleCount(e.target);
});

function handleCount(button) {
  button.disabled = true;
  const pageCard = button.closest("[data-page-id]");
  fetch("/increase-count", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pageId: pageCard.dataset.pageId }),
  })
    .then((res) => res.json())
    .then(({ count }) => {
      const countElement = pageCard.querySelector("[data-count]");
      countElement.textContent = count;
    })
    .finally(() => {
      button.disabled = false;
    });
}
