FROM python:3.9-slim
WORKDIR /app

COPY . .

RUN pip install --no-cache-dir flask pandas scikit-learn

EXPOSE 8000

CMD ["python", "microservice.py"]

