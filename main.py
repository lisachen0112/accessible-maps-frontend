from flask import Flask, request, redirect, jsonify, session, render_template
import os
from dotenv import load_dotenv
from flask_cors import CORS

load_dotenv()  # Load variables from .env file
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
PLACES_API_URL = os.getenv('PLACES_API_URL')
JOUREY_PLANNER_URL = os.getenv('JOURNEY_PLANNER_URL')
app = Flask(__name__)
CORS(app) 

@app.route('/')
def index():
    return render_template('index.html', 
                           GOOGLE_API_KEY=GOOGLE_API_KEY, 
                           PLACES_API_URL=PLACES_API_URL,
                           JOURNEY_PLANNER_URL=JOUREY_PLANNER_URL)