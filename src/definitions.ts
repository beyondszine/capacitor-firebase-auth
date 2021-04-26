import firebase from 'firebase/app';
import 'firebase/auth';

declare module "@capacitor/core" {
  interface PluginRegistry {
    CapacitorFirebaseAuth?: CapacitorFirebaseAuthPlugin;
  }
}

export interface CapacitorFirebaseAuthPlugin {
  signIn(options: {providerId: string, data?: SignInOptions}): Promise<SignInResult>;
  signOut(options: {}): Promise<void>;
}

export class GoogleSignInResult{
  providerId = firebase.auth.GoogleAuthProvider.PROVIDER_ID;
  constructor(public idToken: string, public accessToken : string) {
  }
}

export class TwitterSignInResult {
  providerId = firebase.auth.TwitterAuthProvider.PROVIDER_ID;
  constructor(public idToken: string, public secret: string) {
  }
}

export class FacebookSignInResult {
  providerId = firebase.auth.FacebookAuthProvider.PROVIDER_ID;
  constructor(public idToken: string) {
  }
}

export class AppleSignInResult {
  providerId = firebase.auth.FacebookAuthProvider.PROVIDER_ID;
  constructor(public idToken: string, public rawNonce: string) {
  }
}

export class PhoneSignInResult {
  providerId = firebase.auth.PhoneAuthProvider.PROVIDER_ID;
  constructor(public verificationId: string, public verificationCode: string) {
  }
}

export type SignInResult = GoogleSignInResult | TwitterSignInResult | FacebookSignInResult | PhoneSignInResult;

export interface PhoneSignInOptions {
  providerId : 'phone',
  phone: string,
  verificationCode?: string
}

export interface GoogleSignInOptions {
  providerId : 'google.com',
  scopes: Array<string>;
}


// THIS IS DONE BECAUSE OF LACK OF KNOWLEDGE AS OF NOW
export interface TwitterSignInOptions {
  providerId : 'twitter.com',
  [key: string] : any
}

export interface AppleSignInOptions {
  providerId : 'apple.com',
  [key: string] : any
}

export interface facebookSignInOptions {
  providerId : 'facebook.com',
  [key: string] : any
}

export type SignInOptions = PhoneSignInOptions | GoogleSignInOptions | TwitterSignInOptions | facebookSignInOptions | AppleSignInOptions;
// export type SignInOptions = PhoneSignInOptions | GoogleSignInOptions ;

export interface SignInResponseBody {
  userCredentials : firebase.auth.UserCredential,
  credentialsOpts : {
      [key: string] : any
  } 
}