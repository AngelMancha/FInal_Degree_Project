#include "cJSON.h"
char* mongodb(int sd_client, char url[255], int accion);
char* mongodb_post(int sd_client, char url[255], char *data);
char *encode_url(const char *url);
static size_t write_memory_callback(void *contents, size_t size, size_t nmemb, void *userp);
