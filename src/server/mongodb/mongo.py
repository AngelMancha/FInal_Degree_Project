from flask import Flask, request, jsonify
from pymongo import MongoClient
from cryptography.hazmat.primitives.ciphers import (
    Cipher, algorithms, modes
)
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import padding
import random
import string

app = Flask(__name__)
client = MongoClient("mongodb+srv://angelmanchan:*****@tfg.r3ubsnr.mongodb.net/")
db = client["Usuarios"]
collection_users = db["Proyectos"]
collection_projects = db["Usuarios"]


@app.route("/register", methods =["GET"])
def register():
    username = request.args.get("username")
    password = request.args.get("password")
    correo = request.args.get("email")

    #we salt the password
    salt = ''.join(random.choices(string.ascii_uppercase + string.digits, k=16))
    salt_password = salt + password

    #hash the password
    digest = hashes.Hash(hashes.SHA256())
    #pasamos a bytes la contraseña + salt
    salt_password_bytes = bytes(salt_password, 'utf-8')

    digest.update(salt_password_bytes)
    hashed_password_bytes = digest.finalize()

    hashed_password = hashed_password_bytes.hex()

    nuevo_usuario = {
        "username": username,
        "hash": hashed_password,
        "salt": salt,
        "correo": correo,
        "ip": "",
        "proyectos": [],
        "mensajes": [],
        "client_id": ""
    }

    #crear documento nuevo en la coleccion
    result=collection_users.insert_one(nuevo_usuario)
    return jsonify({"mensaje": "Usuario creado exitosamente", "usuario_id": str(result.inserted_id)}), 201

@app.route("/calcular_estadisticas", methods=["GET"])
def calcular_estadisticas():
    nombre_usuario = request.args.get("nombre_usuario")
    user_document = collection_users.find_one({"username": nombre_usuario})
    if user_document:
        user_id = user_document.get("_id")
        estadisticas = []
        proyectos = user_document.get("proyectos", [])
        
        for proy_id in proyectos:
            proyect_document = collection_projects.find_one({"_id": proy_id})
            tareas = proyect_document.get("property_tasks", [])
            count_tareas = 0
            count_members = 0
            count_tareas_completadas = 0
            for tarea in tareas:
                count_tareas += 1
                if tarea["done"] == "1":
                    count_tareas_completadas += 1
            if count_tareas > 0:
                porcentaje = ((count_tareas_completadas / count_tareas) * 100).__round__(0)
            else:
                porcentaje = 0
            members_list = proyect_document.get("members", [])

            for member in members_list:
                count_members += 1

            complexity = proyect_document.get("complexity", "")
            state = proyect_document.get("state", "")
            category = proyect_document.get("category", "")
            date = proyect_document.get("deadline", "")
            tasks = count_tareas
            name = proyect_document.get("name", "")


            # Construir el objeto proyecto
            project_stats= {
                "name": name,
                "porcentaje": porcentaje,
                "date": date,
                "category": category,
                "state": state,
                "complexity": complexity,
                "members": count_members,
                "tasks": tasks
            }

            # Agregar el proyecto a la lista estadisticas
            estadisticas.append(project_stats)

        return jsonify(estadisticas)
    else:
        return "Usuario no existe"


 

@app.route("/obtener_tareas", methods=["GET"])
def obtener_tareas():

    nombre_usuario = request.args.get("nombre_usuario")
    nombre_proyecto = request.args.get("nombre_proyecto")


    user_document = collection_users.find_one({"username": nombre_usuario})
    if user_document:
        proyectos = user_document.get("proyectos", [])
        for proy_id in proyectos:
            proyect_document = collection_projects.find_one({"_id": proy_id})
            if proyect_document["name"] == nombre_proyecto:
                tareas = proyect_document.get("property_tasks", [])
                members_id = proyect_document.get("members", [])
                members_name = []
                #obtain the members names
                for member in members_id:
                    member_document = collection_users.find_one({"_id": member})
                    member_name = member_document.get("username", "")
                    members_name.append(member_name)
                single = {"tareas": tareas, "members": members_name}
                
                return jsonify(single)
    else:
        return "Proyecto no encontrado"

@app.route("/obtener_miembros", methods=["GET"])
def obtener_miembros():

    nombre_usuario = request.args.get("nombre_usuario")
    nombre_proyecto = request.args.get("nombre_proyecto")

    if nombre_proyecto != "":
        documento = collection_users.find_one({"username": nombre_usuario})

        if documento:
            proyectos = documento.get("proyectos", [])
            for proyecto in proyectos:
                if proyecto["name"] == nombre_proyecto:
                    members = proyecto.get("members", [])
                    return jsonify(members)


