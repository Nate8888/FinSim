from flask import Flask, request, jsonify
from google.cloud import firestore
from google.oauth2 import service_account
from flask_cors import CORS, cross_origin
import firebase_admin
from firebase_admin import credentials, auth
import requests
import yfinance as yf
import random
from datetime import datetime, timedelta
import json
from openai import OpenAI
import json
import os
import uuid
import copy 
from dotenv import load_dotenv
load_dotenv()

OPEN_AI_API_KEY = os.getenv('OPEN_AI_API_KEY')

client = OpenAI(api_key=OPEN_AI_API_KEY)

app = Flask(__name__)
CORS(app)

db_cred = service_account.Credentials.from_service_account_file('creds.json')
db = firestore.Client(credentials=db_cred)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('creds.json')
firebase_admin.initialize_app(cred)

def simulate_stock_price(example):
    str_example = json.dumps(example)
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
            "role": "system",
            "content": [
                {
                "text": "Simulate stock market prices for a given asset. Consider the current stock price and a list of news articles, then determine the new price based on the expected impact of the news.\n\nUse provided inputs in JSON format and calculate a reasonable new stock price based on the nature of the given news. Each news item may have a positive, negative, or neutral effect on the stock.\n\n# Steps\n\n1. **Process Input**: Receive the input JSON containing the company's current stock price and a list of news items.\n2. **Analyze News Impact**: For each piece of news, determine if its tone is positive, negative, or neutral.\n   - Consider news sentiment, importance, and relevance.\n3. **Adjust Stock Price**: Depending on the combined influence of the news items:\n   - Positive news should boost the price.\n   - Negative news should decrease the price.\n   - Neutral/balanced news should not significantly affect the stock price.\n4. **Reason Calculation**: Provide a reasoning step determining how each news item influences the stock price.\n5. **Output Result**: Output the adjusted stock price as JSON, including a breakdown of how each news item affected the final value.\n\n# Output Format\n\nThe output should be in JSON format with the following structure:\n- `asset`: the name of the asset.\n- `current_price`: the original price provided.\n- `news_effect`: a list detailing each news item's effect.\n- `new_price`: the calculated new stock price.\n\nExample Output:\n```json\n{\n  \"asset\": \"[Company Name]\",\n  \"current_price\": [Current Price],\n  \"news_effect\": [\n    {\n      \"news\": \"[News headline or summary]\",\n      \"sentiment\": \"positive/negative/neutral\",\n      \"impact\": \"[Description of the impact on price]\"\n    },\n    ...\n  ],\n  \"new_price\": [Calculated New Price]\n}\n```\n\n# Example\n\n### Input:\n```json\n{\n  \"asset\": \"TechCo\",\n  \"current_price\": 150.00,\n  \"news\": [\n    \"TechCo reports 20% increase in quarterly revenue.\",\n    \"Lawsuit filed against TechCo over privacy concerns.\",\n    \"TechCo launches new smartphone model.\"\n  ]\n}\n```\n\n### Reasoning:\n- News headline 1: Positive news, will likely boost stock price due to strong earnings.\n- News headline 2: Negative news, expected to partially offset gains due to potential legal costs.\n- News headline 3: New product launch, likely positive, but depends on market response.\n\n### Output:\n```json\n{\n  \"asset\": \"TechCo\",\n  \"current_price\": 150.00,\n  \"news_effect\": [\n    {\n      \"news\": \"TechCo reports 20% increase in quarterly revenue.\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+5.00\"\n    },\n    {\n      \"news\": \"Lawsuit filed against TechCo over privacy concerns.\",\n      \"sentiment\": \"negative\",\n      \"impact\": \"-2.50\"\n    },\n    {\n      \"news\": \"TechCo launches new smartphone model.\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+3.00\"\n    }\n  ],\n  \"new_price\": 155.50\n}\n```\n\n# Notes\n\n- With conflicting news, the model should try to balance the impact proportionally.\n- Some news might not have significant impact. In such cases, the impact can be zero.\n- Consider edge cases like highly impactful news or unclear sentiment and provide a conservative change.\n",
                "type": "text"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "text": "{\n  \"asset\": \"AAPL\",\n  \"current_price\": 250,\n  \"news\": [\n    \"AAPL reports 20% increase in quarterly revenue.\",\n    \"Lawsuit filed against AAPL over privacy concerns.\",\n    \"AAPLlaunches new smartphone model.\"\n  ]\n}",
                "type": "text"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "text": "\n{\n  \"asset\": \"AAPL\",\n  \"current_price\": 250,\n  \"news_effect\": [\n    {\n      \"news\": \"AAPL reports 20% increase in quarterly revenue.\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+12.50\"\n    },\n    {\n      \"news\": \"Lawsuit filed against AAPL over privacy concerns.\",\n      \"sentiment\": \"negative\",\n      \"impact\": \"-5.00\"\n    },\n    {\n      \"news\": \"AAPLlaunches new smartphone model.\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+7.50\"\n    }\n  ],\n  \"new_price\": 265.00\n}",
                "type": "text"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "text": "{\n  \"asset\": \"MSFT\",\n  \"current_price\": 100,\n  \"news\": [\n    \"MSFT reports hiring another 10 thosand new graduates.\"\n  ]\n}",
                "type": "text"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "text": "\n{\n  \"asset\": \"MSFT\",\n  \"current_price\": 100,\n  \"news_effect\": [\n    {\n      \"news\": \"MSFT reports hiring another 10 thousand new graduates.\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+1.00\"\n    }\n  ],\n  \"new_price\": 101.00\n}",
                "type": "text"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "text": "{\n  \"asset\": \"TSLA\",\n  \"current_price\": 150,\n  \"news\": [\n    \"TSLA reports an explosion in their new gigafactory location\",\n    \"Industry experts dislike the new Cybertruck car\",\n  ]\n}",
                "type": "text"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "text": "\n{\n  \"asset\": \"TSLA\",\n  \"current_price\": 150,\n  \"news_effect\": [\n    {\n      \"news\": \"TSLA reports an explosion in their new gigafactory location\",\n      \"sentiment\": \"negative\",\n      \"impact\": \"-10.00\"\n    },\n    {\n      \"news\": \"Industry experts dislike the new Cybertruck car\",\n      \"sentiment\": \"negative\",\n      \"impact\": \"-5.00\"\n    }\n  ],\n  \"new_price\": 135.00\n}",
                "type": "text"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "{\n  \"asset\": \"MSFT\",\n  \"current_price\": 500,\n  \"news\": [\n    \"Microsoft Announces Mind-Controlled Video Games: 'Xbox Your Brain'!\",\n    \"Microsoft's New AI-Powered Clippy Crashes Stock Trading: 'Paperclips Everywhere!'\",\n    \"Windows 13 Rollout Stumbles as Users Complain of Unexpected Blue Screens\"\n  ]\n}"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "\n{\n  \"asset\": \"MSFT\",\n  \"current_price\": 500,\n  \"news_effect\": [\n    {\n      \"news\": \"Microsoft Announces Mind-Controlled Video Games: 'Xbox Your Brain'!\",\n      \"sentiment\": \"positive\",\n      \"impact\": \"+15.00\"\n    },\n    {\n      \"news\": \"Microsoft's New AI-Powered Clippy Crashes Stock Trading: 'Paperclips Everywhere!'\",\n      \"sentiment\": \"negative\",\n      \"impact\": \"-10.00\"\n    },\n    {\n      \"news\": \"Windows 13 Rollout Stumbles as Users Complain of Unexpected Blue Screens\",\n      \"sentiment\": \"negative\",\n      \"impact\": \"-10.00\"\n    }\n  ],\n  \"new_price\": 495.00\n}"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": str_example
                }
            ]
            },
        ],
        temperature=1,
        max_tokens=7665,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        response_format={
            "type": "json_object"
        }
    )
    return json.loads(response.choices[0].message.content)

