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

app = Flask(__name__)
CORS(app)

db_cred = service_account.Credentials.from_service_account_file('creds.json')
db = firestore.Client(credentials=db_cred)

# Initialize Firebase Admin SDK
cred = credentials.Certificate('creds.json')
firebase_admin.initialize_app(cred)

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
    news = []
    for _ in range(num_articles):
        sentiment = random.choice(['good', 'bad'])
        news.append(f"{sentiment.capitalize()} news about {ticker}")
    return news

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
            stock['price'] = round(stock['price'] * (1 + random.uniform(-0.11, 0.20)), 2)
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
        previous_round = new_round
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
    n = request.args.get('n', default=5, type=int)
    top_stocks = get_top_stocks(n)
    return jsonify(top_stocks), 200

@app.route('/transact', methods=['POST'])
@cross_origin()
def transact():
    data = request.get_json()
    id_token = data.get('idToken')
    ticker = data.get('ticker')
    operation = data.get('operation')
    amount = data.get('amount')
    game_code = data.get('gameCode')
    round_index = data.get('roundIndex')
    round_code = data.get('roundCode')

    if not all([id_token, ticker, operation, amount, game_code, round_index, round_code]):
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
    if uid not in room_data['authorizedPlayers']:
        return jsonify({'error': 'User not authorized in this room'}), 403

    if round_index >= len(room_data['market_data']) or room_data['market_data'][round_index]['round_id'] != round_code:
        return jsonify({'error': 'Invalid round index or round code'}), 400

    market_data = room_data['market_data'][round_index]
    stock_price = next((stock['price'] for stock in market_data['stocks'] if stock['ticker'] == ticker), None)
    if stock_price is None:
        return jsonify({'error': 'Stock not found in market data'}), 404

    portfolio = room_data['portfolios'][uid]
    holdings = portfolio['holdings']
    cash = portfolio['cash']

    if operation == 'buy':
        total_cost = stock_price * amount
        for holding in holdings:
            if holding['ticker'] == ticker:
                if holding['shares'] < 0:
                    # Cancel out the short position
                    if abs(holding['shares']) >= amount:
                        profit = (holding['price'] - stock_price) * amount
                        cash += profit
                        holding['shares'] += amount
                        if holding['shares'] == 0:
                            holdings.remove(holding)
                    else:
                        profit = (holding['price'] - stock_price) * abs(holding['shares'])
                        cash += profit
                        amount -= abs(holding['shares'])
                        holdings.remove(holding)
                        cash -= stock_price * amount
                        holdings.append({'ticker': ticker, 'shares': amount, 'price': stock_price})
                else:
                    cash -= total_cost
                    holding['shares'] += amount
                break
        else:
            cash -= total_cost
            holdings.append({'ticker': ticker, 'shares': amount, 'price': stock_price})
    elif operation == 'sell':
        for holding in holdings:
            if holding['ticker'] == ticker:
                if holding['shares'] > 0:
                    if holding['shares'] >= amount:
                        cash += stock_price * amount
                        holding['shares'] -= amount
                        if holding['shares'] == 0:
                            holdings.remove(holding)
                    else:
                        cash += stock_price * holding['shares']
                        amount -= holding['shares']
                        holdings.remove(holding)
                        cash += stock_price * amount
                        holdings.append({'ticker': ticker, 'shares': -amount, 'price': stock_price})
                else:
                    cash += stock_price * amount
                    holding['shares'] -= amount
                break
        else:
            cash += stock_price * amount
            holdings.append({'ticker': ticker, 'shares': -amount, 'price': stock_price})
    else:
        return jsonify({'error': 'Invalid operation'}), 400

    portfolio['cash'] = cash
    room_ref.update({'portfolios': room_data['portfolios']})

    return jsonify({'message': 'Transaction successful', 'portfolio': portfolio}), 200

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
    market_data = next((round_data for round_data in room_data['market_data'] if round_data['round_id'] == round_code), None)
    if not market_data:
        return jsonify({'error': 'Round not found'}), 404

    portfolio = room_data['portfolios'].get(uid)
    if not portfolio:
        return jsonify({'error': 'Portfolio not found'}), 404

    return jsonify({'marketData': market_data, 'portfolio': portfolio}), 200

if __name__ == '__main__':
    app.run(debug=True)