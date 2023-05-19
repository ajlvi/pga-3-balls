from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup as BS
import sys
import time
import datetime
import re

def bovadaSource(url):
	options = Options()
	options.headless=True
	driver = webdriver.Firefox(options=options)
	driver.get(url)
	element = WebDriverWait(driver=driver, timeout=5).until(EC.presence_of_element_located((By.CLASS_NAME, 'markets-container')))
#	header = driver.find_element(By.LINK_TEXT, "PGA Tour - THE PLAYERS Championship - 2/3 Balls (27)")
#	header.click()
	source = driver.page_source
	driver.quit()
	return source

def parseBovada(source):
	sgm = source.split("<sp-single-market")
	blocks = [market for market in sgm if "1st-round-3-balls" in market or "2nd-round-3-balls" in market]
	print(len(blocks))
	pairings = []
	for block in blocks:
		pairing = {}
		
		dateregex = r"(\d+)/(\d+)/(\d+)"
		timeregex = r"(\d+):(\d+) ([AP])"
		game_month = int(re.search(dateregex, block).groups()[0])
		game_day = int(re.search(dateregex, block).groups()[1])
		game_year = 2000+ int(re.search(dateregex, block).groups()[2])
		game_hours = int(re.search(timeregex, block).groups()[0])
		game_minutes = int(re.search(timeregex, block).groups()[1])
		game_meridiem = re.search(timeregex, block).groups()[2]
		if game_meridiem == "P" and game_hours != 12: game_hours += 12
		game_start = datetime.datetime(game_year, game_month, game_day, game_hours, game_minutes)
		pairing["time"] = game_start.timestamp() * 1000
		
		pairing["p1"] = block.split('<span class="outcomes">')[1].split("</span>")[0]
		pairing["p2"] = block.split('<span class="outcomes">')[2].split("</span>")[0]
		pairing["p3"] = block.split('<span class="outcomes">')[3].split("</span>")[0]
		
		pairing["odds1"] = block.split('<span class="bet-price">')[1].split("</span>")[0].strip()
		pairing["odds2"] = block.split('<span class="bet-price">')[2].split("</span>")[0].strip()
		pairing["odds3"] = block.split('<span class="bet-price">')[3].split("</span>")[0].strip()

		pairings.append(pairing)
	return pairings

def draftKingsSource(url):
	options = Options()
	options.headless=True
	driver = webdriver.Firefox(options=options)
	driver.get(url)
	element = WebDriverWait(driver=driver, timeout=5).until(EC.presence_of_element_located((By.CLASS_NAME, 'outcomes')))
	source = driver.page_source
	driver.quit()
	return source
	
def parseDK(source):
#right now there's no wrapper div for each game, so we have to go team by team and assemble them in pairs.
	keyphrase = '<span><span>'
	pairings = []
	blockstarts = [a for a in range(len(source)) if source[a:a+len(keyphrase)] == keyphrase]
	for start in blockstarts:
		pairing = {}
		remaining = source[start:]
		chunks = remaining.split("</span>")
		game_date = chunks[0].split(">")[-1]
		game_time = chunks[1].split(">")[-1]
		
		pairing["p1"] = chunks[3].split(">")[-1]
		pairing["odds1"] = chunks[4].split(">")[-1]
		pairing["p2"] = chunks[5].split(">")[-1]
		pairing["odds2"] = chunks[6].split(">")[-1]
		pairing["p3"] = chunks[7].split(">")[-1]
		pairing["odds3"] = chunks[8].split(">")[-1]
		
#		print(game_time)
		timeregex = r"(\d+):(\d+)"
		game_hours, game_minutes = map(int, re.search(timeregex, game_time).groups()())
		if "PM" in game_time and game_hours != 12: game_hours += 12
		this_year, this_month, this_day = datetime.date.today().year, datetime.date.today().month, datetime.date.today().day
		if game_date == "Tomorrow": start_month, start_day = nextDay(this_month, this_day)
		else: 
			assert game_date == "Today"
			start_month, start_day = this_month, this_day
		game_start = datetime.datetime(this_year, start_month, start_day, game_hours, game_minutes)
		pairing["time"] = game_start.timestamp() * 1000
		
		pairings.append(pairing)
	return pairings

def nextDay(mm, dd):
	if dd == 31 and mm in [1, 3, 5, 7, 8, 10, 12]: return (mm+1, 1)
	elif dd == 30 and mm in [4, 6, 9, 11]: return (mm+1, 1)
	elif (mm, dd) == (2, 28): return (3, 1)
	else: return (mm, dd+1)
