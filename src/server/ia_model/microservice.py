from flask import Flask, request, jsonify
import pickle
import pandas as pd
import json
import joblib

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    # Cargar datos desde la solicitud JSON
    data_json = request.get_json()
    data = pd.DataFrame(data_json)

    # Preprocesamiento de datos
    data['ID'] = data['name']
    data['Num_dias'] = (pd.to_datetime(data['date']) - pd.to_datetime('today')).dt.days
    data['Numero_Tareas'] = data['tasks']
    data['Num_Miembros'] = data['members']
    complejidad_dict = {'Baja': 1, 'Media': 2, 'Alta': 3}
    data['Complejidad'] = data['complexity'].map(complejidad_dict)
    data['Completitud'] = data['porcentaje']
    data.drop(['name', 'porcentaje', 'date', 'category', 'state', 'complexity', 'members', 'tasks'], axis=1, inplace=True)

    # Guardar los datos en un archivo CSV temporal
    file_path = 'temp_database_a_predecir_desde_json.csv'
    data.to_csv(file_path, index=False)

    # Cargar el modelo
    model = joblib.load('model_predicciones.pkl')

    # Aplicar el modelo
    df = pd.read_csv(file_path)
    x = df[['Num_dias', 'Numero_Tareas', 'Num_Miembros', 'Complejidad', 'Completitud']]
    y_pred = model.predict(x)
    df['Criticidad'] = y_pred
    df = df.sort_values(by='Criticidad', ascending=False)

    # Convertir el DataFrame a JSON
    result_json = df.to_json(orient='records')

    return result_json

if __name__ == '__main__':
    ip_address = '0.0.0.0'
    port = 8000
    app.run(ip_address, port, debug=True)
