import os
import time
import re
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

    print("Seeking matches...")
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
	#get the document for the round [assumes all groupXX_scores are final] and add winners
	round_doc = db.collection("rounds").document(abbrev)
	round_obj = round_doc.get()
	round_dict = round_obj.to_dict()
	totg = max([group_num(key) for key in round_dict]) + 1
	for g in range(totg):
		score1 = int(round_dict[f"group{g}_s1"]
		score2 = int(round_dict[f"group{g}_s1"]
		score3 = int(round_dict[f"group{g}_s1"]
		scores = [score1, score2, score3]
		if 100 in scores or 101 in scores: winner = "no action"
		elif scores.count(min(scores)) > 1: winner = "push"
		else:
			winner_idx = scores.index(min(scores)) + 1
			winner = round_dict[f"group{g}_p{winner_idx}"]
		round_dict[f"group{g}_winner"] = winner
	round_doc.set(round_dict)
	
	#find all picks documents for this round
	user_picks = db.collection("picks").where("round", "==", abbrev)
	#for each of those people, grade their picks; update picks document
	for pick_doc in user_picks.stream():
		pick_dict = pick_doc.to_dict()
		wins, losses, ties = 0, 0, 0
		unit_delta = 0
		for g in range(totg):
			if round_dict[f"group{g}_winner"] == "no action": pass
			elif round_dict[f"group{g}_winner"] == "push": ties += 1
			elif round_dict[f"group{g}_winner"] == pick_dict[f"pick_{g}"]:
				wins += 1
				unit_delta += odds_to_units(round_dict[f"group{g}_odds"]
			else:
				losses += 1
				unit_delta -= 1	
	#... then update the user document with record and lifetime units
		user_doc = db.collection("users").document(pick_doc["user"])
		user_obj = user_doc.get()
		user_dict = user_obj.to_dict()
		user_dict["groupsWon"] += wins
		user_dict["groupsLost"] += losses
		user_dict["groupsTied"] += ties
		user_dict["lifetimeUnits"] += unit_delta
		user_doc.set(user_dict)
	
def odds_to_units(odds):
	if odds == "EVEN": return 1
	elif odds[0] == "+": return int(odds[1:])/100
	else: return 100/int(odds[1:])
	
def group_num(key):
	groupregex = r"group(\d+)_"
	search = re.search(groupregex, key)
	if search: return int(search.groups()[0])
	else: return 0

if __name__ == '__main__':
    #https://www.bovada.lv/sports/golf?overlay=login
    url = input("Bovada URL: ")
    event = input("event name: ")
    abbrev = input("event abbrev: ")
    main(url, event, abbrev)
