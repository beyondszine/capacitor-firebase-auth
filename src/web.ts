import {registerWebPlugin, WebPlugin} from '@capacitor/core';
import firebase from 'firebase/app';
import 'firebase/auth';
import {CapacitorFirebaseAuthPlugin, SignInOptions, SignInResult} from './definitions';
import {facebookSignInWeb} from './providers/facebook.provider';
import {googleSignInWeb} from './providers/google.provider';
import {phoneSignInWeb} from './providers/phone.provider';
import {twitterSignInWeb} from './providers/twitter.provider';

export class CapacitorFirebaseAuthWeb extends WebPlugin implements CapacitorFirebaseAuthPlugin {
  constructor() {
    super({
      name: 'CapacitorFirebaseAuth',
      platforms: ['web']
    });
  }

  async signIn(data: SignInOptions): Promise<SignInResult> {
      const googleProvider = new firebase.auth.GoogleAuthProvider().providerId;
      const facebookProvider = new firebase.auth.FacebookAuthProvider().providerId;
      const twitterProvider = new firebase.auth.TwitterAuthProvider().providerId;
      const phoneProvider = new firebase.auth.PhoneAuthProvider().providerId;

      // TODO: need better strategy for linter to figure it out via switch case itself & not by additional if.
      switch (data.providerId) {
        case googleProvider:{
          if(data.providerId=='google.com')
            return googleSignInWeb(data);
        }
        case twitterProvider:	{
          if(data.providerId=='twitter.com')
            return twitterSignInWeb(data);
        }
        case facebookProvider:	{
          if(data.providerId=='facebook.com')
            return facebookSignInWeb(data);
        }
        // case cfaSignInAppleProvider:	{
        //   if(data.providerId == 'apple.com')
        //     return cfaSignInApple(data);
        // }
        case phoneProvider: {
          if(data.providerId == 'phone')
            return phoneSignInWeb(data);
        }
      }
	  return Promise.reject(`The '${data.providerId}' provider was not supported`);
  }

  async signOut(options: {}): Promise<void> {
      console.log(options);
      return firebase.auth().signOut()
  }
}

const CapacitorFirebaseAuth = new CapacitorFirebaseAuthWeb();
export { CapacitorFirebaseAuth };

// Register as a web plugin
registerWebPlugin(CapacitorFirebaseAuth);
