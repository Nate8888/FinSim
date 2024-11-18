from flask import Flask, request, jsonify
from google.cloud import firestore
from google.oauth2 import service_account
from flask_cors import CORS, cross_origin
import firebase_admin
from firebase_admin import credentials, auth

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

@app.route('/create_room', methods=['POST'])
@cross_origin()
def create_room():
    data = request.get_json()
    game_code = data.get('gameCode')
    rounds = data.get('rounds')
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
        'timePerRound': time_per_round,
        'difficulty': difficulty,
        'players': [display_name],
        'authorizedPlayers': [uid],
        'createdBy': uid
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

if __name__ == '__main__':
    app.run(debug=True)