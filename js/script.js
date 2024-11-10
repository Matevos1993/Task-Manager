"use strict";

const form = document.forms[0];
const form2 = document.forms[1];
const table = document.getElementById("table");
const addTask = document.getElementById("addTask");
const newTask = document.getElementById("newTask");
const editTask = document.getElementById("editTask");
const closeBtn = document.getElementById("close");
const options = document.querySelectorAll("option");
const editTaskClose = document.getElementById("editTaskClose");
const sortSelect = document.querySelector(".sortOptions");
const sortButton = document.getElementById("sortButton");
const mainBody = document.createElement("div");
const searchInput = document.getElementById("searchInput");
const deleteAll = document.getElementById("deleteAll");
const regex = /^\+?[0-9]{2,3}[-\s.]?[0-9]{2,3}[-\s.]?[0-9]{4,8}$/;

table.append(mainBody);

const taskArray = [];
const taskObjTemplate = {
  id: null,
  title: "",
  status: null,
  statusClass: null,
  startDate: new Date().toISOString().split('T')[0], // Today's date
  endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // One year from today
  task: "",
  address: "",
  mobile: "",
  email: "",
  comment: "",
  files: [],
  sort: "",
  meinId: null,
};

// Event Handlers
addTask.onclick = () => {
  newTask.classList.add("active");
  // Pre-fill dates with default values
  const startDateInput = form.querySelector('input[type="date"]');
  const endDateInput = form.querySelectorAll('input[type="date"]')[1];
  
  if (startDateInput && endDateInput) {
    startDateInput.value = taskObjTemplate.startDate;
    endDateInput.value = taskObjTemplate.endDate;
  }
};

editTaskClose.onclick = () => editTask.classList.remove("active");

closeBtn.onclick = () => {
  newTask.classList.remove("active");
  form.reset();
};

searchInput.addEventListener("input", () => {
  const body = document.querySelectorAll(".body");
  const searchValue = searchInput.value.toLowerCase();
  
  body.forEach(elm => {
    const shouldShow = searchValue === "" || 
      taskArray.some(task => 
        task.meinId == elm.dataset.meinId && 
        Object.values(task)
          .filter(val => typeof val === "string")
          .some(val => val.toLowerCase().includes(searchValue))
      );
    
    elm.classList.toggle("hidden", !shouldShow);
  });
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const taskObj = { ...taskObjTemplate };
  const getInputValue = (i) => form[i].value.trim() || "";

  if (!regex.test(getInputValue(7)) && getInputValue(7) !== "") {
    showWarning({
      title: "Invalid Phone Number",
      content: "Please enter a valid phone number format (e.g. +XX-XXX-XXXXXXX)",
    });
    return;
  }

  taskObj.id = Date.now();
  taskObj.title = getInputValue(1);
  taskObj.status = getInputValue(2);
  taskObj.startDate = getInputValue(3) || taskObjTemplate.startDate; // Use default if not provided
  taskObj.endDate = getInputValue(4) || taskObjTemplate.endDate; // Use default if not provided
  taskObj.task = getInputValue(5);
  taskObj.address = getInputValue(6);
  taskObj.mobile = getInputValue(7);
  taskObj.email = getInputValue(8);
  taskObj.comment = getInputValue(9);
  taskObj.files = getInputValue(10);
  taskObj.meinId = taskArray.length;

  const selectedOption = Array.from(options).find(elm => elm.value === taskObj.status);
  taskObj.statusClass = selectedOption?.classList.value || '';

  if (taskObj.task && taskObj.startDate && taskObj.title && taskObj.status) {
    const taskElement = createTask(taskObj);
    mainBody.append(taskElement);
    taskArray.push(taskObj);
    newTask.classList.remove("active");
    saveTaskToLocalStorage(taskObj);
    form.reset();
  } else {
    showWarning({
      title: "Missing Required Fields",
      content: "Please fill in all required fields (Title, Task, Start Date, and Status)",
    });
  }
});

