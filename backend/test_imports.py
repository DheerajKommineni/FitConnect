import numpy as np # type: ignore
import tensorflow as tf # type: ignore

print("NumPy version:", np.__version__)
print("TensorFlow version:", tf.__version__)

from tensorflow.keras.models import load_model
print("Keras import successful")
