# import pandas as pd
# import re

# def preprocess_data(input_file, output_file):
#     # Load data
#     df = pd.read_csv(input_file)

#     # Drop rows with missing values
#     df = df.dropna()

#     # Convert column names to lowercase and replace spaces with underscores
#     df.columns = df.columns.str.lower().str.replace(' ', '_')

#     # Remove duplicates
#     df = df.drop_duplicates()

#     # Remove special characters, extra spaces, and internal spaces for each cell
#     def clean_text(text):
#         if isinstance(text, str):
#             # Remove special characters
#             text = re.sub(r'[^\w\s]', '', text)
#             # Remove extra spaces
#             text = re.sub(r'\s+', ' ', text)
#             # Remove internal spaces (spaces within words)
#             text = re.sub(r'\s+', '', text)
#             return text.strip()
#         return text

#     # Convert text in the first two columns to lowercase and clean them
#     def process_column(text):
#         if isinstance(text, str):
#             return text.lower()  # Convert to lowercase
#         return text

#     # Apply the process_column function to the first two columns
#     df.iloc[:, 0] = df.iloc[:, 0].map(process_column)
#     df.iloc[:, 1] = df.iloc[:, 1].map(process_column)

#     # Apply the clean_text function to other columns
#     df = df.apply(lambda x: x.map(clean_text) if x.dtype == 'object' else x)

#     # Remove "cal" or "kj" from the last two columns
#     def clean_numeric_column(text):
#         if isinstance(text, str):
#             # Remove "cal" and "kj" and any spaces around them
#             text = re.sub(r'\s*(cal|kj)\s*', '', text, flags=re.IGNORECASE)
#             # Remove internal spaces
#             text = re.sub(r'\s+', '', text)
#             return text.strip()
#         return text

#     # Apply the cleaning function to the last two columns
#     df[df.columns[-2]] = df[df.columns[-2]].map(clean_numeric_column)
#     df[df.columns[-1]] = df[df.columns[-1]].map(clean_numeric_column)

#     # Save the cleaned data to a new file
#     df.to_csv(output_file, index=False)

# if __name__ == "__main__":
#     input_file = './calories.csv'
#     output_file = './cleaned_calories.csv'
#     preprocess_data(input_file, output_file)



import pandas as pd
import re

def preprocess_data(input_file, output_file):
    # Load data
    df = pd.read_csv(input_file)

    # Drop rows with missing values
    df = df.dropna()

    # Convert column names to lowercase and replace spaces with underscores
    df.columns = df.columns.str.lower().str.replace(' ', '_')

    # Remove duplicates
    df = df.drop_duplicates()

    # Clean each cell in the DataFrame
    def clean_text(text):
        if isinstance(text, str):
            # Remove special characters
            text = re.sub(r'[^\w\s]', '', text)
            # Remove extra spaces
            text = re.sub(r'\s+', ' ', text)
            # Strip leading/trailing spaces
            return text.strip()
        return text

    # Apply the cleaning function to all object columns (strings)
    df = df.applymap(lambda x: clean_text(x) if isinstance(x, str) else x)

    # Convert specific columns to lowercase
    df['bodypart'] = df['bodypart'].str.lower()
    df['equipment'] = df['equipment'].str.lower()

    # Save the cleaned data to a new file
    df.to_csv(output_file, index=False)

if __name__ == "__main__":
    input_file = './exercises.csv'
    output_file = './cleaned_exercises.csv'
    preprocess_data(input_file, output_file)

