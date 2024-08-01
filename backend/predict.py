import json
import sys
import numpy as np
from keras.models import load_model
import os

# Define the feature range used during training
feature_range = {
    'steps': (0, 200000),
    'distance': (0, 150000),
    'month': (1, 12),
    'feature3': (0, 500),
    'feature4': (0, 500),
    'feature5': (0, 1000),
    'feature6': (0, 200),
    'feature7': (0, 300),
    'feature8': (0, 200),
    'feature9': (0, 500),
}

# Function to preprocess input data
def preprocess_input(data, feature_range):
    feature_values = [
        data.get('steps', 0),
        data.get('distance', 0),
        data.get('month', 0),
        data.get('feature3', 0),
        data.get('feature4', 0),
        data.get('feature5', 0),
        data.get('feature6', 0),
        data.get('feature7', 0),
        data.get('feature8', 0),
        data.get('feature9', 0),
    ]
    
    scaled_features = []
    for feature, (min_val, max_val) in zip(feature_values, feature_range.values()):
        scaled_value = (feature - min_val) / (max_val - min_val)
        scaled_features.append(scaled_value)
    
    return np.array([scaled_features])

# Load the input data from the command-line arguments
input_json = sys.argv[1]
input_data = json.loads(input_json)

# Path to the model file
model_path = './saved-model/new_model.h5'

# Check if the model file exists
if not os.path.exists(model_path):
    error_result = {
        'error': f"Model file does not exist at path: {model_path}"
    }
    print(json.dumps(error_result))
    sys.exit(1)

# Load the model
try:
    model = load_model(model_path)
except Exception as e:
    error_result = {
        'error': f"Failed to load model: {str(e)}"
    }
    print(json.dumps(error_result))
    sys.exit(1)

# Suppress TensorFlow progress bar
import tensorflow as tf
tf.get_logger().setLevel('ERROR')

# Redirect stdout to capture output
from io import StringIO
import contextlib

output = StringIO()
with contextlib.redirect_stdout(output):
    try:
        predictions = []
        for data in input_data['monthlyData']:
            features = preprocess_input(data, feature_range)
            prediction = model.predict(features, verbose=0)
            if prediction.shape == (1, 1):
                predictions.append({
                    'value': float(prediction[0][0])  # Only one prediction value
                })
            else:
                raise ValueError(f"Unexpected prediction shape: {prediction.shape}")

        # Output the result as a JSON string
        result = {
            'predictions': predictions
        }
        print(json.dumps(result))
    
    except Exception as e:
        error_result = {
            'error': f"Failed to make prediction: {str(e)}"
        }
        print(json.dumps(error_result))

# Filter and print only JSON lines
output_lines = output.getvalue().split('\n')
json_output = [line for line in output_lines if line.startswith('{')]

if json_output:
    print(json_output[-1])  # Print the last JSON line

sys.stdout.flush()
