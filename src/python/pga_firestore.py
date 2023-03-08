import os
import time
from sys import argv

import firebase_admin
from firebase_admin import firestore
from firebase_admin import credentials

import pga_getlines as getlines
firestore_api_key = "AIzaSyAsl4vF8D0IKDHKISbd3fF1qKEz8F7xrpk"
credential_path = "/home/ajlvi/Documents/firebase-keys/pga-3-balls-firebase-adminsdk-jl7kj-40546a6a01.json"
cred = credentials.Certificate(credential_path)
app = firebase_admin.initialize_app(cred)
db = firestore.client()

def main(url, event, abbrev):
    rounds = db.collection("rounds")
    round_doc = rounds.document(abbrev)

    current_doc = rounds.document("current")
    current_dict = current_doc.get().to_dict()
    current_dict["current"] = abbrev
    if current_dict["progression"][-1] != abbrev: current_dict["progression"].append(abbrev)    
    current_doc.set(current_dict)

    matches = getlines.parseBovada(getlines.bovadaSource(url))
    print(len(matches), matches[0])
    round_data = {}
    for i in range(len(matches)):
        for key in matches[i]:
            round_data[f"group{i}_{key}"] = matches[i][key]
    round_data["round_name"] = event
    round_data["round_abbrev"] = abbrev
    round_doc.set(round_data)
    
def grade(abbrev):
	#get the document for the round [assumes all groupXX_scores are final]
	#find all picks documents for this round
	#for each of those people, grade their picks; update picks document
	#... then update the user document with record and lifetime units
	pass

if __name__ == '__main__':
    #https://www.bovada.lv/sports/golf?overlay=login
    url = input("Bovada URL: ")
    event = input("event name: ")
    abbrev = input("event abbrev: ")
    main(url, event, abbrev)
