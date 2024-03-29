import os
import time
from sys import argv
import json
import re
names = json.load(open("names.json")) #this is {BOVADA : PGA}

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup as BS

import firebase_admin
from firebase_admin import firestore
from firebase_admin import credentials

firestore_api_key = "AIzaSyAsl4vF8D0IKDHKISbd3fF1qKEz8F7xrpk"
credential_path = "/home/ajlvi/Documents/firebase-keys/pga-3-balls-firebase-adminsdk-jl7kj-40546a6a01.json"
cred = credentials.Certificate(credential_path)
app = firebase_admin.initialize_app(cred)
db = firestore.client()

def pgaSource():
	options = Options()
	options.headless=True
	driver = webdriver.Firefox(options=options)
	driver.get("https://www.pgatour.com/leaderboard")
	element = WebDriverWait(driver=driver, timeout=5).until(EC.presence_of_element_located((By.CLASS_NAME, 'chakra-table')))
#	header = driver.find_element(By.LINK_TEXT, "PGA Tour - THE PLAYERS Championship - 2/3 Balls (27)")
#	header.click()
	source = driver.page_source
	driver.close()
	return source

def trawlScores(abbrev, source):
	#what round is it? in case we're doing this after the fact
	intendedRound = int(abbrev[-1])
	
	#scores object should be {player: (score, thru)}
	#for players starting on 10, use -N to indicate N holes played
	scores = {}
	
	raw_json = source.split('<script id="__NEXT_DATA__" type="application/json">')[1].split("</script>")[0]
	json_data = json.loads(raw_json)
	for player_dict in json_data["props"]["pageProps"]["leaderboard"]["players"]:
		if player_dict["__typename"] != "InformationRow": #cut line!
			name = player_dict["player"]["displayName"]
			score = int(player_dict["scoreSort"])
			thru = int(player_dict["thruSort"])
			if thru == 19: 
				thru = 18
				finished_round_id = int(player_dict["roundStatus"][1]) - 1
				score = int(player_dict["rounds"][finished_round_id])
			if player_dict["thru"] != '' and player_dict["thru"][-1] == "*": thru = -1 * thru
			scores[name] = (score, thru)
			
			if int(player_dict["roundHeader"][-1]) != intendedRound:
				try:
					thru = 18
					score = int(player_dict["rounds"][intendedRound-1])
				except ValueError:
					print(name)
					thru = 18
					score = 100
				scores[name] = (score, thru)
	return scores
	
def postScores(round_abbrev, scores):
	round_doc = db.collection("rounds").document(round_abbrev)
	round_obj = round_doc.get()
	round_dict = round_obj.to_dict()
	
	#how many groups are there? note indexing starts at 0
	totg = max([group_num(key) for key in round_dict]) + 1
	for g in range(totg):
		for i in [1, 2, 3]:
			key = f"group{g}_p{i}"
			player = round_dict[key]
			if player not in scores:
				try: player = names[player]
				except KeyError:
					scores[player] = (100, 18)
			round_dict[f"group{g}_s{i}"] = scores[player][0]
			round_dict[f"group{g}_thru"] = scores[player][1]
	
	round_doc.set(round_dict)

def is_done(scores):
	return not any([scores[player][1] < 18 for player in scores])
		
def group_num(key):
	groupregex = r"group(\d+)_"
	search = re.search(groupregex, key)
	if search: return int(search.groups()[0])
	else: return 0
	
if __name__ == '__main__':
	abbrev = "usopen23_r2"
	for loop in range(60*6):
		print("Collecting source...")
		source = pgaSource()
		print("Extracting scores...")
		scores = trawlScores(abbrev, source)
		print("Posting scores...")
		postScores(abbrev, scores)
		if is_done(scores): break
		else: 
			print("Posted.\n")
			time.sleep(60)
