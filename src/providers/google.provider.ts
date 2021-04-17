import firebase from 'firebase/app';
import 'firebase/auth';
import {GoogleSignInOptions, GoogleSignInResult} from '../definitions';
import OAuthCredential = firebase.auth.OAuthCredential;

export const googleSignInWeb: (options: GoogleSignInOptions) => Promise<GoogleSignInResult>
    = async (options) => {
        if(options.providerId!='google.com'){
            Promise.reject("Invalid provider Id for Google Login");
        }

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().useDeviceLanguage();

            // for adding scopes given by user as GoogleSignInOptions. 
            options.scopes.forEach(scope => provider.addScope(scope) );
            const userCredential = await firebase.auth().signInWithPopup(provider);

            const {credential}: { credential: OAuthCredential } = userCredential;
            return new GoogleSignInResult(credential.idToken, credential.accessToken);

        } catch (e) {
            return Promise.reject(e);
        }
    }
