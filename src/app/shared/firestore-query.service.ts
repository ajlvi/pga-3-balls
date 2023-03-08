import { Injectable } from "@angular/core";

@Injectable({providedIn: 'root'})
export class FirestoreQueryService {
    query_player_picks_single(user: string, round: string) {
        return {
        "structuredQuery": {
            "where": {
            "compositeFilter": {
                "op": "AND",
                "filters": [ 
                    { "fieldFilter": {
                        "field": { "fieldPath": "user" },
                        "op": "EQUAL",
                        "value": { "stringValue": user }
                    }} , 
                    { "fieldFilter": {
                        "field": { "fieldPath": "round" },
                        "op": "EQUAL",
                        "value": { "stringValue": round }
                    }},
                ]
            }
            },
            "from": [
            {
                "collectionId": "picks",
                "allDescendants": true
            }
            ]
        }
        }
    }

    query_player_picks_multiple(users: string[], round: string) {
        let usersArray = {"values": []};
        for (let user of users) { usersArray["values"].push({"stringValue": user})};
        return {
        "structuredQuery": {
            "where": {
            "compositeFilter": {
                "op": "AND",
                "filters": [ 
                    { "fieldFilter": {
                        "field": { "fieldPath": "user" },
                        "op": "IN",
                        "value": { "arrayValue": usersArray }
                    }} , 
                    { "fieldFilter": {
                        "field": { "fieldPath": "round" },
                        "op": "EQUAL",
                        "value": { "stringValue": round }
                    }},
                ]
            }
            },
            "from": [
            {
                "collectionId": "picks",
                "allDescendants": true
            }
            ]
        }
        }
    }

    query_group_membership(groupname: string) {
        return {
          "structuredQuery": {
            "where": {
              "fieldFilter": {
                "field": { "fieldPath": "groups" },
                "op": "ARRAY_CONTAINS",
                "value": { "stringValue": groupname }
              }
            },
            "from": [
              {
                "collectionId": "users",
                "allDescendants": true
              }
            ]
          }
        }
      }
}