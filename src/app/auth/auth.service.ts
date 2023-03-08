import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, catchError, switchMap, tap, throwError } from "rxjs";
import { environment } from "src/environments/environment";
import { CurrentEventService } from "../shared/current-event.service";
import { User } from "./user.model";

export interface AuthResponseData {
    idToken: string,
    email: string,
    refreshToken: string,
    expiresIn: string,
    localId: string,
    registered?: boolean
}

@Injectable({providedIn: 'root'}) 
export class AuthService {
    private tokenExpirationTimer: any;
    public user = new BehaviorSubject<null | User>(null);
    public currentEmail: string = ''; //do we want a getter here?

    constructor(
        private http: HttpClient,
        private router: Router,
        private current: CurrentEventService
    ) {}

    signup(email: string, password: string) {
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=' + environment.firebaseAPIkey,
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(
            catchError(this.handleAuthError),
            tap( responseData => {
                this.handleAuthentication(
                    responseData.email,
                    responseData.localId,
                    responseData.idToken,
                    +responseData.expiresIn
                )
            })
        )
    }

    login(email: string, password: string) {
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + environment.firebaseAPIkey,
            {
                email: email,
                password: password,
                returnSecureToken: true
            }
        ).pipe(
            catchError(this.handleAuthError),
            tap(responseData => {
                this.handleAuthentication(
                    responseData.email,
                    responseData.localId,
                    responseData.idToken,
                    +responseData.expiresIn
                );
            })
        )
    }

    logout() {
        this.user.next(null);
        this.currentEmail = '';
        localStorage.removeItem('userdata');
        if (this.tokenExpirationTimer) {
            clearTimeout(this.tokenExpirationTimer);
        }
        this.tokenExpirationTimer = null;
        this.router.navigate(['/auth']);
    }

    change_password(username: string, oldpass: string, newpass: string) {
        // apparently we need a new token before we try to update.
        return this.http.post<AuthResponseData>(
            'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key='  + environment.firebaseAPIkey,
            {
                email: username,
                password: oldpass,
                returnSecureToken: true
            }
        ).pipe(
            catchError(this.handleAuthError),
            switchMap(
                (response) => this.http.post<AuthResponseData>(
                    'https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + environment.firebaseAPIkey,
                    {
                        'returnSecureToken': true,
                        'password': newpass,
                        'idToken': response.idToken
                    }
                )
                .pipe(
                    tap(responseData => {
                        this.handleAuthentication(
                            responseData.email,
                            responseData.localId,
                            responseData.idToken,
                            +responseData.expiresIn
                        );
                    })
                )
            )
        )
    }

    autoLogin() {
        const userData: {
            email: string,
            id: string,
            _token: string,
            _tokenExpirationDate: string
        } = JSON.parse(localStorage.getItem('userdata'));

        const loadedUser = new User(
            userData.email,
            userData.id,
            userData._token,
            new Date(userData._tokenExpirationDate)
        );

        if (loadedUser.token) {
            const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
            this.autoLogout(expirationDuration);
            this.currentEmail = userData.email;
            this.user.next(loadedUser);
        }
    }

    autoLogout(expirationDuration: number) {
        this.tokenExpirationTimer = setTimeout(
            () => { this.logout },
            expirationDuration
        );
    }

    private handleAuthentication(
        email: string,
        userId: string,
        token: string,
        expiresIn: number
    ) {
        const expirationDate = new Date(
            new Date().getTime() + expiresIn*1000
        );
        const user = new User(
            email,
            userId,
            token,
            expirationDate
        );
        this.user.next(user);
        this.currentEmail = email;
        this.autoLogout(expiresIn*1000);
        localStorage.setItem('userdata', JSON.stringify(user))
        this.current.getCurrentRound()
    }

    private handleAuthError(errorResponse: HttpErrorResponse) {
        console.log(errorResponse);
        let errorMessage = "Unknown error occurred :("
        if (!errorResponse.error || !errorResponse.error.error || !errorResponse.error.error.message) {
            return throwError(errorMessage);
        }
        switch (errorResponse.error.error.message) {
            case "UNAUTHENTICATED":
                errorMessage = "Invalid username/passsword."; break;
            case 'EMAIL_EXISTS':
                errorMessage = 'This e-mail address is already in use.'; break;
            case "TOO_MANY_ATTEMPTS_TRY_LATER : Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.":
                errorMessage = "You have tried logging in too many times; try later."; break;
            case 'EMAIL_NOT_FOUND':
                errorMessage = "No account is associated with that e-mail address."; break;
            case "INVALID_PASSWORD":
                errorMessage = "Your password was incorrect."; break;
        }
        return throwError(errorMessage);
    }

    makePlayerDocument() {
        const write_suffix = "/projects/pga-3-balls/databases/(default)/documents:commit"; 
        const api_url = "https://firestore.googleapis.com/v1" + write_suffix;

        let docpath = "projects/pga-3-balls/databases/(default)/documents/users/" + this.currentEmail; 

        return this.http.post(
            api_url,
            {
                writes: [{"update": {
                    name: docpath,
                    fields: {
                        "user": {"stringValue": this.currentEmail},
                        "handle": {"stringValue": this.currentEmail},
                        "groupsWon": {"integerValue": 0},
                        "groupsLost": {"integerValue": 0},
                        "groupsTied": {"integerValue": 0},
                        "lifetimeUnits": {"doubleValue": 0}
                    }
                }}]
            }
        )
    }
}