def generate_news_headlines(next_company):
    response_two = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
            "role": "system",
            "content": [
                {
                "type": "text",
                "text": "Generate positive and negative news headlines for a stock trading simulation game. You will receive the name of a company or its ticker symbol, and your task is to create a few relevant and imaginative news headlines that can be either positive or negative\n\n- The headlines can be humorous, surprising, or reflect something unexpected about the company.\n- Randomly decide if the news can be negative or upsetting themes. Feel free to be creative\n- Each headline should be succinct and convey its message clearly in an attention-grabbing way.\n\n# Steps\n\n1. Receive the company name or ticker.\n2. Create 1 to 3 distinct and engaging headlines that relate to the company.\n3. Ensure they vary in theme—mix reality-based humor, tragedies, failures, growth announcements, fictional innovations, partnership, rumors, gossip, etc.\n\n# Output Format\n\nReturn a JSON object structured as follows:\n- `headlines`: An array of strings, each representing a news headline.\n- There should be between 1 and 3 headlines in the array.\n\n```json\n{\n  \"headlines\": [\n    \"Headline 1\",\n    \"Headline 2\",\n    \"Headline 3\"\n  ]\n}\n```\n\n# Examples\n\n### Example 1 - Input:\nCompany: \"Tesla\"\n\n### Example 1 - Output:\n```json\n{\n  \"headlines\": [\n    \"Tesla Unveils Self-Driving Electric Helicopter. Elon Calls It 'Top Secret Fun Project'\",\n    \"Tesla Teams Up With SpaceX to Offer 'Martian-Ready' Cybertrucks for the Future Red Planet Colony\",\n    \"Industry experts dislike the new Cybertruck car. They say it looks like a dumpster\"\n  ]\n}\n```\n\n### Example 2 - Input:\nCompany: \"Apple\"\n\n### Example 2 - Output:\n```json\n{\n  \"headlines\": [\n    \"Apple Launches 'iPlant,' a Smart Home Device That Monitors Your Plants' Emotions\",\n    \"Apple and Disney sued by over privacy concerns.\",\n  ]\n}\n```\n\n# Notes\n\n- Headlines should be creative way, positive, and negative\n- Ensure headlines are suitable for a light-hearted stock simulation game but include some negative news\n- Keep each headline concise yet interesting, and vary their focus as much as possible."
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "AAPL"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "{\n  \"headlines\": [\n    \"Apple Launches 'iPlant,' a Smart Home Device That Monitors Your Plants' Emotions and reports record-breaking sales\",\n    \"Rumor Mill: Apple Reportedly Fails to develop Foldable iPhone. Losing competition to Google\",\n    \"Apple and Disney sued by over privacy concerns.\"\n  ]\n}"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "TSLA"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "{\n  \"headlines\": [\n    \"TSLA reports an explosion in their new gigafactory location\",\n    \"Industry experts dislike the new Cybertruck car.\"\n  ]\n}"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "MSFT"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "{\n  \"headlines\": [\n    \"Microsoft Announces Mind-Controlled Video Games: 'Xbox Your Brain'!\",\n    \"Microsoft's New AI-Powered Clippy Crashes Stock Trading: 'Paperclips Everywhere!'\",\n    \"Windows 13 Rollout Stumbles as Users Complain of Unexpected Blue Screens\"\n  ]\n}"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": "MSFT"
                }
            ]
            },
            {
            "role": "assistant",
            "content": [
                {
                "type": "text",
                "text": "{\n  \"headlines\": [\n    \"Microsoft Acquires Espresso Tech: Future Office Meetings to Be Powered by Coffee!\",\n    \"New Windows Update Touted as 'Perfect' by Developers, But Users Find Bugs Quickly\",\n    \"Microsoft's Cloud Gaming Expansion Faces Backlash from Traditional Gamers\"\n  ]\n}"
                }
            ]
            },
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": next_company
                }
            ]
            }
        ],
        temperature=1,
        max_tokens=6261,
        top_p=1,
        frequency_penalty=0,
        presence_penalty=0,
        response_format={
            "type": "json_object"
        }
    )
    return json.loads(response_two.choices[0].message.content)

