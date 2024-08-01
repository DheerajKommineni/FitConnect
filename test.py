import os
from keras.models import load_model
import h5py

model_path = './backend/saved-model/new_model.h5'

if not os.path.exists(model_path):
    print(f"Model file does not exist at path: {model_path}")
else:
    print("Model file exists.")
    try:
        with h5py.File(model_path, 'r') as f:
            print("File opened successfully.")
            print("Contents of the file:", list(f.keys()))
    except OSError as e:
        print(f"Failed to open file: {e}")
    
    try:
        model = load_model(model_path)
        print("Model loaded successfully.")
        print(model.summary())
    except Exception as e:
        print(f"Error loading model: {e}")
