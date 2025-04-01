import json
import sys
import numpy as np
from keras.models import load_model
import os
import tensorflow as tf

# Suppress TensorFlow progress bar
tf.get_logger().setLevel('ERROR')

# Define the feature range used during training
feature_range = {
    'month': (1, 12),
    'steps': (0, 200000),
    'distance': (0, 150000),
    'caloriesExpended': (0, 5000),
    'heartRate': (0, 200),
    'moveMinutes': (0, 2000),
    'age': (0, 100),  # Age in years
    'gender': (0, 1),  # 0 for male, 1 for female
    'weight': (30, 200),  # Weight in kg
    'height': (100, 250),  # Height in cm
}

# Function to preprocess input data
def preprocess_input(data, user_info, feature_range):
    feature_values = [
        data.get('month', 0),
        data.get('steps', 0),
        data.get('distance', 0),
        data.get('caloriesExpended', 0),
        data.get('heartRate', 0),
        data.get('moveMinutes', 0),
        user_info.get('age', 25),  # Default age to 25 if not provided
        0 if user_info.get('gender', 'M').upper() == 'M' else 1,  # Gender encoding
        user_info.get('weight', 70),  # Default weight to 70 kg
        user_info.get('height', 170),  # Default height to 170 cm
    ]
    
    scaled_features = [
        (feature - min_val) / (max_val - min_val)
        for feature, (min_val, max_val) in zip(feature_values, feature_range.values())
    ]
    
    return np.array([scaled_features])

# Load the input data from the command-line arguments
input_json = sys.argv[1]
input_data = json.loads(input_json)

# Path to the model file
model_path = './saved-model/new_model.h5'

# Check if the model file exists
if not os.path.exists(model_path):
    error_result = {'error': f"Model file does not exist at path: {model_path}"}
    print(json.dumps(error_result))
    sys.exit(1)

# Load the model
try:
    model = load_model(model_path)
except Exception as e:
    error_result = {'error': f"Failed to load model: {str(e)}"}
    print(json.dumps(error_result))
    sys.exit(1)

# Redirect stdout to capture output
from io import StringIO
import contextlib

output = StringIO()
with contextlib.redirect_stdout(output):
    try:
        predictions = []
        for data in input_data['monthlyData']:
            features = preprocess_input(data, input_data['userInfo'], feature_range)
            prediction = model.predict(features, verbose=0)
            if prediction.shape == (1, 1):
                predictions.append({'value': float(prediction[0][0])})
            else:
                raise ValueError(f"Unexpected prediction shape: {prediction.shape}")

        # Output the result as a JSON string
        result = {'predictions': predictions}
        print(json.dumps(result))
    
    except Exception as e:
        error_result = {'error': f"Failed to make prediction: {str(e)}"}
        print(json.dumps(error_result))

# Filter and print only JSON lines
output_lines = output.getvalue().split('\n')
json_output = [line for line in output_lines if line.startswith('{')]

if json_output:
    print(json_output[-1])  # Print the last JSON line

sys.stdout.flush()
