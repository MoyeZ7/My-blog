function setMessage(message) {
  document.querySelector("#login-message").textContent = message;
}

function showLogin() {
  document.querySelector("#dashboard-view").classList.add("is-hidden");
  document.querySelector("#login-view").classList.remove("is-hidden");
}

document.querySelector("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  setMessage("后台交互将在下一步接入 API。");
});

document.querySelector("#logout-button").addEventListener("click", () => {
  showLogin();
});

showLogin();
