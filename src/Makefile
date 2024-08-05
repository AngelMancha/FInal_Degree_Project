CC = gcc
CFLAGS = -Wall -Werror -Wextra -g

SERVER = server/main_server/servidor.c server/main_server/implementacion.c server/main_server/cJSON.c

all:

servidor: $(SERVER)
	$(CC) $(DFLAGS) $(SERVER) -lpthread -lrt -lcurl -o servidor && ./servidor

cliente:
	node client/index.js

modelo:
	python3 server/ia_model/modelo.py

mongo:
	python3 server/mongodb/mongo.py

clean:
	rm -f  servidor 

dockerClient:
	cd client && docker build -t angelmanchan/cliente .
	docker push angelmanchan/cliente

dockerServer:
	cd server/main_server && docker build -t angelmanchan/server .
	docker push angelmanchan/server

dockerMongo:
	cd server/mongodb && docker build -t angelmanchan/mongo .
	docker push angelmanchan/mongo

dockerModelo:
	cd server/ia_model && docker build -t angelmanchan/modelo .
	docker push angelmanchan/modelo