const createTask = (obj) => {
  const body = document.createElement("div");
  const row = document.createElement("div");
  const dropBtn = document.createElement("div");
  const bodySort = document.createElement("div");
  const sortText = document.createElement("p");
  const titleBox = document.createElement("div");
  const title = document.createElement("p");
  const taskBox = document.createElement("div");
  const task = document.createElement("p");
  const statusBox = document.createElement("div");
  const status = document.createElement("p");
  const buttons = document.createElement("div");
  const dropdown = document.createElement("div");

  body.classList.add("body");
  row.classList.add("row");
  dropBtn.classList.add("dropdown-button");
  buttons.classList.add("buttons");
  dropdown.classList.add("dropdown");
  [statusBox, titleBox, taskBox, bodySort].forEach(el => el.classList.add(obj.statusClass));

  dropBtn.innerHTML = `<button><i class="bi bi-arrow-down"></i></button>`;
  buttons.innerHTML = `
    <span class="button2" title="Edit Task"><i class="bi bi-pencil-square"></i></span>
    <span class="button3" title="Delete Task"><i class="bi bi-trash"></i></span>
  `;
  
  title.textContent = obj.title;
  task.textContent = obj.task;
  status.textContent = obj.status;
  sortText.textContent = obj.sort;
  body.dataset.meinId = obj.meinId;

  titleBox.append(title);
  taskBox.append(task);
  statusBox.append(status);
  row.append(dropBtn, statusBox, titleBox, taskBox, bodySort, buttons);
  bodySort.append(sortText);
  dropdown.appendChild(createTaskDetailsList(obj));
  body.append(row, dropdown);

  buttons.querySelector(".button2").onclick = () => {
    editTask.classList.add("active");
    populateForm(obj);
  };

  buttons.querySelector(".button3").onclick = () => {
    warn(warnText('Are you sure you want to delete this task?'));
    const deleteTask = document.getElementById("deleteTask");
    const cancelAction = document.getElementById("cancelAction");
    
    deleteTask.onclick = () => {
      body.remove();
      const index = taskArray.indexOf(obj);
      if (index > -1) {
        taskArray.splice(index, 1);
        deleteTaskFromLocalStorage(obj.id);
      }
      warnRemove();
    };
    
    cancelAction.onclick = warnRemove;
  };

  dropBtn.onclick = () => dropdown.classList.toggle("dropActive");

  return body;
};

const populateForm = (task) => {
  const formFields = [
    { index: 0, value: task.title },
    { index: 1, value: task.task },
    { index: 2, value: task.endDate },
    { index: 3, value: task.status },
    { index: 4, value: task.address },
    { index: 5, value: task.mobile },
    { index: 6, value: task.email },
    { index: 7, value: task.files },
    { index: 8, value: task.comment }
  ];

  formFields.forEach(field => form2[field.index].value = field.value);

  form2.onsubmit = (e) => {
    e.preventDefault();
    const index = taskArray.findIndex(t => t.id === task.id);
    const getInputValue = (i) => form2[i].value.trim() || "";

    if (!regex.test(getInputValue(5)) && getInputValue(5) !== "") {
      showWarning({
        title: "Invalid Phone Number",
        content: "Please enter a valid phone number format (e.g. +XX-XXX-XXXXXXX)",
      });
      return;
    }

    if (index >= 0) {
      const updatedTask = {
        ...taskArray[index],
        ...taskObjTemplate,
        id: task.id,
        title: getInputValue(0),
        task: getInputValue(1),
        endDate: form2[2].value || taskObjTemplate.endDate,
        startDate: taskArray[index].startDate,
        status: form2[3].value,
        address: getInputValue(4),
        mobile: getInputValue(5),
        email: getInputValue(6),
        files: form2[7].value,
        comment: getInputValue(8)
      };

      const selectedOption = Array.from(options).find(elm => elm.value === updatedTask.status);
      updatedTask.statusClass = selectedOption?.classList.value || '';

      if (updatedTask.task && updatedTask.startDate && updatedTask.title && updatedTask.status) {
        deleteTaskFromLocalStorage(updatedTask.id);
        taskArray.splice(index, 1, updatedTask);
        editTask.classList.remove("active");
        sortAndUpdateTable();
        saveTaskToLocalStorage(updatedTask);
        form2.reset();
      } else {
        showWarning({
          title: "Missing Required Fields",
          content: "Please fill in all required fields (Title, Task, Start Date, and Status)",
        });
      }
    }
  };
};

