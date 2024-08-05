// cliente.js
const socket = io.connect();

const sendMessageButton = document.getElementById('sendMessageButton');


document.addEventListener("DOMContentLoaded", function() {
  // La página se ha cargado completamente, ejecutar funciones aquí

  // socket.on("port", function(data){
  //   localStorage.setItem("port", data);
  //   console.log(data);
  // });
  
  socket.on("login_success", function(){  
    window.location.href = "main/main.html";
  });

  socket.on("login_fail_user", function(){
    alert("El usuario no existe");
  }
  );

  socket.on("login_fail_password", function(){
    alert("Contraseña incorrecta");
  }
  );

  socket.emit("CLIENT_CONNECTED");

});

//al enviar el formulario, se envía un mensaje al servidor TCP
//con los datos del formulario
document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  console.log("Form submitted");
  // Add your code here to send the form data to the TCP server

  let username = document.getElementById('username').value;
  let password = document.getElementById('password').value;

  // Crear un objeto con los dos campos
  const message = {
    operation: "LOGIN",
    name: "name",
    username: username,
    password: password,
    age: "age",
    email: "email"
  };
   localStorage.setItem("username", username);
  // Convierte el objeto a una cadena JSON antes de enviarlo
  socket.emit('message', JSON.stringify(message));
  console.log("enviado mensaje");
});

