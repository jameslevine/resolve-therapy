import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";
import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } from "./config";

const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_CLIENT_ID,
});

function getCognitoUser(email: string): CognitoUser {
  return new CognitoUser({ Username: email, Pool: userPool });
}

export function signUp(email: string, password: string, name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const attributes = [
      new CognitoUserAttribute({ Name: "email", Value: email }),
      new CognitoUserAttribute({ Name: "name", Value: name }),
    ];
    userPool.signUp(email, password, attributes, [], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function confirmSignUp(email: string, code: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function resendConfirmationCode(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.resendConfirmationCode((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export function signIn(email: string, password: string): Promise<CognitoUserSession> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });
    user.authenticateUser(authDetails, {
      onSuccess: (session) => resolve(session),
      onFailure: (err) => reject(err),
    });
  });
}

export function signOut(): void {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  return new Promise((resolve) => {
    const user = userPool.getCurrentUser();
    if (!user) return resolve(null);
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return resolve(null);
      resolve(session);
    });
  });
}

export function getIdToken(): Promise<string | null> {
  return getCurrentSession().then((session) =>
    session ? session.getIdToken().getJwtToken() : null,
  );
}

export function getCurrentUserAttributes(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error("No current user"));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return reject(new Error("Invalid session"));
      user.getUserAttributes((attrErr, attrs) => {
        if (attrErr || !attrs) return reject(attrErr);
        const result: Record<string, string> = {};
        attrs.forEach((attr) => {
          result[attr.getName()] = attr.getValue();
        });
        resolve(result);
      });
    });
  });
}

export function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error("No current user"));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return reject(new Error("Invalid session"));
      user.changePassword(oldPassword, newPassword, (changeErr) => {
        if (changeErr) return reject(changeErr);
        resolve();
      });
    });
  });
}

export function updateUserAttributes(attributes: Record<string, string>): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error("No current user"));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return reject(new Error("Invalid session"));
      const attrs = Object.entries(attributes).map(
        ([key, value]) => new CognitoUserAttribute({ Name: key, Value: value }),
      );
      user.updateAttributes(attrs, (updateErr) => {
        if (updateErr) return reject(updateErr);
        resolve();
      });
    });
  });
}

export function deleteUser(): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = userPool.getCurrentUser();
    if (!user) return reject(new Error("No current user"));
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) return reject(new Error("Invalid session"));
      user.deleteUser((deleteErr) => {
        if (deleteErr) return reject(deleteErr);
        resolve();
      });
    });
  });
}

export function forgotPassword(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

export function confirmForgotPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const user = getCognitoUser(email);
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}
