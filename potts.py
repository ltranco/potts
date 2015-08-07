from flask import Flask, jsonify, render_template, request
from flaskext.mysql import MySQL

app = Flask(__name__)
app.debug = True
app.config['MYSQL_DATABASE_USER'] = 'root'
app.config['MYSQL_DATABASE_PASSWORD'] = 'potts'
app.config['MYSQL_DATABASE_DB'] = 'Potts'
app.config['MYSQL_DATABASE_HOST'] = 'localhost'

mysql = MySQL()
mysql.init_app(app)
cursor = mysql.connect().cursor()

@app.route("/authenticate")
def authenticate():
    username = request.args.get('usr')
    password = request.args.get('pwd')
    
    cursor.execute("SELECT * from User where Username='" + username + "' and Password='" + password + "'")
    data = cursor.fetchone()
    if data is None:
    	return jsonify(result={"status":"failed"})
    else:
    	return jsonify(result={"status":"ok"})

@app.route("/insert")
def insert():

@app.route("/")
def index():
	return render_template('index.html')
 
if __name__ == "__main__":
    app.run()