// cliente.js
const socket = io.connect();
const receptor_name = document.getElementById("receptor_name");

username.textContent = localStorage.getItem("username");
account_name = localStorage.getItem("username");



socket.on("connect", function(){
  socket.emit("MAIN_CONNECTED");
});

const sendMessageButton = document.getElementById('sendMessageButton');

sendMessageButton.addEventListener('click', () => {
  window.location.href = "../main/main.html";
  let project_name = document.getElementById('projectName').value;
  let due_date = document.getElementById('dueDate').value;
  let complexity = document.getElementById('complexity').value;
  var username = localStorage.getItem("username");
  // Crear un objeto con los dos campos
  const message = {
    operation: "NEW_PROJECT",
    username: username,
    project_name: project_name,
    due_date: due_date,
    state: "1",
    complexity: complexity

  };
  
  // Convierte el objeto a una cadena JSON antes de enviarlo
  socket.emit('message', JSON.stringify(message));
  
});

//FUNCIONES PARA LOS BOTONES
crear_proyecto.addEventListener('click', () => {
  window.location.href = "../new_proyect/new_proyect.html";

});

editar_proyecto.addEventListener('click', () => {
  window.location.href = "../edit_proyect/edit_proyect.html";

});

dashboard.addEventListener('click', () => {
  window.location.href = "../main/main.html";

});