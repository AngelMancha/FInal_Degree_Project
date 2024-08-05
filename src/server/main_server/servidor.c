#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
#include <pthread.h>
#include <stdbool.h>
#include "comunicacion.h"
#include "implementacion.h"
#include <dirent.h>
#include <sys/stat.h>
#include "cJSON.h"
#include <arpa/inet.h>
#include <curl/curl.h>

#define DDBB_SERVER_PORT 8888
#define DDBB_TCP_SERVER_PORT 5000
#define MAX_BUFFER_SIZE 1024

pthread_mutex_t lock = PTHREAD_MUTEX_INITIALIZER;

pthread_mutex_t mutex_mensaje;
int mensaje_no_copiado;
pthread_cond_t cond_mensaje;

struct MemoryStruct {
    char *memory;
    size_t size;
};

static size_t write_memory_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;

    char *ptr = realloc(mem->memory, mem->size + realsize + 1);
    if(ptr == NULL) {
        /* out of memory! */
        printf("not enough memory (realloc returned NULL)\n");
        return 0;
    }

    mem->memory = ptr;
    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;

    return realsize;
}

void tratar_mensaje(void *sd_client_tratar) {
    char buffer[MAX_BUFFER_SIZE];
    struct proyecto *proyectos = NULL;

    pthread_mutex_lock(&mutex_mensaje);
    int sd_client = *(int *)sd_client_tratar;
    char *ip_cliente = malloc(16);

    mensaje_no_copiado = false;
    pthread_cond_signal(&cond_mensaje);
	pthread_mutex_unlock(&mutex_mensaje);

    // Obtaining the IP of the client
    struct sockaddr_in addr;
    socklen_t addr_len = sizeof(addr);
    if (getpeername(sd_client, (struct sockaddr*)&addr, &addr_len) == 0) {
        char client_ip[INET_ADDRSTRLEN];
        inet_ntop(AF_INET, &addr.sin_addr, client_ip, sizeof(client_ip));
        sprintf(ip_cliente, "%s", client_ip);
        printf("Client connected from IP: %s\n", client_ip);
    } else {
        perror("Error while obtaining the client IP");
    }
    ssize_t bytes_received = recv(sd_client, buffer, sizeof(buffer), 0);
    if (bytes_received == -1) {
        perror("Error while receiving data from the client");
        exit(EXIT_FAILURE);
    }
    // Analyzing the JSON
    cJSON *json = cJSON_Parse(buffer);
    if (json == NULL) {
        fprintf(stderr, "Error while analysing JSON: %s\n", cJSON_GetErrorPtr());
        exit(EXIT_FAILURE);
    }
    // Obtaining the operation and the json fields later
    const char *operation = cJSON_GetObjectItem(json, "operation")->valuestring;

    if (strcmp(operation, "LOGIN") == 0) {
        //Login the user

        printf("ip_cliente: %s\n", ip_cliente);
        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *password = cJSON_GetObjectItem(json, "password")->valuestring;

        char *url = malloc(strlen(username) + strlen(password) + 255);
        sprintf(url, "http://bbdd-service:9000/login?username=%s&password=%s", username, password);
        int accion = 1;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);

    } else if (strcmp(operation, "REGISTER") == 0) {
        //Register the user

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *password = cJSON_GetObjectItem(json, "password")->valuestring;
        char *email = cJSON_GetObjectItem(json, "email")->valuestring;

        char *username_encoded = encode_url(username);
        char *password_encoded = encode_url(password);
        char *email_encoded = encode_url(email);


        char *register_url = malloc(strlen(username) + strlen(password) + strlen(email) + 255);
        sprintf(register_url, "http://bbdd-service:9000/register?username=%s&password=%s&email=%s", username_encoded, password_encoded, email_encoded);
        int accion = 0;
        mongodb(sd_client, register_url, accion);
        close(sd_client);
        free(register_url);
    } else if (strcmp(operation, "NEW_PROJECT") == 0) {
        //Create a new project

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *proyect_name = cJSON_GetObjectItem(json, "project_name")->valuestring;
        char *due_date = cJSON_GetObjectItem(json, "due_date")->valuestring;
        char *state = cJSON_GetObjectItem(json, "state")->valuestring;
        char *complexity = cJSON_GetObjectItem(json, "complexity")->valuestring;

        char *username_encoded = encode_url(username);
        char *proyect_name_encoded = encode_url(proyect_name);
        char *due_date_encoded = encode_url(due_date);
        char *state_encoded = encode_url(state);
        char *complexity_encoded = encode_url(complexity);

        char *new_project_url = malloc(strlen(username) + strlen(proyect_name) + strlen(due_date) + strlen(state) + strlen(complexity) + 255);
        sprintf(new_project_url, "http://bbdd-service:9000/crear_proyecto?nombre_usuario=%s&nombre_proyecto=%s&deadline=%s&state=%s&complexity=%s", username_encoded, proyect_name_encoded, due_date_encoded, state_encoded, complexity_encoded);
        int accion = 0;
        mongodb(sd_client, new_project_url, accion);
        close(sd_client);
        free(new_project_url);

    }  else if (strcmp(operation, "EDIT_TASK") == 0){
        //Edit a task of the project

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *proyect_name = cJSON_GetObjectItem(json, "project_name")->valuestring;
        char *task = cJSON_GetObjectItem(json, "task")->valuestring;
        char *state = cJSON_GetObjectItem(json, "state")->valuestring;
        char *due_date = cJSON_GetObjectItem(json, "due_date")->valuestring;
        char *members = cJSON_GetObjectItem(json, "members")->valuestring;

        char *url = malloc (strlen(username) + strlen(proyect_name) + strlen(task) + strlen(state) + strlen(due_date) + strlen(members) + 555);
        sprintf(url, "http://bbdd-service:9000/editar_tarea?&nombre_usuario=%s&nombre_proyecto=%s&nombre_tarea=%s&estado=%s&deadline=%s&members=%s", username, proyect_name, task, state, due_date, members);

        int accion = 0;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);

    }else if (strcmp(operation, "ADD_TASK") == 0){
        //Add a task to the project

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *proyect_name = cJSON_GetObjectItem(json, "project_name")->valuestring;
        char *task = cJSON_GetObjectItem(json, "task")->valuestring;
        char *due_date = cJSON_GetObjectItem(json, "due_date")->valuestring;
        char *members = cJSON_GetObjectItem(json, "members")->valuestring;

        char *url = malloc (strlen(username) + strlen(proyect_name) + strlen(task) + strlen(due_date) + strlen(members) + 555);
        sprintf(url, "http://bbdd-service:9000/crear_tarea?&nombre_usuario=%s&nombre_proyecto=%s&nombre_tarea=%s&deadline=%s&members=%s", username, proyect_name, task, due_date, members);

        int accion = 0;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);

    } else if (strcmp(operation, "ADD_MEMBER") == 0) {
        //Add a member to the project

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *proyect_name = cJSON_GetObjectItem(json, "project_name")->valuestring;
        char *member = cJSON_GetObjectItem(json, "member")->valuestring;

        char *url = malloc (strlen(username) + strlen(proyect_name) + strlen(member) + 555);
        sprintf(url, "http://bbdd-service:9000/add_member?&nombre_usuario=%s&nombre_proyecto=%s&miembro=%s", username, proyect_name, member);

        int accion = 1;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);

    } else if (strcmp(operation, "ESTADISTICAS") == 0) {
        //Calculate the statistics of the user to the Node.js server

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;

        char *url_calculate = malloc (strlen(username) + 255);
        sprintf(url_calculate, "http://bbdd-service:9000/calcular_estadisticas?&nombre_usuario=%s", username);
        int accion = 1;
        mongodb(sd_client, url_calculate, accion);
        close(sd_client);
        free(url_calculate);

    } else if (strcmp(operation, "SINGLE")== 0 || (strcmp(operation , "TASKS")) == 0) {
        //Send the tasks of the project to the Node.js server

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *proyect_name = cJSON_GetObjectItem(json, "project_name")->valuestring;

        char *url = malloc (strlen(username)+ strlen(proyect_name)+ 255);
        sprintf(url, "http://bbdd-service:9000/obtener_tareas?&nombre_usuario=%s&nombre_proyecto=%s", username, proyect_name);
        int accion = 1;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);

    }else if (strcmp(operation, "SINGLE_MEMBERS")== 0){
        //Send the members of the project to the Node.js server
        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *proyect_name = cJSON_GetObjectItem(json, "project_name")->valuestring;

        char *url = malloc (strlen(username)+ strlen(proyect_name)+ 255);
        sprintf(url, "http://bbdd-service:9000/obtener_miembros?&nombre_usuario=%s&nombre_proyecto=%s", username, proyect_name);
        int accion = 1;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);
    }
    else if (strcmp(operation, "CHAT_INICIAL_SENDER") == 0) {
            //Brings from the database the chat history between the sender and the receiver and updates the ip of the sender

        char *sender = cJSON_GetObjectItem(json, "sender")->valuestring;
        char *receiver = cJSON_GetObjectItem(json, "receiver")->valuestring;

        char *url = malloc (strlen(sender) + strlen(receiver) + 255);
        sprintf(url, "http://bbdd-service:9000/bring_chat?sender=%s&receiver=%s", sender, receiver);
        int accion = 1;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);

        //Update the ip of the sender
        char *url_new_ip = malloc (strlen(ip_cliente)+ strlen(sender)+ 255);
        sprintf(url_new_ip, "http://bbdd-service:9000/update_ip?new_ip=%s&sender=%s", ip_cliente, sender);
        int accion2 = 1;
        mongodb(sd_client, url_new_ip, accion2);
        close(sd_client);
        free(url_new_ip);

    } else if (strcmp(operation, "WRITE_CLIENT_ID") == 0){
        //Stores de client_id in the database

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;
        char *client_id = cJSON_GetObjectItem(json, "client_id")->valuestring;

        char *url = malloc (strlen(username) + strlen(client_id) + 255);
        sprintf(url, "http://bbdd-service:9000/write_client_id?username=%s&client_id=%s", username, client_id);
        int accion = 0;
        mongodb(sd_client, url, accion);
        close(sd_client);
        free(url);

    } else if  (strcmp(operation, "NEW_MESSAGE") == 0) {

        //1ST: The new message is stored in the database

        char *sender = cJSON_GetObjectItem(json, "sender")->valuestring;
        char *receiver = cJSON_GetObjectItem(json, "receiver")->valuestring;
        char *message = cJSON_GetObjectItem(json, "message")->valuestring;
        char *date = cJSON_GetObjectItem(json, "date")->valuestring;

        char* sender_encoded = encode_url(sender);
        char* receiver_encoded = encode_url(receiver);
        char* message_encoded = encode_url(message);
        char* date_encoded = encode_url(date);

        char *url_message = malloc(strlen(sender_encoded) + strlen(receiver_encoded) + strlen(message_encoded) + strlen(date_encoded) + 255);
        sprintf(url_message, "http://bbdd-service:9000/nuevo_mensaje?sender=%s&receiver=%s&message=%s&date=%s", sender_encoded, receiver_encoded, message_encoded, date_encoded);
        int accion = 0;
        mongodb(sd_client, url_message, accion);
        free(url_message);


        //2nd: We obtain the receiver's client_id of the socket and IP and send the message to him

        char *url_client_id= malloc(strlen(receiver) + 255);
        sprintf(url_client_id, "http://bbdd-service:9000/get_client_id?nombre_usuario=%s", receiver);
        int accion2 = 0;
        char* client_id = mongodb(sd_client, url_client_id, accion2);
        free(url_client_id);

        char *url_ip = malloc(strlen(receiver) + 255);
        sprintf(url_ip, "http://bbdd-service:9000/ip?nombre_usuario=%s", receiver);
        int accion3 = 0;
        char* ip = mongodb(sd_client, url_ip, accion3);
        free(url_ip);

        int tcp_port = DDBB_TCP_SERVER_PORT;

        // THe JSON is built to send it to the receiver
        cJSON *json_data_obj = cJSON_CreateObject();
        cJSON_AddStringToObject(json_data_obj, "sender", sender);
        cJSON_AddStringToObject(json_data_obj, "receiver", receiver);
        cJSON_AddStringToObject(json_data_obj, "message", message);
        cJSON_AddStringToObject(json_data_obj, "date", date);
        cJSON_AddStringToObject(json_data_obj, "client_id", client_id);

        char *json_data = cJSON_Print(json_data_obj);
        cJSON_Delete(json_data_obj);

        //3rd: We send the message to the receiver through the tcp socket
        int client_socket = socket(AF_INET, SOCK_STREAM, 0);
        if (client_socket == -1) {
            perror("Error al crear el socket");

        }
        // Configure the server address
        struct sockaddr_in server_addr;
        server_addr.sin_family = AF_INET;
        server_addr.sin_port = htons(tcp_port);
        if (inet_pton(AF_INET, ip, &server_addr.sin_addr) <= 0) {
            perror("Error al convertir la dirección IP");

        }
        // Connect to the server
        if (connect(client_socket, (struct sockaddr*)&server_addr, sizeof(server_addr)) == -1) {
            perror("Error al conectar al servidor del receptor, no está conectado");

        } else {
            printf("Conectado al servidor del receptor\n");

            // Send the JSON data to the server
            if (send(client_socket, json_data, strlen(json_data), 0) == -1) {
                perror("Error al enviar datos al servidor");

            }
            printf("JSON enviado al servidor Node.js\n");
            // Close the socket
            close(client_socket);

        }

        // Verify if json_data is null before freeing memory
        if (json_data != NULL) {
            free(json_data);
        } else {
            printf("Error: json_data es NULL\n");
        }

        // Verify if ip is null before freeing memory
        if (ip != NULL) {
            free(ip);
        } else {
            printf("Error: ip es NULL\n");
        }

        // Verify if client_id is null before freeing memory
        if (client_id != NULL) {
            free(client_id);
        } else {
            printf("Error: client_id es NULL\n");
        }
            close(sd_client);
    }
    else if (strcmp(operation, "IA") == 0){
        //Send the results of the machine learning model of the user to the Node.js server

        char *username = cJSON_GetObjectItem(json, "username")->valuestring;

        //Obtain the statistics of the user
        char *url_mongo = malloc(strlen(username) + 255);
        sprintf(url_mongo, "http://bbdd-service:9000/estadisticas?nombre_usuario=%s", username);
        int accion2 = 0;
        char * data = mongodb(sd_client, url_mongo, accion2);
        free(url_mongo);

        //Call the machine learning model and send it to the Node.js server
        char *url_prediccion = malloc(255);
        sprintf(url_prediccion, "http://modelo-service:8000/predict");
        mongodb_post(sd_client, url_prediccion, data);
        free(data);

    }
    else{
        printf("Unknown operation\n");
    }

    cJSON_Delete(json);
    close(sd_client);
}


