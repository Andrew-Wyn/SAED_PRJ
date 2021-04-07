from flask import Flask

from module_try.utils import prova

app = Flask(__name__)


@app.route("/saed/api/")
def hello():
    return "Hello World from Flask in a uWSGI Nginx Docker container with \
     Python 3.8 (from the example template)"

@app.route("/saed/api/prova")
def api_prova():
    return prova()

if __name__ == "__main__":
    # Only for debugging while developing
    app.run(host="0.0.0.0", debug=True, port=80)
