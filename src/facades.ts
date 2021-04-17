import {Capacitor, Plugins, registerWebPlugin} from '@capacitor/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import {Observable, throwError} from 'rxjs';
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
    SignInOptions,
	TwitterSignInOptions,
    TwitterSignInResult
} from './definitions';
import {CapacitorFirebaseAuth} from './web';

const plugin: CapacitorFirebaseAuthPlugin = Plugins.CapacitorFirebaseAuth;

if (Capacitor.platform === 'web') {
    registerWebPlugin(CapacitorFirebaseAuth)
}

/**
 * Call the sign in method on native layer and sign in on web layer with retrieved credentials.
 * @param providerId The provider identification.
 * @param data The provider additional information (optional).
 */
export const cfaSignIn = (data?: SignInOptions): Observable<firebase.User> => {
	const googleProvider = new firebase.auth.GoogleAuthProvider().providerId;
	const facebookProvider = new firebase.auth.FacebookAuthProvider().providerId;
	const twitterProvider = new firebase.auth.TwitterAuthProvider().providerId;
	const phoneProvider = new firebase.auth.PhoneAuthProvider().providerId;
	// TODO: need better strategy for linter to figure it out via switch case itself & not by additional if.
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
 * Call the Google sign in method on native layer and sign in on web layer with retrieved credentials.
 */
export const cfaSignInGoogle = (_data : GoogleSignInOptions): Observable<firebase.User> => {
	return new Observable(observer => {
		// get the provider id
		// const providerId = firebase.auth.GoogleAuthProvider.PROVIDER_ID;

		// native sign in
		plugin.signIn(_data)
		.then((result: GoogleSignInResult) => {
			// create the credentials
			const credential = firebase.auth.GoogleAuthProvider.credential(result.idToken, result.accessToken);

			// web sign in
			firebase.app().auth().signInWithCredential(credential)
				.then((userCredential: firebase.auth.UserCredential) => {
					observer.next(userCredential.user);
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
 * Call the Twitter sign in method on native and sign in on web layer with retrieved credentials.
 */
export const cfaSignInTwitter = (_data : TwitterSignInOptions): Observable<firebase.User> => {
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
					observer.next(userCredential.user);
					observer.complete();
				})
				.catch((reject: any) => observer.error(reject));

		}).catch(reject => observer.error(reject));
	});
};

/**
 * Call the Facebook sign in method on native and sign in on web layer with retrieved credentials.
 */
export const cfaSignInFacebook = (_data: facebookSignInOptions): Observable<firebase.User> => {
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
					observer.next(userCredential.user);
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
export const cfaSignInApple = (_data: AppleSignInOptions): Observable<firebase.User> => {
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
                    observer.next(userCredential.user);
                    observer.complete();
                })
                .catch((reject: any) => observer.error(reject));
        }).catch(reject => observer.error(reject));
    });
}

/**
 * Call the Phone verification sign in, handling send and retrieve to code on native, but only sign in on web with retrieved credentials.
 * @param phone The user phone number.
 * @param verificationCode The verification code sent by SMS (optional).
 */
export const cfaSignInPhone = (_data : PhoneSignInOptions) : Observable<firebase.User>  => {
	return new Observable(observer => {
		// get the provider id
		// const providerId = firebase.auth.PhoneAuthProvider.PROVIDER_ID;

		plugin.signIn(_data).then((result: PhoneSignInResult) => {
			// if there is no verification code
			if (!result.verificationCode) {
				return observer.complete();
			}

			// create the credentials
			const credential = firebase.auth.PhoneAuthProvider.credential(result.verificationId, result.verificationCode);

			// web sign in
			firebase.app().auth().signInWithCredential(credential)
				.then((userCredential: firebase.auth.UserCredential) => {
					observer.next(userCredential.user);
					observer.complete();
				})
				.catch((reject: any) => observer.error(reject));

		}).catch(reject => observer.error(reject));

	});
};

/**
 * Observable of one notification of <code>On Code Sent</code>event from Phone Verification process.
 */
export const cfaSignInPhoneOnCodeSent = () : Observable<string> => {
	return new Observable<string>(observer => {
		// @ts-ignore
		return plugin.addListener('cfaSignInPhoneOnCodeSent', (event: { verificationId: string }) => {
			observer.next(event.verificationId);
			observer.complete();
		});
	});
};

/**
 * Observable of one notification of <code>On Code Received</code> event from Phone Verification process.
 */
export const cfaSignInPhoneOnCodeReceived = () : Observable<{verificationId: string, verificationCode: string}> => {
	return new Observable<{verificationId: string, verificationCode: string}>(observer => {
		// @ts-ignore
		return plugin.addListener('cfaSignInPhoneOnCodeReceived', (event: { verificationId: string, verificationCode: string }) => {
			observer.next(event);
			observer.complete();
		});
	});
};

/**
 * Call Google sign out method on native and web layers.
 */
export const cfaSignOut = (): Observable<void> => {
	return new Observable(observer => {
		plugin.signOut({}).then(() => {
			// web sign out
			firebase.app().auth().signOut()
				.then(() => {
					observer.next();
					observer.complete();
				})
				.catch((reject: any) => observer.error(reject));
		});
	});
};
