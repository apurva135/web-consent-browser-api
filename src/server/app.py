from flask import Flask, request, jsonify, render_template_string,session
import csv
import os
import train_model
import predict_model
from flask_cors import CORS

app = Flask(__name__)

app.secret_key = 'your_secret_key_here'  # Use a secure key in production!


CORS(app)


CSV_FILE_PATH = 'consent.csv'


if not os.path.exists(CSV_FILE_PATH):
    with open(CSV_FILE_PATH, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow(['Question Number', 'Website Name', 'Question', 'Answer'])
        print("CSV file created with header")


def get_next_question_number():
    if not os.path.exists(CSV_FILE_PATH) or os.path.getsize(CSV_FILE_PATH) == 0:
        return 1  # Start from 1 if file doesn't exist or is empty
    
    try:
        with open(CSV_FILE_PATH, mode='r', encoding='utf-8') as file:
            reader = csv.reader(file)
            lines = list(reader)
    except UnicodeDecodeError:
        try:
            # Retry with a different encoding if UTF-8 failed
            with open(CSV_FILE_PATH, mode='r', encoding='cp1252') as file:
                reader = csv.reader(file)
                lines = list(reader)
        except Exception as e:
            print(f"Failed to read the CSV file with alternate encoding: {e}")
            return 1

    if len(lines) <= 1:
        return 1
    
    try:
        last_line = lines[-1]
        last_question_number = int(last_line[0])
        return last_question_number + 1
    except (IndexError, ValueError) as e:
        print(f"Error reading last question number: {e}")
        return 1


@app.route('/')
def index():
    return render_template_string("Consent Manager API is running")


@app.route('/submit-consent', methods=['POST'])
def submit_consent():
    data = request.json
    if not data:
        return jsonify({'status': 'error', 'message': 'No data provided'}), 400

    next_question_number = get_next_question_number()

    print(data)
    with open(CSV_FILE_PATH, mode='a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file, quoting=csv.QUOTE_ALL)
        for item in data:
            if item['answer'].lower() == "yes" or item['answer'].lower() == "no":
                answer = 'accept' if item['answer'].lower() == 'yes' else 'reject'
                writer.writerow([next_question_number, 'Unknown', item['question'], answer])
                next_question_number += 1
            else:
                accepted_answers = {'accept', 'accepted', 'allow','allowed','allow all'}
                answer = 'accept' if item['answer'].lower() in accepted_answers else 'reject'
                policy = item['question'].replace('�', "'")
                writer.writerow([next_question_number, item['url'], policy, answer])
                next_question_number += 1
                


    if next_question_number > 4:  
        train_model.train_model()


    return jsonify({'status': 'success'}), 200

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if 'text' not in data:
        return jsonify({'status': 'error', 'message': 'No text provided'}), 400

    text = data['text']
    prediction = predict_model.predict(text)
    result = prediction

    return jsonify({'status': 'success', 'prediction': result})


@app.route('/predict-cookies', methods=['POST'])
def predict_cookies():
    try:
        data = request.json.get('data')
        if data is None:
            return jsonify({'status': 'error', 'message': 'Invalid JSON'}), 400
        print(data) 

        if 'url' not in data or 'context' not in data:
            return jsonify({'status': 'error', 'message': 'URL or context not provided'}), 400

        context = data['context']
        prediction = predict_model.predict(context)
        result = prediction

        return jsonify({'status': 'success', 'url': data['url'], 'prediction': result})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
