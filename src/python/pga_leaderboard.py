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

def trawlScores():
	#scores object should be {player: (score, thru)}
	return scores
	
def postScores(round_abbrev, scores):
	round_doc = db.collection("rounds").document(round_abbrev)
	round_dict = round_doc.get().to_dict()
	#...
	round_doc.set(round_dict)
