from flask import Flask, request, jsonify
import cx_Oracle
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/rsvp", methods=["POST"])
def rsvp():
    data = request.get_json()
    first_name = data.get("firstName")
    last_name = data.get("lastName")
    email = data.get("email")
    number = data.get("number")

    try:
        cursor = connection.cursor()
        cursor.execute("""
            INSERT INTO wedding_guests (first_name, last_name, email, phone)
            VALUES (:1, :2, :3, :4)
        """, (first_name, last_name, email, number))
        connection.commit()
        return jsonify({"message": "RSVP received"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=5000)