def say_hello():
    return 'Hello, World!'

@app.route('/')
@cross_origin()
def index():
    return say_hello()

@app.route('/hello/<name>')
@cross_origin()
def hello_name(name):
    return 'Hello, ' + name

@app.route('/hello', methods=['POST'])
@cross_origin()
def hello():
    name = request.form['name']
    return 'Hello, ' + name

def generate_company_news(ticker, num_articles):
    headlines = generate_news_headlines(ticker)
    return headlines['headlines'][:num_articles]

def generate_global_news():
    global_news = []
    for _ in range(3):
        global_news.append("Ambiguous global news")
    return global_news

def simulate_market(previous_round=None):
    if previous_round is None:
        stocks = get_top_stocks()
        interest_rate = round(random.uniform(0, 5), 2)
        inflation_rate = round(random.uniform(0, 5), 2)
        gdp_growth_rate = round(random.uniform(0, 5), 2)
    else:
        stocks = previous_round['stocks']
        for stock in stocks:
            predict_next_price = simulate_stock_price({
                "asset": stock['ticker'],
                "current_price": stock['price'],
                "news": stock['news']
            })
            stock['price'] = predict_next_price['new_price']
        interest_rate = round(previous_round['interest_rate'] + random.uniform(-0.5, 0.5), 2)
        inflation_rate = round(previous_round['inflation_rate'] + random.uniform(-0.5, 0.5), 2)
        gdp_growth_rate = round(previous_round['gdp_growth_rate'] + random.uniform(-0.5, 0.5), 2)

    market_data = {
        'stocks': stocks,
        'interest_rate': interest_rate,
        'inflation_rate': inflation_rate,
        'gdp_growth_rate': gdp_growth_rate,
        'global_news': generate_global_news()
    }

    for stock in market_data['stocks']:
        stock['news'] = generate_company_news(stock['ticker'], random.randint(1, 3))

    return market_data

