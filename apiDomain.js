const getToken = () => localStorage.getItem("token") || "";
const apiDomain = "https://api-tasks.lockated.com/";

let baseURL = "";
let socketUrl = "";

const hostname = window.location.hostname;

switch (hostname) {
  case "task-management.lockated.com":
    baseURL = "https://api-tasks.lockated.com";
    socketUrl = "wss://uat-tasks.lockated.com/cable"
    break;
  case "projects.lockated.com":
    baseURL = "https://live-tasks.lockated.com";
    socketUrl = "wss://live-tasks.lockated.com/cable"
    break;
  case "uat-projects.lockated.com":
    baseURL = "https://uat-tasks.lockated.com";
    socketUrl = "wss://uat-tasks.lockated.com/cable"
    break;
  case "projects.gophygital.work":
    baseURL = "https://live-tasks.gophygital.work";
    socketUrl = "wss://live-tasks.gophygital.work/cable"
    break;
  case "localhost":
    baseURL = "https://uat-tasks.lockated.com";
    socketUrl = "wss://uat-tasks.lockated.com/cable"
    break;
  default:
    baseURL = "https://live-tasks.lockated.com";
    socketUrl = "wss://live-tasks.lockated.com/cable"
    break;
}

console.log("Base URL:", baseURL, " | Hostname:", hostname);

export { baseURL, socketUrl, apiDomain, getToken };