const sortTasks = () => {
  if (sortSelect.value) {
    const sortFunctions = {
      title: (a, b) => a.title.localeCompare(b.title),
      status: (a, b) => a.statusClass.localeCompare(b.statusClass),
      startDate: (a, b) => new Date(a.startDate) - new Date(b.startDate),
      endDate: (a, b) => new Date(a.endDate) - new Date(b.endDate)
    };

    taskArray.sort(sortFunctions[sortSelect.value] || (() => 0));
    taskArray.forEach(elm => elm.sort = elm[sortSelect.value] || "");
  }
};

const createTaskDetailsList = (obj) => {
  const ul = document.createElement("ul");
  const details = [
    { label: "Title", value: obj.title },
    { label: "Task", value: obj.task },
    { label: "Status", value: obj.status },
    { label: "Start Date", value: obj.startDate },
    { label: "End Date", value: obj.endDate },
    { label: "Address", value: obj.address },
    { label: "Mobile", value: obj.mobile },
    { label: "E-mail", value: obj.email },
    { label: "Comment", value: obj.comment }
  ];

  details
    .filter(detail => detail.value)
    .forEach(detail => {
      const li = document.createElement("li");
      li.textContent = `${detail.label}: ${detail.value}`;
      ul.appendChild(li);
    });

  return ul;
};

const sortAndUpdateTable = () => {
  mainBody.innerHTML = "";
  sortTasks();
  taskArray.forEach(task => mainBody.append(createTask(task)));
};

sortButton.addEventListener("click", sortAndUpdateTable);

deleteAll.onclick = () => {
  warn(warnText('Are you sure you want to delete all tasks?'));
  const deleteTask = document.getElementById("deleteTask");
  const cancelAction = document.getElementById("cancelAction");
  
  deleteTask.onclick = () => {
    mainBody.innerHTML = "";
    taskArray.length = 0;
    localStorage.removeItem("tasks");
    warnRemove();
  };
  
  cancelAction.onclick = warnRemove;
};

const saveTaskToLocalStorage = (taskObj) => {
  const existingTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  existingTasks.push(taskObj);
  localStorage.setItem("tasks", JSON.stringify(existingTasks));
};

const loadTasksFromLocalStorage = () => {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  tasks.forEach(task => {
    const taskElement = createTask(task);
    mainBody.append(taskElement);
    taskArray.push(task);
  });
};

const deleteTaskFromLocalStorage = (taskId) => {
  const existingTasks = JSON.parse(localStorage.getItem("tasks")) || [];
  const updatedTasks = existingTasks.filter(task => task.id !== taskId);
  localStorage.setItem("tasks", JSON.stringify(updatedTasks));
};

const showWarning = (message) => {
  const warnText = `
    <p>⚠️ <strong>${message.title}</strong></p>
    <p>${message.content}</p>
    <div>
      <button id="cancelAction">Close</button>
    </div>`;

  warn(warnText);
  document.getElementById("cancelAction").onclick = warnRemove;
};

const warnText = (title) => `
  <p>⚠️ ${title}</p>
  <div>
    <button id="deleteTask">Delete</button>
    <button id="cancelAction">Cancel</button>
  </div>`;

const warn = (warnText) => {
  const warningBox = document.querySelector(".warningBox");
  warningBox.innerHTML = warnText;
  warning.classList.add("active");
};

const warnRemove = () => {
  const warningBox = document.querySelector(".warningBox");
  warningBox.innerHTML = "";
  warning.classList.remove("active");
};

window.onload = loadTasksFromLocalStorage;