def generate_round_id():
    return ''.join(random.choices('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=6))

def generate_all_rounds(rounds, time_per_round):
    market_data = []
    previous_round = None
    for _ in range(rounds):
        new_round = simulate_market(previous_round)
        new_round['round_id'] = generate_round_id()
        market_data.append(new_round)
        previous_round = copy.deepcopy(new_round)  # Make a deep copy of the round data
    # Let's dump the round to a file
    with open('market_data.json', 'w') as f:
        json.dump(market_data, f)
    return market_data

@app.route('/create_room', methods=['POST'])
@cross_origin()
def create_room():
    data = request.get_json()
    game_code = data.get('gameCode')
    rounds = int(data.get('rounds'))  # Convert rounds to integer
    time_per_round = data.get('timePerRound')
    difficulty = data.get('difficulty')
    id_token = data.get('idToken')

    if not game_code:
        return jsonify({'error': 'Game code is required'}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        user = auth.get_user(uid)
        display_name = user.display_name if user.display_name else user.email.split('@')[0]
    except Exception as e:
        return jsonify({'error': 'Invalid ID token'}), 401

    room_ref = db.collection('rooms').document(game_code)
    room_ref.set({
        'gameCode': game_code,
        'rounds': rounds,
        'timePerRound': int(time_per_round),
        'difficulty': difficulty,
        'players': [display_name],
        'authorizedPlayers': [uid],
        'createdBy': uid,
        'started': False
    })

    return jsonify({'message': 'Room created', 'gameCode': game_code, 'roomId': room_ref.id}), 200

@app.route('/get_room', methods=['GET'])
@cross_origin()
def get_room():
    game_code = request.args.get('gameCode')
    if not game_code:
        return jsonify({'error': 'Game code is required'}), 400

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    return jsonify(room_data), 200

@app.route('/join_room', methods=['POST'])
@cross_origin()
def join_room():
    data = request.get_json()
    game_code = data.get('gameCode')
    id_token = data.get('idToken')

    if not game_code:
        return jsonify({'error': 'Game code is required'}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
        user = auth.get_user(uid)
        display_name = user.display_name if user.display_name else user.email.split('@')[0]
    except Exception as e:
        return jsonify({'error': 'Invalid ID token'}), 401

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    if uid not in room_data['authorizedPlayers']:
        room_ref.update({
            'players': firestore.ArrayUnion([display_name]),
            'authorizedPlayers': firestore.ArrayUnion([uid])
        })

    return jsonify({'message': 'Joined room', 'gameCode': game_code}), 200

@app.route('/start_game', methods=['POST'])
@cross_origin()
def start_game():
    data = request.get_json()
    game_code = data.get('gameCode')
    id_token = data.get('idToken')

    if not game_code:
        return jsonify({'error': 'Game code is required'}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid ID token'}), 401

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    if uid != room_data['createdBy']:
        return jsonify({'error': 'Only the room creator can start the game'}), 403

    market_data = generate_all_rounds(room_data['rounds'], room_data['timePerRound'])

    # Initialize portfolios
    portfolios = {}
    for player_uid in room_data['authorizedPlayers']:
        portfolios[player_uid] = {
            'cash': 100000,
            'holdings': [],
            'value_history': [100000]
        }

    room_ref.update({
        'started': True,
        'market_data': market_data,
        'portfolios': portfolios
    })
    
    # get the id of the first round and return it
    round_code = market_data[0]['round_id']
    return jsonify({'message': 'Game started', 'gameCode': game_code, 'roundCode': round_code}), 200

@app.route('/check_game_status', methods=['GET'])
@cross_origin()
def check_game_status():
    game_code = request.args.get('gameCode')
    if not game_code:
        return jsonify({'error': 'Game code is required'}), 400

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    if room_data.get('started'):
        round_code = room_data['market_data'][0]['round_id']
        return jsonify({'started': True, 'gameCode': game_code, 'roundCode': round_code}), 200
    else:
        return jsonify({'started': False}), 200

def get_top_stocks(n=10):
    tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'BRK-B', 'JNJ', 'V', 'WMT']
    stocks = []
    for ticker in tickers:
        stock = yf.Ticker(ticker)
        stock_history = stock.history(period='1d')
        if not stock_history.empty:
            stock_info = stock_history.iloc[-1]
            stocks.append({
                'ticker': ticker,
                'price': round(stock_info['Close'], 2)
            })
    return stocks[:n]

@app.route('/stonks', methods=['GET'])
@cross_origin()
def top_stocks():
    n = request.args.get('n', default=7, type=int)
    top_stocks = get_top_stocks(n)
    return jsonify(top_stocks), 200

@app.route('/transact', methods=['POST'])
@cross_origin()
def transact():
    data = request.get_json()
    id_token = data.get('idToken')
    ticker = data.get('ticker')
    operation = data.get('operation')  # 'buy' or 'sell'
    amount = data.get('amount')        # Number of shares
    game_code = data.get('gameCode')
    round_index = data.get('roundIndex')
    round_code = data.get('roundCode')

    if not all([id_token, ticker, operation, amount, game_code, round_code]) or round_index is None:
        return jsonify({'error': 'Missing required parameters'}), 400

    try:
        amount = int(amount)
        if amount <= 0:
            return jsonify({'error': 'Amount must be a positive integer'}), 400
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid ID token'}), 401

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    if uid not in room_data['authorizedPlayers']:
        return jsonify({'error': 'User not authorized in this room'}), 403

    if round_index >= len(room_data['market_data']) or room_data['market_data'][round_index]['round_id'] != round_code:
        return jsonify({'error': 'Invalid round index or round code'}), 400

    market_data = room_data['market_data'][round_index]
    stock_price = next((stock['price'] for stock in market_data['stocks'] if stock['ticker'] == ticker), None)
    if stock_price is None:
        return jsonify({'error': 'Stock not found in market data'}), 404

    portfolio = room_data['portfolios'][uid]
    cash = portfolio.get('cash', 0.0)

    # Calculate the transaction cost
    transaction_cost = stock_price * amount

    if operation == 'buy':
        if cash < transaction_cost:
            return jsonify({'error': 'Insufficient cash to complete the transaction'}), 400
        cash -= transaction_cost
        shares = amount
    elif operation == 'sell':
        shares = -amount
        cash -= transaction_cost
    else:
        return jsonify({'error': 'Invalid operation'}), 400

    # Append the transaction to holdings with a unique transaction ID
    portfolio['holdings'].append({
        'id': str(uuid.uuid4()),
        'ticker': ticker,
        'price': stock_price,
        'shares': shares
    })

    # Update the cash balance
    portfolio['cash'] = cash

    # Save the updated portfolio back to the database
    room_data['portfolios'][uid] = portfolio
    room_ref.set(room_data)

    return jsonify({'message': 'Transaction completed successfully', 'portfolio': portfolio}), 200

@app.route('/get_round_market_data', methods=['POST'])
@cross_origin()
def get_round_market_data():
    data = request.get_json()
    game_code = data.get('gameCode')
    round_code = data.get('roundCode')
    id_token = data.get('idToken')

    if not all([game_code, round_code, id_token]):
        return jsonify({'error': 'Missing required parameters'}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid ID token'}), 401

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    
    # Find the round index along with the market data
    round_index = None
    market_data = None
    for idx, round_data in enumerate(room_data['market_data']):
        if round_data['round_id'] == round_code:
            round_index = idx
            market_data = round_data.copy()  # Make a copy to avoid modifying original data
            break

    if market_data is None:
        return jsonify({'error': 'Round not found'}), 404

    # Add previous prices to stocks
    for stock in market_data['stocks']:
        if round_index == 0:
            stock['previous_price'] = stock['price']  # Same price for first round
        else:
            previous_round = room_data['market_data'][round_index - 1]
            previous_stock = next((s for s in previous_round['stocks'] if s['ticker'] == stock['ticker']), None)
            stock['previous_price'] = previous_stock['price'] if previous_stock else stock['price']

    portfolio = room_data['portfolios'].get(uid)
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    return jsonify({
        'marketData': market_data, 
        'portfolio': portfolio,
        'roundIndex': round_index
    }), 200

@app.route('/close_position', methods=['POST'])
@cross_origin()
def close_position():
    data = request.get_json()
    id_token = data.get('idToken')
    position_id = data.get('positionId')
    game_code = data.get('gameCode')
    round_code = data.get('roundCode')

    if not all([id_token, position_id, game_code, round_code]):
        return jsonify({'error': 'Missing required parameters'}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid ID token'}), 401

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    market_data = next((round_data for round_data in room_data['market_data'] if round_data['round_id'] == round_code), None)
    if not market_data:
        return jsonify({'error': 'Round not found'}), 404

    portfolio = room_data['portfolios'].get(uid)
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    position = next((pos for pos in portfolio['holdings'] if pos['id'] == position_id), None)
    if not position:
        return jsonify({'error': 'Position not found'}), 404

    stock_price = next((stock['price'] for stock in market_data['stocks'] if stock['ticker'] == position['ticker']), None)
    if stock_price is None:
        return jsonify({'error': 'Stock not found in market data'}), 404

    # Calculate the value of the position
    if position['shares'] < 0:
        # Short position: calculate profit/loss based on price change
        position_value = (position['price'] - stock_price) * abs(position['shares']) + position['price'] * abs(position['shares'])
    else:
        # Long position: calculate value based on current price
        position_value = stock_price * position['shares']

    # Update the portfolio
    portfolio['cash'] += position_value
    portfolio['holdings'] = [pos for pos in portfolio['holdings'] if pos['id'] != position_id]

    # Save the updated portfolio back to the database
    room_data['portfolios'][uid] = portfolio
    room_ref.set(room_data)

    return jsonify({'message': 'Position closed successfully', 'portfolio': portfolio}), 200

@app.route('/complete_round', methods=['POST'])
@cross_origin()
def complete_round():
    data = request.get_json()
    id_token = data.get('idToken')
    game_code = data.get('gameCode')
    round_code = data.get('roundCode')

    if not all([id_token, game_code, round_code]):
        return jsonify({'error': 'Missing required parameters'}), 400

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token['uid']
    except Exception as e:
        return jsonify({'error': 'Invalid ID token'}), 401

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    portfolio = room_data['portfolios'].get(uid)
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    # Calculate total portfolio value
    total_value = portfolio['cash']
    for holding in portfolio['holdings']:
        stock_price = next((stock['price'] for stock in room_data['market_data'][-1]['stocks'] if stock['ticker'] == holding['ticker']), None)
        if stock_price is not None:
            if holding['shares'] < 0:
                total_value += (holding['price'] - stock_price) * abs(holding['shares']) + holding['price'] * abs(holding['shares'])
            else:
                total_value += stock_price * holding['shares']

    # Append total value to value_history
    portfolio['value_history'].append(total_value)
    room_data['portfolios'][uid] = portfolio

    # Mark the user as having completed the round
    if 'completed_rounds' not in room_data:
        room_data['completed_rounds'] = {}
    if round_code not in room_data['completed_rounds']:
        room_data['completed_rounds'][round_code] = []
    room_data['completed_rounds'][round_code].append(uid)

    # Save the updated room data
    room_ref.set(room_data)

    return jsonify({'message': 'Round completed successfully'}), 200

@app.route('/check_round_completion', methods=['POST'])
@cross_origin()
def check_round_completion():
    data = request.get_json()
    game_code = data.get('gameCode')
    round_code = data.get('roundCode')

    if not all([game_code, round_code]):
        return jsonify({'error': 'Missing required parameters'}), 400

    room_ref = db.collection('rooms').document(game_code)
    room = room_ref.get()
    if not room.exists:
        return jsonify({'error': 'Room not found'}), 404

    room_data = room.to_dict()
    completed_rounds = room_data.get('completed_rounds', {}).get(round_code, [])
    all_users_completed = len(completed_rounds) == len(room_data['authorizedPlayers'])

    if all_users_completed:
        current_round_index = next((index for index, round_data in enumerate(room_data['market_data']) if round_data['round_id'] == round_code), None)
        if current_round_index is None or current_round_index + 1 >= len(room_data['market_data']):
            return jsonify({'error': 'No more rounds available'}), 400

        new_round_code = room_data['market_data'][current_round_index + 1]['round_id']
        return jsonify({'allUsersCompleted': True, 'newRoundCode': new_round_code}), 200
    else:
        return jsonify({'allUsersCompleted': False}), 200

if __name__ == '__main__':
    # Example usage
    # example = {
    # "asset": "MSFT",
    # "current_price": 495,
    # "news": [
    #     "Microsoft Acquires Espresso Tech: Future Office Meetings to Be Powered by Coffee!",
    #     "New Windows Update Touted as 'Perfect' by Developers, But Users Find Bugs Quickly",
    #     "Microsoft's Cloud Gaming Expansion Faces Backlash from Traditional Gamers"
    # ]
    # }

    # next_company = "Verizon"

    # stock_price_simulation = simulate_stock_price(example)
    # news_headlines = generate_news_headlines(next_company)

    # print(stock_price_simulation)
    # print(news_headlines)
    app.run(debug=True)