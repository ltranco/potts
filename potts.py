from flask import Flask, jsonify, render_template, request, json
import MySQLdb

app = Flask(__name__)
app.debug = True
app.config['MYSQL_DATABASE_USER'] = 'potts'
app.config['MYSQL_DATABASE_PASSWORD'] = 'nicetry'
app.config['MYSQL_DATABASE_DB'] = 'potts$Potts'
app.config['MYSQL_DATABASE_HOST'] = 'potts.mysql.pythonanywhere-services.com'

class DB:
  conn = None

  def connect(self):
    self.conn = MySQLdb.connect(host="potts.mysql.pythonanywhere-services.com",
                                user="potts",
                                passwd="nicetry",
                                db="potts$Potts")

  def commit(self):
    self.conn.commit()

  def query(self, sql):
    try:
      cursor = self.conn.cursor()
      cursor.execute(sql)
    except (AttributeError, MySQLdb.OperationalError):
      self.connect()
      cursor = self.conn.cursor()
      cursor.execute(sql)
    return cursor.fetchall()

db = DB()

def get_args(l):
    return [int(request.args.get(p)) if p == "userId" else round(float(request.args.get(p)), 2) if "Amount" in p else request.args.get(p) for p in l]

@app.route("/authenticate")
def authenticate():
    try:
        command = "SELECT * from User where Username=\'%s\' and Password=\'%s\'" % tuple(get_args(["usr", "pwd"]))
        data = db.query(command)
        return jsonify(result={"status":"ok", "userId":data[0][2]})
    except Exception as e:
        print "line 27: ",
        print e
    	return jsonify(result={"status":"failed"})

@app.route("/addCategory")
def add_category():
    try:
        command = "INSERT INTO Category VALUES (%d, \'%s\')" % tuple(get_args(["userId", "categ"]))
        db.query(command)
        db.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "Line 39: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/delCategory")
def del_category():
    try:
        command = "DELETE FROM Category WHERE userId=%d AND category=\'%s\'" % tuple(get_args(["userId", "rCateg"]))
        db.query(command)
        db.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "Line 50: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryCategory")
def query_category():
    try:
        command = "SELECT category from Category where userId=" + request.args.get("userId")
        if(request.args.get("excludeIncome") == "true"):
            command += " and category<>'income'"
        data = db.query(command)
        return jsonify(result={"status":"ok", "result":data})
    except Exception as e:
        print "Line 60: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/insertExpense")
def insert_expense():
    try:
        command = "INSERT INTO ExpenseRecord VALUES (%d, \'%s\', \'%s\', %f, \'%s\')" % tuple(get_args(["userId", "categ", "eName", "eAmount", "eDate"]))
        db.query(command)
        db.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "Line 71: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/delExpense")
def del_expense():
    try:
        command = "DELETE FROM ExpenseRecord WHERE userId=%d AND category=\'%s\' and name=\'%s\' and amount<=%f and date=str_to_date(\'%s\'" % tuple(get_args(["userId", "rCateg", "rName", "eAmount", "rDate"]))
        command += ", '%" + "Y-%" + "d-%" + "m %" + "h:%" + "i:%" + "s')"
        db.query(command)
        db.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "Line 84: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryExpense")
def query_expense():
    try:
        command = "SELECT category, name, amount, date_format(date, '%m/%d/%Y') from ExpenseRecord where " + ("userId=%d" % int(request.args.get("userId")))

        data, result = db.query(command), []
        for l in data:
            m = []
            for x in l:
                try: m.append(round(float(x), 2))
                except: m.append(x)
            result.append(m)
        return jsonify(result={"status":"ok", "result":result})
    except Exception as e:
        print "Line 103: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/getMonthlyExpense")
def get_monthly_expense():
    try:
        me = []
        for i in range(1, 13):
            command = "select sum(amount) from ExpenseRecord where category<>'Income' and userId=%d and month(date)=%d" % (int(request.args.get("userId")), i)

            data = db.query(command)[0][0]
            if data is None: me.append(0.00)
            else: me.append(round(data, 2))
        return jsonify(result={"status":"ok", "meArray":me})
    except Exception as e:
        print "Line 118: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/getAllocation")
def get_allocation():
    try:
        cArray, aArray, userId = json.loads(request.args.get("cArray")), [], int(request.args.get("userId"))
        for c in cArray:
            command = "select sum(amount) from ExpenseRecord where userId=%d and category=\'%s\'" % (userId, c)

            data = db.query(command)[0][0]
            if not data is None: aArray.append((c, round(data, 2)))
        return jsonify(result={"status":"ok", "aArray":aArray})
    except Exception as e:
        print "Line 132: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/editNet")
def edit_net():
    try:
        userId, a, l = int(request.args.get("userId")), json.loads(request.args.get("asset")), json.loads(request.args.get("liability"))
        d = dict(a.items() + l.items())
        command, info = "update Net set ", ""
        for k in d:
            info += k + "=" + (str(float(d[k])) if d[k] != "" else "0.0") + " "
        command += ",".join(info.strip().split())
        command += " where userId=%d" % userId
        db.query(command)
        db.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "Line 149: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryNet")
def query_net():
    try:
        userId = int(request.args.get("userId"))
        command = "select cash, investments, property, retirement, loan, debt, morgages from Net where userId=%d" % userId

        data = db.query(command)
        print "Line 174, ",
        return jsonify(result={"status":"ok", "vals":list(data[0])})
    except Exception as e:
        print "Line 171: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryIncome")
def query_income():
    try:
        userId = int(request.args.get("userId"))
        command = "select sum(amount) from ExpenseRecord where category='Income' and userId=%d" % userId

        data = db.query(command)
        return jsonify(result={"status":"ok", "income":round(float(data[0][0]), 2)})
    except Exception as e:
        print "Line 184: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/addGoal")
def add_goal():
    try:
        command = "INSERT INTO Goal VALUES (%d, \'%s\', %f, %f)" % tuple(get_args(["userId", "goalName", "exAmount", "curAmount"]))
        db.query(command)
        db.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "Line 213: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/queryGoal")
def query_goal():
    try:
        userId = int(request.args.get("userId"))
        command = "select name, expected, current from Goal where userId=%d" % userId
        data = db.query(command)
        return jsonify(result={"status":"ok", "result":data})
    except Exception as e:
        print "Line 256: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/delGoal")
def del_goal():
    try:
        command = "DELETE FROM Goal WHERE userId=%d AND name=\'%s\'AND expected<=%f AND current<=%f" % tuple(get_args(["userId", "name", "exAmount", "curAmount"]))
        db.query(command)
        db.commit()
        return jsonify(result={"status":"ok"})
    except Exception as e:
        print "Line 238: ",
        print e
        return jsonify(result={"status":"failed"})

@app.route("/")
def index():
	return render_template('index.html')

if __name__ == "__main__":
    app.run()