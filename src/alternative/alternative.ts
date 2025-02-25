import {Plugins} from '@capacitor/core';
import {Observable, throwError} from 'rxjs';

import 'firebase/auth';
import firebase from 'firebase/app';
import {
	AppleSignInOptions,
    AppleSignInResult,
    CapacitorFirebaseAuthPlugin,
	facebookSignInOptions,
    FacebookSignInResult,
	GoogleSignInOptions,
    GoogleSignInResult,
	PhoneSignInOptions,
    PhoneSignInResult,
    SignInOptions, SignInResult,
	TwitterSignInOptions,
    TwitterSignInResult
} from '../definitions';

// @ts-ignore
const plugin: CapacitorFirebaseAuthPlugin = Plugins.CapacitorFirebaseAuth;

/**
 * Call the sign in method on native layer and sign in on web layer with retrieved credentials.
 * @param providerId The provider identification.
 * @param data The provider additional information (optional).
 */
export const cfaSignIn = (data?: SignInOptions): Observable<{userCredential: firebase.auth.UserCredential, result: SignInResult}> => {
	const googleProvider = new firebase.auth.GoogleAuthProvider().providerId;
	const facebookProvider = new firebase.auth.FacebookAuthProvider().providerId;
	const twitterProvider = new firebase.auth.TwitterAuthProvider().providerId;
	const phoneProvider = new firebase.auth.PhoneAuthProvider().providerId;
	switch (data.providerId) {
		case googleProvider:{
			if(data.providerId=='google.com')
				return cfaSignInGoogle(data);
		}
		case twitterProvider:	{
			if(data.providerId=='twitter.com')
				return cfaSignInTwitter(data);
		}
		case facebookProvider:	{
			if(data.providerId=='facebook.com')
				return cfaSignInFacebook(data);
		}
		case cfaSignInAppleProvider:	{
			if(data.providerId == 'apple.com')
				return cfaSignInApple(data);
		}
		case phoneProvider: {
			if(data.providerId == 'phone')
				return cfaSignInPhone(data);
		}
		default:
			return throwError(new Error(`The '${data.providerId}' provider was not supported`));
	}
};

/**
 * Call the Google sign in method on native layer and sign in on web layer, exposing the entire native result
 * for use Facebook API with "user auth" authentication and the entire user credential from Firebase.
 * @return Observable<{user: firebase.User, result: GoogleSignInResult}}>
 * @See Issue #23.
 */
export const cfaSignInGoogle = (data : GoogleSignInOptions): Observable<{userCredential: firebase.auth.UserCredential, result: GoogleSignInResult}> => {
	return new Observable(observer => {
		// get the provider id
		const providerId = firebase.auth.GoogleAuthProvider.PROVIDER_ID;

		// native sign in
		plugin.signIn({providerId,data}).then((result: GoogleSignInResult) => {
			// create the credentials
			const credential = firebase.auth.GoogleAuthProvider.credential(result.idToken, result.accessToken);

			// web sign in
			firebase.app().auth().signInWithCredential(credential)
				.then((userCredential: firebase.auth.UserCredential) => {
					observer.next({userCredential, result});
					observer.complete();
				})
				.catch((reject: any) => {
					observer.error(reject);
				});
		}).catch(reject => {
			observer.error(reject);
		});
	});
};

/**
 * Call the Facebook sign in method on native and sign in on web layer, exposing the entire native result
 * for use Facebook API with "user auth" authentication and the entire user credential from Firebase.
 * @return Observable<{user: firebase.User, result: FacebookSignInResult}}>
 * @See Issue #23.
 */
