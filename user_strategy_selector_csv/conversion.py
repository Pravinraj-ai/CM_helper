import csv
import json

def csv_to_json(csv_file_path, json_file_path):
    data = {}

    with open(csv_file_path, mode='r', newline='', encoding='utf-8') as csv_file:
        reader = csv.reader(csv_file)
        header = next(reader)  # Skip header row
        for row in reader:
            if len(row) >= 2:
                id = row[0].strip()
                strategy = row[1].strip()
                if id and strategy:
                    data[id] = strategy

    with open(json_file_path, mode='w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4)

    print(f"Successfully converted '{csv_file_path}' to '{json_file_path}'")

# Example usage
csv_to_json('strategies.csv', 'strategies.json')
