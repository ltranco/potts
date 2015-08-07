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
conn = mysql.connect()
cursor = conn.cursor()

@app.route("/authenticate")
def authenticate():
    username = request.args.get('usr')
    password = request.args.get('pwd')
    cursor.execute("SELECT * from User where Username='" + username + "' and Password='" + password + "'")
    data = cursor.fetchone()
    if data is None:
        print "failed"
    	return jsonify(result={"status":"failed"})
    else:
        print data
    	return jsonify(result={"status":"ok", "userId":data[0]})

@app.route("/addCategory")
def addCategory():
    try:
        userId = request.args.get("userId")
        category = request.args.get("categ")
        sub = request.args.get("sub")
        command = "INSERT INTO Category VALUES (%d, \'%s\', \'%s\')" % (int(userId), category, sub)
        cursor.execute(command)
        conn.commit()
        return jsonify(result={"status":"ok"})
    except:
        return jsonify(result={"status":"failed"})

@app.route("/delCategory")
def delCategory():
    try:
        userId = request.args.get("userId")
        c = request.args.get("rCateg")
        s = request.args.get("rSubCateg")
        command = "DELETE FROM Category WHERE userId=%d AND category=\'%s\' AND subcategory=\'%s\'" % (int(userId), c, s)
        print command
        cursor.execute(command)
        conn.commit()
        return jsonify(result={"status":"ok"})
    except:
        print "failed"
        return jsonify(result={"status":"failed"})

@app.route("/queryCategory")
def queryCategory():
    userId = request.args.get("userId")
    cursor.execute("SELECT category, subcategory from Category where userId=" + userId)
    data = cursor.fetchall()
    if data is None:
        return jsonify(result={"status":"failed"})
    else:
        return jsonify(result={"status":"ok", "result":data})

@app.route("/")
def index():
	return render_template('index.html')
 
if __name__ == "__main__":
    app.run()