// @ts-ignore
export const cfaSignInFacebook = (data : facebookSignInOptions): Observable<{userCredential: firebase.auth.UserCredential, result: FacebookSignInResult}> => {
	return new Observable(observer => {
		// get the provider id
		const providerId = firebase.auth.FacebookAuthProvider.PROVIDER_ID;

		// native sign in
		plugin.signIn({providerId}).then((result: FacebookSignInResult) => {
			// create the credentials
			const credential = firebase.auth.FacebookAuthProvider.credential(result.idToken);

			// web sign in
			firebase.app().auth().signInWithCredential(credential)
				.then((userCredential: firebase.auth.UserCredential) => {
					observer.next({userCredential, result});
					observer.complete();
				})
				.catch((reject: any) => observer.error(reject));

		}).catch(reject => observer.error(reject));
	});
};

/**
 * Call the Twitter sign in method on native and sign in on web layer, exposing the entire native result
 * for use Twitter User API with "user auth" authentication and the entire user credential from Firebase.
 * @return Observable<{user: firebase.User, result: TwitterSignInResult}}>
 * @See Issue #23.
 */
// @ts-ignore
export const cfaSignInTwitter = (data: TwitterSignInOptions): Observable<{userCredential: firebase.auth.UserCredential, result: TwitterSignInResult}> => {
	return new Observable(observer => {
		// get the provider id
		const providerId = firebase.auth.TwitterAuthProvider.PROVIDER_ID;

		// native sign in
		plugin.signIn({providerId}).then((result :TwitterSignInResult) => {
			// create the credentials
			const credential = firebase.auth.TwitterAuthProvider.credential(result.idToken, result.secret);

			// web sign in
			firebase.app().auth().signInWithCredential(credential)
				.then((userCredential: firebase.auth.UserCredential) => {
					observer.next({userCredential, result});
					observer.complete();
				})
				.catch((reject: any) => observer.error(reject));

		}).catch(reject => observer.error(reject));
	});
};

export const cfaSignInAppleProvider = 'apple.com';

/**
 * Call the Apple sign in method on native and sign in on web layer with retrieved credentials.
 */
// @ts-ignore
export const cfaSignInApple = (data: AppleSignInOptions): Observable<{userCredential: firebase.auth.UserCredential, result: AppleSignInResult}> => {
    return new Observable(observer => {
        // native sign in
        plugin.signIn({providerId: cfaSignInAppleProvider}).then((result: AppleSignInResult) => {
            const {idToken, rawNonce} = result;

            const provider = new firebase.auth.OAuthProvider('apple.com');
            provider.addScope('email');
            provider.addScope('name');

            const credential = provider.credential({idToken, rawNonce})

            // web sign in
            firebase.app().auth().signInWithCredential(credential)
                .then((userCredential: firebase.auth.UserCredential) => {
                    observer.next({userCredential, result});
                    observer.complete();
                })
                .catch((reject: any) => observer.error(reject));
        }).catch(reject => observer.error(reject));
    });
}

/**
 * Call the Phone verification sign in, handling send and retrieve to code on native, but only sign in on web with retrieved credentials.
 * This implementation is just to keep everything in compliance if others providers in this alternative calls.
 * @param phone The user phone number.
 * @param verificationCode The verification code sent by SMS (optional).
 */
export const cfaSignInPhone = (data : PhoneSignInOptions) : Observable<{userCredential: firebase.auth.UserCredential, result: PhoneSignInResult}>  => {
	return new Observable(observer => {
		// get the provider id
		const providerId = firebase.auth.PhoneAuthProvider.PROVIDER_ID;

		plugin.signIn({providerId, data}).then((result: PhoneSignInResult) => {
			// if there is no verification code
			if (!result.verificationCode) {
				return observer.complete();
			}

			// create the credentials
			const credential = firebase.auth.PhoneAuthProvider.credential(result.verificationId, result.verificationCode);

			// web sign in
			firebase.app().auth().signInWithCredential(credential)
				.then((userCredential: firebase.auth.UserCredential) => {
					observer.next({userCredential, result});
					observer.complete();
				})
				.catch((reject: any) => observer.error(reject));

		}).catch(reject => observer.error(reject));

	});
};

// re-exporting the unchanged functions from facades for simple imports.
export {cfaSignInPhoneOnCodeReceived, cfaSignInPhoneOnCodeSent, cfaSignOut} from '../facades'
