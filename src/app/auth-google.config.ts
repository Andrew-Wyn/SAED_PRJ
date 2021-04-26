// This api will come in the next version

import { AuthConfig } from 'angular-oauth2-oidc';

export const googleAuthConfig: AuthConfig = {
  // Url of the Identity Provider
  issuer: 'https://accounts.google.com',

  redirectUri: window.location.origin + '/saed',

  // URL of the SPA to redirect the user after silent refresh
  silentRefreshRedirectUri: window.location.origin + '/saed',

  // The SPA's id. The SPA is registerd with this id at the auth-server
  clientId: '857041042594-daels7me5n4totm455ontedlrjvnv4vo.apps.googleusercontent.com',

  strictDiscoveryDocumentValidation: false,

  // set the scope for the permissions the client should request
  // The first three are defined by OIDC. The 4th is a usecase-specific one
  scope: 'openid profile email',

  showDebugInformation: true,

  sessionChecksEnabled: true
};