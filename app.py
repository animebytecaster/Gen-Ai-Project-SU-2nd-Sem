import os
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'  # Suppress TensorFlow informational and warning logs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'  # Disable oneDNN optimizations

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
from tensorflow import keras
from PIL import Image
import io
import json
import logging

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
CORS(app)

# Load class labels
with open(r'z:\Assignments\gen ai pro\models\class_labels.json', 'r') as f:
    CLASS_LABELS = json.load(f)

# Load model
model = keras.models.load_model(r'Z:\Assignments\gen ai pro\garbage_classifier_trashnet_3.h5')

def preprocess_image(img_bytes):
    img = Image.open(io.BytesIO(img_bytes)).resize((128, 128)).convert('RGB')
    img_array = keras.utils.img_to_array(img) / 255.0
    return np.expand_dims(img_array, axis=0)

@app.route('/classify', methods=['POST'])
def classify_waste():
    if 'images' not in request.files:
        return jsonify({'error': 'No images provided'}), 400

    predictions = []
    for file in request.files.getlist('images'):
        if not file.content_type.startswith('image/'):
            predictions.append({'error': 'Invalid file type'})
            continue

        img_array = preprocess_image(file.read())
        preds = model.predict(img_array)
        predicted_class = np.argmax(preds[0])
        predictions.append({
            'class': CLASS_LABELS[str(predicted_class)],
            'confidence': float(np.max(preds[0]))
        })

    return jsonify(predictions), 200

@app.route('/')
def home():
    return send_from_directory(r'z:\Assignments\gen ai pro\static', 'index.html')

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)  # Bind to localhost and disable debug mode