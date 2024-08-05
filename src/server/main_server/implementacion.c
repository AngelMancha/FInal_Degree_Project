#include "comunicacion.h"
#include <stdio.h>
#include <unistd.h>
#include <dirent.h>
#include <string.h>
#include <stdbool.h>
#include <sys/socket.h>
#include <stdlib.h>
#include <sys/stat.h>
#include "cJSON.h"
#include <curl/curl.h>
 

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

void mongodb_post(int sd_client, char url[255], char* data){
    // Inicializar curl
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;

    chunk.memory = malloc(1); /* will be grown as needed by realloc above */
    chunk.size = 0;      
    curl = curl_easy_init();
    if (curl) {
        // Establecer la URL
        curl_easy_setopt(curl, CURLOPT_URL, url);
        
        // Establecer el tipo de contenido JSON
        struct curl_slist *headers = NULL;
        headers = curl_slist_append(headers, "Content-Type: application/json");
        curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

        // Establecer los datos a enviar
        curl_easy_setopt(curl, CURLOPT_POSTFIELDS, data);


        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_memory_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);
        // Realizar la solicitud POST
        res = curl_easy_perform(curl);
        if (res != CURLE_OK) {
            fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
        } 
        // Limpiar
        curl_easy_cleanup(curl);
        curl_slist_free_all(headers);

        // Enviar la respuesta al cliente

        int result = send(sd_client, chunk.memory, strlen(chunk.memory), 0);
        if (result == -1) {
            perror("send");
        }
        close(sd_client);

        
    } else {
        fprintf(stderr, "Failed to initialize curl\n");
    }
}
char *mongodb(int sd_client, char url[255], int accion)
{
    CURL *curl;
    CURLcode res;
    struct MemoryStruct chunk;

    chunk.memory = malloc(1); /* will be grown as needed by realloc above */
    chunk.size = 0;           /* no data at this point */

    curl_global_init(CURL_GLOBAL_ALL);
    curl = curl_easy_init();
    if (curl)
    {
        curl_easy_setopt(curl, CURLOPT_URL, url);
        curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_memory_callback);
        curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);

        res = curl_easy_perform(curl);
        if (res != CURLE_OK)
        {
            fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
        }
        else
        {
            printf("%s\n", chunk.memory); /* Print the received data */
            if (accion == 1){
                //comprobar que no sea una lista vacia por tamaño
                if (strlen(chunk.memory) == 3){

                }else{
                    // send it a a json to the client
                    send(sd_client, chunk.memory, strlen(chunk.memory), 0);
                }
            }
        }
        curl_easy_cleanup(curl);
        return chunk.memory;
    }

    free(chunk.memory);
    curl_global_cleanup();
}

char* encode_url(const char* str) {
    // Calcular la longitud de la cadena codificada
    int len = strlen(str);
    int spaces = 0;
    for (int i = 0; i < len; i++) {
        if (str[i] == ' ') {
            spaces++;
        }
    }
    int encoded_len = len + (spaces * 2) + 1; //%20
    // Crear una nueva cadena para almacenar la versión codificada
    char* encoded_str = (char*)malloc(encoded_len * sizeof(char));
    if (encoded_str == NULL) {
        fprintf(stderr, "Error: No se pudo asignar memoria.\n");
        exit(1);
    }
    // Realizar la codificación
    int j = 0;
    for (int i = 0; i < len; i++) {
        if (str[i] == ' ') {
            encoded_str[j++] = '%';
            encoded_str[j++] = '2';
            encoded_str[j++] = '0';
        } else {
            encoded_str[j++] = str[i];
        }
    }
    encoded_str[j] = '\0'; // Agregar el terminador nulo al final de la cadena codificada
    return encoded_str;
}