@app.route("/crear_proyecto", methods=["GET"])
def crear_proyecto():
    #this function should create a new document in the projects collection and add to the list of owners, the creator's object ID

    nombre_usuario = request.args.get("nombre_usuario")
    nombre_proyecto = request.args.get("nombre_proyecto")
    deadline = request.args.get("deadline")
    category = request.args.get("category")
    complexity = request.args.get("complexity")

    new_project = {
        "name": nombre_proyecto,
        "deadline": deadline,
        "members": [],
        "category": category,
        "state": "1",
        "complexity": complexity,
        "property_tasks": []
    }

    user_document = collection_users.find_one({"username": nombre_usuario})
    if user_document:
        user_id = user_document.get("_id")
        new_project["members"].append(user_id)
        new_project_id = collection_projects.insert_one(new_project).inserted_id
        user_document["proyectos"].append(new_project_id)
        collection_users.update_one({"username": nombre_usuario}, {"$set": {"proyectos": user_document["proyectos"]}})
        return "Proyecto creado"
    else:
        return "Usuario no existe"


@app.route("/login", methods=["GET"])
def registrar_usuario():
    username = request.args.get("username")
    # name = request.args.get("name")
    password = request.args.get("password")

    #buscar si ya existe el usuario
    documento = collection_users.find_one({"username": username})
    if documento:
        #comparar contraseñas
        salt = documento.get("salt")
        

        salt_password = salt + password


        #hash the password
        digest = hashes.Hash(hashes.SHA256())
        #pasamos a bytes la contraseña + salt
        salt_password_bytes = bytes(salt_password, 'utf-8')
        digest.update(salt_password_bytes)
        hashed_password_bytes = digest.finalize()

        hashed_password = hashed_password_bytes.hex()
        
        if hashed_password == documento.get("hash"):
            return "Usuario_autenticado"
        return "Contraseña_incorrecta"
    else:
        return "Usuario_no_existe"
    


@app.route("/editar_tarea", methods=["GET"])
def editar_tarea():
    nombre_usuario = request.args.get("nombre_usuario")
    nombre_proyecto = request.args.get("nombre_proyecto")
    tarea = request.args.get("nombre_tarea")
    state = request.args.get("estado")

    user_document = collection_users.find_one({"username": nombre_usuario})
    if user_document:
        proyectos = user_document.get("proyectos", [])
        for proy_id in proyectos:
            proyect_document = collection_projects.find_one({"_id": proy_id})
            if proyect_document["name"] == nombre_proyecto:
                tareas = proyect_document.get("property_tasks", [])
                for t in tareas:
                    if t["task"] == tarea:
                        t["done"] = state
                        collection_projects.update_one({"_id": proy_id}, {"$set": {"property_tasks": tareas}})
                        return "Tarea editada"
    else:
        return "Usuario no existe"

@app.route("/bring_chat", methods=["GET"])
def bring_chat():
    sender = request.args.get("sender")
    receiver = request.args.get("receiver")

    combined_json = {"sender": [], "receiver": []}

    documento = collection_users.find_one({"username": sender})
    if documento:
        chats = documento.get("mensajes", [])
        for chat in chats:
            if chat["receiver"] == receiver:
                combined_json["sender"] = chat["messages"]
                break
    
    documento2 = collection_users.find_one({"username": receiver})
    if documento2:
        chats = documento2.get("mensajes", [])
        for chat in chats:
            if chat["receiver"] == sender:
                combined_json["receiver"] = chat["messages"]
                break
    
    return jsonify(combined_json)

@app.route("/write_client_id", methods=["GET"])
def write_client_id():
    username = request.args.get("username")
    client_id = request.args.get("client_id")

    documento = collection_users.find_one({"username": username})
    if documento:
        collection_users.update_one({"username": username}, {"$set": {"client_id": client_id}})
        return "Client ID guardado"
    else:
        return "Usuario no existe"
    

@app.route("/nuevo_mensaje", methods=["GET"])
def nuevo_mensaje():
    sender = request.args.get("sender")
    receiver = request.args.get("receiver")
    message = request.args.get("message")
    date = request.args.get("date")

    documento = collection_users.find_one({"username": sender})
    
    if documento:
        chats = documento.get("mensajes", [])

        #documento2 = chats.find_one({"receiver": receiver})
        for chat in chats:
            if chat["receiver"] == receiver:
                chat["messages"].append({"message": message, "sender": sender, "receiver":receiver, "date": date})
                collection_users.update_one({"username": sender}, {"$set": {"mensajes": chats}})
                return "Mensaje guardado"
                
    
        chats.append({"receiver": receiver, "messages": [{"message": message, "sender": sender, "receiver":receiver, "date": date}]})
        collection_users.update_one({"username": sender}, {"$set": {"mensajes": chats}})
        
        return "Mensaje guardado"
            
    else:
        return "Usuario no existe"
    
