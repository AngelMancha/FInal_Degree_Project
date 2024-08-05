// cliente.js
const socket = io.connect();

const sendMessageButton = document.getElementById('sendMessageButton');


document.addEventListener("DOMContentLoaded", function() {
  // La página se ha cargado completamente, ejecutar funciones aquí

//   socket.on("login_success", function(){  
//     window.location.href = "main/main.html";
//   });

//   socket.on("login_fail_user", function(){
//     alert("El usuario no existe");
//   }
//   );

//   socket.on("login_fail_password", function(){
//     alert("Contraseña incorrecta");
//   }
//   );

  socket.emit("REGISTER_CONNECTED");

});

//al enviar el formulario, se envía un mensaje al servidor TCP
//con los datos del formulario
document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  console.log("Form submitted");
  // Add your code here to send the form data to the TCP server

  let username = document.getElementById('username').value;
  let password = document.getElementById('password').value;
  let email = document.getElementById('email').value;

  let password2 = document.getElementById('password_repeat').value;
  if (password != password2){
    alert("Las contraseñas no coinciden");
    return;
  }

  // Crear un objeto con los dos campos
  const message = {
    operation: "REGISTER",
    username: username,
    password: password,
    email: email
  };
  // Convierte el objeto a una cadena JSON antes de enviarlo
  socket.emit('message', JSON.stringify(message));
  console.log("enviado mensaje");

  location.href = "../index.html";
});

