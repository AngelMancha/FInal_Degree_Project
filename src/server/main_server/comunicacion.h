#define MAXSIZE 255
struct usuario{
        char nombre[MAXSIZE];
        char correo[MAXSIZE];
        int edad;
};

struct peticion{
        struct usuario usuario;
        char proyecto[MAXSIZE];
        char inicio[MAXSIZE];
        char fin[MAXSIZE];
        int progreso;
};

struct proyecto{
        char name[MAXSIZE];
        char date[MAXSIZE];

        int porcentaje;
        char category[MAXSIZE];
        char state[MAXSIZE];
        char complexity[MAXSIZE];
        int members;
        int tasks;

};