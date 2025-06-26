console.log("meow");

const taskList = document.getElementById("task-list");
const form = document.getElementById("task-form");
const input = document.getElementById("task-input");

document.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();

  if (!text) return;
  saveTask(text);
  addTask(text);
  input.value = "";
});

function saveTask(text) {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  tasks.push(text);
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function addTask(text) {
  const li = document.createElement("li");
  li.className =
    "my-0.5 flex items-center gap-2 hover:bg-neutral-100 rounded-md px-2 py-2 cursor-pointer";
  const checkbox = document.createElement("span");

  checkbox.className =
    "inline-block size-4 rounded-full border border-neutral-500";
  const span = document.createElement("span");
  span.textContent = text;
  span.className = "text-sm";
  li.append(checkbox, span);
  taskList.appendChild(li);
  li.addEventListener("click", () => {
    li.remove();
    deleteTask(text);
  });
  input.value = "";
}

function deleteTask(text) {
  const tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
  const updated = tasks.filter((t) => t != text);
  localStorage.setItem("tasks", JSON.stringify(updated));
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = JSON.parse(localStorage.getItem("tasks") || "[]");
  saved.forEach((text) => {
    addTask(text);
  });
});
