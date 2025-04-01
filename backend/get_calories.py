import pandas as pd
import sys
import json

# Loading the dataset
df = pd.read_csv('cleaned_calories.csv')

def convert_to_builtin_types(obj):
    """Convert numpy types to native Python types."""
    if isinstance(obj, pd.Series):
        obj = obj.to_dict()
    elif isinstance(obj, pd.DataFrame):
        obj = obj.to_dict(orient='records')
    elif isinstance(obj, (int, float)):
        obj = float(obj)  # Converting numeric values to Python float
    elif isinstance(obj, pd.Timestamp):
        obj = obj.isoformat()  # Converting pandas Timestamp to ISO format string
    return obj

def get_calories(food_name):
    row = df[df['fooditem'].str.lower() == food_name.lower()]
    if not row.empty:
        calories = row['cals_per100grams'].values[0]
        return {'food': food_name, 'calories': int(calories)}  # Converting to int
    else:
        return {'error': 'Food item not found'}

def get_suggestions(query):
    query = query.lower()
    suggestions = df[df['fooditem'].str.lower().str.contains(query, na=False)]
    if not suggestions.empty:
        results = suggestions[['fooditem', 'cals_per100grams']].head(10).to_dict(orient='records')
        # Converting to standard Python types
        results = [convert_to_builtin_types(item) for item in results]
        return results
    else:
        return {'error': 'No matching food items found'}

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({'error': 'Invalid parameters'}))
        sys.exit(1)

    action = sys.argv[1].lower()
    
    if action == 'calories' and len(sys.argv) == 3:
        food_name = sys.argv[2]
        result = get_calories(food_name)
    elif action == 'suggestions' and len(sys.argv) == 3:
        query = sys.argv[2]
        result = get_suggestions(query)
    else:
        result = {'error': 'Invalid parameters'}

    print(json.dumps(result))
