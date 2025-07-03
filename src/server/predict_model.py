import re
import joblib
import numpy as np
import nltk
from nltk.corpus import stopwords
import logging


logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MODEL_FILE_PATH = './consent_model_incremental.pkl'

try:
    
    model, vec = joblib.load(MODEL_FILE_PATH)
    logging.info("Model and vectorizer loaded successfully.")
except FileNotFoundError:
    model = None
    logging.error("Model file not found. Predictions cannot be made.")
except Exception as e:
    model = None
    logging.error(f"An error occurred while loading the model and vectorizer: {e}")


nltk.download('stopwords')

def preprocess_text(text):
    """ Clean and preprocess text for prediction. """
    text = text.lower()
    text = re.sub('[/(){}\[\]\|@,;]', ' ', text)
    text = re.sub('[^0-9a-z #+_]', '', text)
    stop_words = set(stopwords.words('english'))
    return ' '.join(word for word in text.split() if word not in stop_words)

def predict(text):
    if model is None:
        logging.error("No model available to make predictions.")
        return "Model not available, cannot predict."

    try:
        processed_text = preprocess_text(text)
        features = vec.transform([processed_text])

        probabilities = model.predict_proba(features)[0]
        prediction = model.predict(features)[0]

        logging.info(f"Processed text: {processed_text}")
        logging.info(f"Feature shape: {features.shape}")
        logging.info(f"Probabilities: {probabilities}")
        logging.info(f"Prediction: {'accept' if prediction == 1 else 'reject'}")

        return 'accept' if prediction == 1 else 'reject'
    except Exception as e:
        logging.error(f"An error occurred during prediction: {e}")
        return "Error in prediction process."