int main() {
    pthread_attr_t t_attr;
    pthread_t thid;
    int servidor_fd, cliente_fd;
    struct sockaddr_in direccion;

    servidor_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (servidor_fd < 0) {
        perror("Error while creating the socket");
        exit(EXIT_FAILURE);
    }

    memset(&direccion, 0, sizeof(direccion));
    direccion.sin_family = AF_INET;
    direccion.sin_addr.s_addr = INADDR_ANY;
    direccion.sin_port = htons(DDBB_SERVER_PORT);

    if (bind(servidor_fd, (struct sockaddr *)&direccion, sizeof(direccion)) < 0) {
        perror("Error while binding");
        close(servidor_fd);
        exit(EXIT_FAILURE);
    }

    if (listen(servidor_fd, 1) < 0) {
        perror("Error while listening");
        close(servidor_fd);
        exit(EXIT_FAILURE);
    }

    printf("C Server listening on the port %d...\n", DDBB_SERVER_PORT);
    pthread_mutex_init(&mutex_mensaje, NULL);
    pthread_cond_init(&cond_mensaje, NULL);
    pthread_attr_init(&t_attr);

    while (1) {
        cliente_fd = accept(servidor_fd, NULL, NULL);
        if (cliente_fd < 0) {
            perror("Error while accepting the connection");
            close(servidor_fd);
            exit(EXIT_FAILURE);
        }

        if (pthread_create(&thid, &t_attr, (void *)tratar_mensaje, (void *)&cliente_fd) == 0) {
            pthread_mutex_lock(&mutex_mensaje);
            while (mensaje_no_copiado)
                pthread_cond_wait(&cond_mensaje, &mutex_mensaje);

            mensaje_no_copiado = true;
            pthread_mutex_unlock(&mutex_mensaje);
        }
    }

    return 0;
}