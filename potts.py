from flask import Flask, jsonify, render_template, request, json
from flaskext.mysql import MySQL
import sys

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

def get_args(l):
    return [int(request.args.get(p)) if p == "userId" else round(float(request.args.get(p)), 2) if p == "eAmount" else request.args.get(p) for p in l]

@app.route("/authenticate")
def authenticate():
    try:
        cursor.execute("SELECT * from User where Username=\'%s\' and Password=\'%s\'" % tuple(get_args(["usr", "pwd"])))
        data = cursor.fetchone()
        return jsonify(result={"status":"ok", "userId":data[0]})
    except:
    	return jsonify(result={"status":"failed"})    	

@app.route("/addCategory")
def add_category():
    try:
        command = "INSERT INTO Category VALUES (%d, \'%s\', \'%s\')" % tuple(get_args(["userId", "categ", "sub"]))
        cursor.execute(command)
        conn.commit()
        return jsonify(result={"status":"ok"})
    except:
        return jsonify(result={"status":"failed"})

@app.route("/delCategory")
def del_category():
    try:
        command = "DELETE FROM Category WHERE userId=%d AND category=\'%s\' AND subcategory=\'%s\'" % tuple(get_args(["userId", "rCateg", "rSubCateg"]))
        cursor.execute(command)
        conn.commit()
        return jsonify(result={"status":"ok"})
    except:
        return jsonify(result={"status":"failed"})

@app.route("/queryCategory")
def query_category():
    try:
        cursor.execute("SELECT category, subcategory from Category where category<>'income' and userId=" + request.args.get("userId"))
        data = cursor.fetchall()
        return jsonify(result={"status":"ok", "result":data})
    except:
        return jsonify(result={"status":"failed"})        

@app.route("/insertExpense")
def insert_expense():
    try:
        command = "INSERT INTO expenseRecord VALUES (%d, \'%s\', \'%s\', \'%s\', %f, \'%s\')" % tuple(get_args(["userId", "categ", "sub", "eName", "eAmount", "eDate"]))
        cursor.execute(command)
        print command
        conn.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print e
        return jsonify(result={"status":"failed"})

@app.route("/delExpense")
def del_expense():
    try:
        command = "DELETE FROM expenseRecord WHERE userId=%d AND category=\'%s\' AND subcategory=\'%s\' and name=\'%s\' and amount<=%f and date=str_to_date(\'%s\'" % tuple(get_args(["userId", "rCateg", "rSubCateg", "rName", "eAmount", "rDate"]))
        command += ", '%" + "Y-%" + "d-%" + "m %" + "h:%" + "i:%" + "s')"
        print command
        cursor.execute(command)
        conn.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "here"
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryExpense")
def query_expense():
    try:
        command = "SELECT category, subcategory, name, amount, date_format(date, '%m/%d/%Y') from expenseRecord where " + ("userId=%d" % int(request.args.get("userId")))
        print command
        cursor.execute(command)
        data, result = cursor.fetchall(), []
        print data
        for l in data:
            m = []
            for x in l:
                try: m.append(round(float(x), 2))
                except: m.append(x)
            result.append(m)
        return jsonify(result={"status":"ok", "result":result})
    except Exception as e:
        print e
        return jsonify(result={"status":"failed"})        

@app.route("/getMonthlyExpense")
def get_monthly_expense():
    try:
        me = []
        for i in range(1, 13):
            command = "select sum(amount) from expenserecord where category<>'income' and userId=%d and month(date)=%d" % (int(request.args.get("userId")), i)
            cursor.execute(command)
            data = cursor.fetchall()[0][0]
            if data is None: me.append(0.00)
            else: me.append(round(data, 2))
        return jsonify(result={"status":"ok", "meArray":me})
    except Exception as e:
        return jsonify(result={"status":"failed"})

@app.route("/getAllocation")
def get_allocation():
    try:
        cArray, aArray, userId = json.loads(request.args.get("cArray")), [], int(request.args.get("userId"))
        for c in cArray:
            command = "select sum(amount) from expenseRecord where userId=%d and category=\'%s\'" % (userId, c)
            cursor.execute(command)
            data = cursor.fetchall()[0][0]
            if not data is None: aArray.append((c, round(data, 2)))
        return jsonify(result={"status":"ok", "aArray":aArray})
    except Exception as e:
        print e
        return jsonify(result={"status":"failed"})

@app.route("/editNet")
def edit_net():
    try:
        userId, a, l = int(request.args.get("userId")), json.loads(request.args.get("asset")), json.loads(request.args.get("liability"))
        d = dict(a.items() + l.items())
        command, info = "update net set ", ""
        for k in d:
            info += k + "=" + (str(float(d[k])) if d[k] != "" else "0.0") + " "
        command += ",".join(info.strip().split())
        command += " where userId=%d" % userId
        cursor.execute(command)
        conn.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryNet")
def query_net():
    try:
        userId = int(request.args.get("userId"))
        command = "select cash, investments, property, retirement, loan, debt, morgages from net where userId=%d" % userId
        cursor.execute(command)
        data = cursor.fetchall()
        return jsonify(result={"status":"ok", "vals":list(data[0])})
    except Exception as e:
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryIncome")
def query_income():
    try:
        userId = int(request.args.get("userId"))
        command = "select sum(amount) from expenserecord where category='Income' and userId=%d" % userId
        cursor.execute(command)
        data = cursor.fetchall()
        return jsonify(result={"status":"ok", "income":round(float(data[0][0]), 2)})
    except Exception as e:
        print e
        return jsonify(result={"status":"failed"})

@app.route("/")
def index():
	return render_template('index.html')
 
if __name__ == "__main__":
    app.run()