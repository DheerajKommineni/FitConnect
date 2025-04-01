import sys
import pandas as pd
import json

def preprocess_data(input_file, selected_body_parts):
    # Load CSV data
    df = pd.read_csv(input_file)

    # Clean the data
    df['bodyPart'] = df['bodyPart'].str.strip().str.lower()
    df['equipment'] = df['equipment'].str.strip().str.lower()
    df['name'] = df['name'].str.strip()
    df['gifUrl'] = df['gifUrl'].str.strip()
    for i in range(1, 11):
        df[f'instructions/{i}'] = df[f'instructions/{i}'].str.strip()
    for i in range(1, 6):
        df[f'secondaryMuscles/{i}'] = df[f'secondaryMuscles/{i}'].str.strip()

    # Define the condition for including 'cardio' or 'waist' if 'core' is in selected_body_parts
    include_special_parts = 'core' in selected_body_parts
    special_parts = {'cardio', 'waist'}

    # Filter exercises based on selected body parts
    filtered_exercises = df[
        (df['bodyPart'].apply(lambda x: any(part in x for part in selected_body_parts)) |
         (include_special_parts & df['bodyPart'].isin(special_parts)))
    ]

    return filtered_exercises.to_json(orient='records')

if __name__ == "__main__":
    input_file = 'exercises.csv'
    selected_body_parts = [part.lower() for part in sys.argv[1:]]
    
    exercises_json = preprocess_data(input_file, selected_body_parts)
    print(exercises_json)
