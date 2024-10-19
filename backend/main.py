from flask import Flask, request

app = Flask(__name__)

def say_hello():
    return 'Hello, World!'

@app.route('/')
def index():
    return say_hello()

# Receive name from get parameter
@app.route('/hello/<name>')
def hello_name(name):
    return 'Hello, ' + name

# Receive name from post parameter
@app.route('/hello', methods=['POST'])
def hello():
    name = request.form['name']
    return 'Hello, ' + name


if __name__ == '__main__':
    app.run(debug=True)