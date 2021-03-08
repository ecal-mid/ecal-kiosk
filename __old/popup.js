const { ipcRenderer } = require("electron");

let password;

ipcRenderer.on("currURL", (event, message) => {
  id("newURL").value = message;
});

ipcRenderer.on("password", (event, message) => {
  password = message;
  id("newPassword").value = message;
  id("password").focus();
  if (password == "") {
    id("unauthentified").classList.remove("visible");
    id("authentified").classList.add("visible");
    id("newURL").focus();
  }
});

ipcRenderer.on("passwordChanged", (event, message) => {
  alert("password changed!");
});

//id("sendURL").addEventListener("click", sendNewURL);
id("close").addEventListener("click", () => {
  ipcRenderer.send("closeSettings", "");
});
id("quitKiosk").addEventListener("click", () => {
  ipcRenderer.send("quit", "");
});

id("newURLForm").addEventListener("submit", (e) => {
  e.preventDefault();
  ipcRenderer.send("newURL", id("newURL").value);
  return false;
});

id("newPWForm").addEventListener("submit", (e) => {
  e.preventDefault();
  ipcRenderer.send("newPW", id("newPassword").value);
  return false;
});

id("checkPW").addEventListener("submit", (e) => {
  e.preventDefault();
  if (id("password").value == password) {
    id("unauthentified").classList.remove("visible");
    id("authentified").classList.add("visible");
    id("newURL").focus();
  }
  return false;
});

function id(selector) {
  return document.querySelector(selector);
}