@app.route("/get_client_id", methods=["GET"])
def client_id():
    username = request.args.get("nombre_usuario")
    
    documento = collection_users.find_one({"username": username})
    if documento:
        client_id = documento.get("client_id", "")
        return client_id
    else:
        return "Usuario no existe"

@app.route("/ip", methods=["GET"])
def ip():
    username = request.args.get("nombre_usuario")
    
    documento = collection_users.find_one({"username": username})
    if documento:
        ip = documento.get("ip", "")
        return ip
    else:
        return "Usuario no existe"
    
@app.route("/update_ip", methods=["GET"])
def update_ip():
    new_ip = request.args.get("new_ip")
    username = request.args.get("sender")

   
    
    documento = collection_users.find_one({"username": username})
    if documento:
        collection_users.update_one({"username": username}, {"$set": {"ip": new_ip}})
        return "IP actualizada"
    else:
        return "Usuario no existe"

@app.route("/crear_tarea", methods=["GET"])
def crear_tarea():
    nombre_usuario = request.args.get("nombre_usuario")
    nombre_proyecto = request.args.get("nombre_proyecto")
    tarea = request.args.get("nombre_tarea")
    members = request.args.get("members")
    due_date = request.args.get("deadline")

    user_document = collection_users.find_one({"username": nombre_usuario})
    if user_document:
        proyectos = user_document.get("proyectos", [])
        for proy_id in proyectos:
            proyect_document = collection_projects.find_one({"_id": proy_id})
            if proyect_document["name"] == nombre_proyecto:
                tareas = proyect_document.get("property_tasks", [])
                tareas.append({"task": tarea, "done": "0", "due_date": due_date, "members": members})
                collection_projects.update_one({"_id": proy_id}, {"$set": {"property_tasks": tareas}})
                return "Tarea creada"



@app.route("/add_member", methods=["GET"])
def añadir_miembro():

    nombre_usuario = request.args.get("nombre_usuario")
    nombre_proyecto = request.args.get("nombre_proyecto")
    miembro = request.args.get("miembro")

    #the projct object ID is stored in the user's document and the user's object ID is stored in the project's document
    user_document = collection_users.find_one({"username": nombre_usuario})
    if user_document:
        proyectos = user_document.get("proyectos", [])
        for proy_id in proyectos:
            proyect_document = collection_projects.find_one({"_id": proy_id})
            if proyect_document["name"] == nombre_proyecto:
                members = proyect_document.get("members", [])
                new_member_document = collection_users.find_one({"username": miembro})
                if new_member_document:
                    members.append(new_member_document.get("_id"))
                    collection_projects.update_one({"_id": proy_id}, {"$set": {"members": members}})
                    
                    #The project is also added to the new uses's projects list
                    new_member_document["proyectos"].append(proy_id)
                    collection_users.update_one({"username": miembro}, {"$set": {"proyectos": new_member_document["proyectos"]}})
                    return "Miembro añadido"
                else:
                    return "Miembro no existe"
    else:
        return "Usuario no existe"
    



@app.route("/estadisticas", methods=["GET"])
def estadisticas():
    nombre_usuario = request.args.get("nombre_usuario")

    user_document = collection_users.find_one({"username": nombre_usuario})
    if user_document:
        user_id = user_document.get("_id")
        estadisticas = []
        proyectos = user_document.get("proyectos", [])
        
        for proy_id in proyectos:
            proyect_document = collection_projects.find_one({"_id": proy_id})
            tareas = proyect_document.get("property_tasks", [])
            count_tareas = 0
            count_members = 0
            count_tareas_completadas = 0
            for tarea in tareas:
                count_tareas += 1
                if tarea["done"] == "1":
                    count_tareas_completadas += 1
            if count_tareas > 0:
                porcentaje = ((count_tareas_completadas / count_tareas) * 100).__round__(0)
            else:
                porcentaje = 0
            members_list = proyect_document.get("members", [])

            for member in members_list:
                count_members += 1

            complexity = proyect_document.get("complexity", "")
            state = proyect_document.get("state", "")
            category = proyect_document.get("category", "")
            date = proyect_document.get("deadline", "")
            tasks = count_tareas
            name = proyect_document.get("name", "")


            # Construir el objeto proyecto
            project_stats= {
                "name": name,
                "porcentaje": porcentaje,
                "date": date,
                "category": category,
                "state": state,
                "complexity": complexity,
                "members": count_members,
                "tasks": tasks
            }

            # Agregar el proyecto a la lista estadisticas
            estadisticas.append(project_stats)
        return jsonify(estadisticas)
    else:
        return "Usuario no existe"
        
if __name__ == "__main__":
    #cambiar puerto
    port=9000
    ip_address = '0.0.0.0'
    app.run(ip_address, port, debug=True)